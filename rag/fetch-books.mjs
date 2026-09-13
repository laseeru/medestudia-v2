#!/usr/bin/env node
/**
 * Fetch ECIMED / Biblioteca Virtual de Salud textbooks into rag/docs/.
 *
 * The catalog lives on www.ecimed.sld.cu; the PDFs themselves live on
 * bvs.sld.cu. Those are different hosts and may not both be reachable from
 * every network, so building the catalog and downloading are separate steps.
 *
 *   node rag/fetch-books.mjs catalog            # crawl catalog -> rag/books.json
 *   node rag/fetch-books.mjs list [filter]      # show books matching filter
 *   node rag/fetch-books.mjs download [filter]  # download matches -> rag/docs/
 *
 * Filter is a case/accent-insensitive substring, e.g. "medicina general".
 * Downloads skip files already present, so re-running resumes a partial batch.
 */
import fs from "fs/promises";
import { createWriteStream } from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_URL = "http://www.ecimed.sld.cu/libros/";
const BOOKS_FILE = path.join(__dirname, "books.json");
const DOCS_DIR = path.join(__dirname, "docs");

const REQUEST_TIMEOUT_MS = 45000;
const POLITE_DELAY_MS = 400; // don't hammer a small public library server
const DOWNLOAD_CONCURRENCY = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Strip accents so "Pediatría" matches a "pediatria" filter. */
function fold(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function decodeEntities(s) {
  return s
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&#8220;|&#8221;|&quot;/g, '"')
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, "")
    .trim();
}

async function get(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "MedEstudia-RAG/1.0 (educational use)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

/** Pull {title, pdf} pairs out of one catalog page. */
function parsePage(html) {
  const out = [];
  // Each entry is a post block; find the title then the nearest PDF link after it.
  const blocks = html.split(/<article|<div class="post/i).slice(1);
  for (const block of blocks) {
    const titleMatch =
      block.match(/<h2[^>]*entry-title[^>]*>\s*<a[^>]*>(.*?)<\/a>/is) ||
      block.match(/<h2[^>]*>\s*<a[^>]*>(.*?)<\/a>/is);
    const pdfMatch = block.match(
      /href="(https?:\/\/(?:www\.)?bvs\.sld\.cu\/libros\/[^"]+\.(?:pdf|epub))"/i
    );
    if (!titleMatch || !pdfMatch) continue;
    const title = decodeEntities(titleMatch[1].replace(/<[^>]+>/g, ""));
    if (title) out.push({ title, url: pdfMatch[1] });
  }
  // Fallback: page layout differs — collect every PDF link with nearby text.
  if (out.length === 0) {
    const links = [...html.matchAll(
      /href="(https?:\/\/(?:www\.)?bvs\.sld\.cu\/libros\/[^"]+\.(?:pdf|epub))"/gi
    )];
    for (const m of links) out.push({ title: slugToTitle(m[1]), url: m[1] });
  }
  return out;
}

function slugToTitle(url) {
  const slug = url.split("/libros/")[1]?.split("/")[0] ?? "libro";
  return slug.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function safeFilename(title, url) {
  const ext = path.extname(new URL(url).pathname) || ".pdf";
  const base = title
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return `${base}${ext}`;
}

async function crawlCatalog() {
  console.log(`Crawling ${CATALOG_URL} ...`);
  const first = await (await get(CATALOG_URL)).text();
  const pageNums = [...first.matchAll(/\/libros\/page\/(\d+)/g)].map((m) => +m[1]);
  const lastPage = pageNums.length ? Math.max(...pageNums) : 1;
  console.log(`Catalog has ${lastPage} pages.`);

  const seen = new Map();
  for (const { title, url } of parsePage(first)) seen.set(url, title);

  for (let p = 2; p <= lastPage; p++) {
    try {
      const html = await (await get(`${CATALOG_URL}page/${p}/`)).text();
      for (const { title, url } of parsePage(html)) seen.set(url, title);
      if (p % 10 === 0 || p === lastPage) {
        console.log(`  page ${p}/${lastPage} — ${seen.size} books so far`);
      }
    } catch (err) {
      console.warn(`  page ${p} failed: ${err.message}`);
    }
    await sleep(POLITE_DELAY_MS);
  }

  const books = [...seen.entries()]
    .map(([url, title]) => ({ title, url }))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));

  await fs.writeFile(BOOKS_FILE, JSON.stringify(books, null, 2), "utf-8");
  console.log(`\nWrote ${books.length} books to ${path.relative(process.cwd(), BOOKS_FILE)}`);
}

async function loadBooks(filter) {
  let raw;
  try {
    raw = await fs.readFile(BOOKS_FILE, "utf-8");
  } catch {
    console.error(`No ${path.basename(BOOKS_FILE)} yet. Run: node rag/fetch-books.mjs catalog`);
    process.exit(1);
  }
  const books = JSON.parse(raw);
  if (!filter) return books;
  const needle = fold(filter);
  return books.filter((b) => fold(b.title).includes(needle) || fold(b.url).includes(needle));
}

async function listBooks(filter) {
  const books = await loadBooks(filter);
  console.log(`${books.length} book(s)${filter ? ` matching "${filter}"` : ""}:\n`);
  for (const b of books) console.log(`  ${b.title}\n    ${b.url}`);
}

async function downloadOne(book) {
  await fs.mkdir(DOCS_DIR, { recursive: true });
  const dest = path.join(DOCS_DIR, safeFilename(book.title, book.url));
  try {
    const st = await fs.stat(dest);
    if (st.size > 0) return { status: "skip", dest };
  } catch {
    /* not downloaded yet */
  }
  const tmp = `${dest}.part`;
  const res = await get(book.url);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
  const { size } = await fs.stat(tmp);
  if (size < 1024) {
    await fs.unlink(tmp).catch(() => {});
    throw new Error(`suspiciously small (${size} bytes) — probably an error page`);
  }
  await fs.rename(tmp, dest);
  return { status: "ok", dest, size };
}

async function downloadBooks(filter) {
  const books = await loadBooks(filter);
  if (books.length === 0) {
    console.log("Nothing matched that filter.");
    return;
  }
  console.log(`Downloading ${books.length} book(s) into rag/docs/ ...\n`);

  let ok = 0, skipped = 0, failed = 0;
  const queue = [...books];
  const workers = Array.from({ length: DOWNLOAD_CONCURRENCY }, async () => {
    while (queue.length) {
      const book = queue.shift();
      try {
        const r = await downloadOne(book);
        if (r.status === "skip") {
          skipped++;
          console.log(`  = ${book.title} (already have it)`);
        } else {
          ok++;
          console.log(`  + ${book.title} (${Math.round(r.size / 1024)} KB)`);
        }
      } catch (err) {
        failed++;
        console.warn(`  ! ${book.title} — ${err.message}`);
      }
      await sleep(POLITE_DELAY_MS);
    }
  });
  await Promise.all(workers);

  console.log(`\nDone: ${ok} downloaded, ${skipped} already present, ${failed} failed.`);
  if (ok > 0) console.log(`Next: node rag/ingest.js`);
}

/**
 * The PDFs live on bvs.sld.cu, which is only resolvable from inside the Cuban
 * health network. Check reachability before queueing hundreds of downloads.
 */
async function doctor() {
  const hosts = [
    ["catalog (ECIMED)", "http://www.ecimed.sld.cu/libros/"],
    ["book pages (BVS Cuba)", "http://www.bvscuba.sld.cu/"],
    ["PDF host (bvs.sld.cu)", "http://www.bvs.sld.cu/libros/"],
  ];
  let pdfHostOk = false;
  for (const [label, url] of hosts) {
    process.stdout.write(`${label.padEnd(24)} `);
    try {
      const res = await get(url);
      console.log(`OK (HTTP ${res.status})`);
      if (label.startsWith("PDF host")) pdfHostOk = true;
    } catch (err) {
      const why = /ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(err.message)
        ? "cannot resolve — you are outside the sld.cu network"
        : err.message;
      console.log(`FAIL (${why})`);
    }
  }
  console.log(
    pdfHostOk
      ? "\nPDF host reachable — downloads should work."
      : "\nPDF host unreachable. bvs.sld.cu lives on the Infomed health intranet,\n" +
          "not the public internet — an ETECSA/Nauta connection is not enough.\n" +
          "Options: connect through Infomed's OpenVPN or proxy.sld.cu:3128 with an\n" +
          "sld.cu account, use a faculty machine, or source the PDFs manually."
  );
}

const [cmd, ...rest] = process.argv.slice(2);
const filter = rest.join(" ").trim() || null;

switch (cmd) {
  case "doctor":
    await doctor();
    break;
  case "catalog":
    await crawlCatalog();
    break;
  case "list":
    await listBooks(filter);
    break;
  case "download":
    await downloadBooks(filter);
    break;
  default:
    console.log(`Usage:
  node rag/fetch-books.mjs doctor             Check which sld.cu hosts you can reach
  node rag/fetch-books.mjs catalog            Crawl the ECIMED catalog -> rag/books.json
  node rag/fetch-books.mjs list [filter]      List books (optionally filtered)
  node rag/fetch-books.mjs download [filter]  Download matches into rag/docs/

Examples:
  node rag/fetch-books.mjs list "medicina general"
  node rag/fetch-books.mjs download "pediatr"
  node rag/fetch-books.mjs download            # everything (large!)`);
}
