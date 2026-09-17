#!/usr/bin/env node
/**
 * Verify every PDF in rag/docs/ before ingesting.
 *
 * A scanned PDF with no text layer parses "successfully" and yields nothing, so
 * ingest.js would silently skip it. This reports pages, extracted characters,
 * and chars/page so image-only books are obvious up front.
 *
 *   node rag/check-docs.mjs
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const DOCS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "docs");
const MIN_CHARS_PER_PAGE = 200; // below this it's almost certainly scanned images

const files = (await fs.readdir(DOCS_DIR))
  .filter((f) => f.toLowerCase().endsWith(".pdf"))
  .sort();

console.log(`Checking ${files.length} PDFs in rag/docs/\n`);
const rows = [];

for (const file of files) {
  const full = path.join(DOCS_DIR, file);
  const { size } = await fs.stat(full);
  try {
    const parser = new pdfParse.PDFParse({ data: await fs.readFile(full) });
    let text = "", pages = 0;
    try {
      const parsed = await parser.getText();
      text = parsed.text || "";
      pages = parsed.pages?.length ?? parsed.total ?? 0;
    } finally {
      await parser.destroy();
    }
    const chars = text.length;
    const perPage = pages ? Math.round(chars / pages) : 0;
    const ok = perPage >= MIN_CHARS_PER_PAGE;
    rows.push({ file, mb: size / 1048576, pages, chars, perPage, ok });
    console.log(
      `${ok ? "OK  " : "SCAN"} ${file.slice(0, 46).padEnd(46)} ` +
        `${String(pages).padStart(5)}p ${String(Math.round(chars / 1000)).padStart(6)}k chars ` +
        `${String(perPage).padStart(5)}/pg`
    );
  } catch (err) {
    rows.push({ file, mb: size / 1048576, error: err.message });
    console.log(`FAIL ${file.slice(0, 46).padEnd(46)} ${err.message}`);
  }
}

const good = rows.filter((r) => r.ok);
const scanned = rows.filter((r) => r.ok === false);
const failed = rows.filter((r) => r.error);

console.log(`\n${"=".repeat(72)}`);
console.log(`Usable:  ${good.length} files, ${good.reduce((s, r) => s + r.pages, 0)} pages, ` +
  `~${Math.round(good.reduce((s, r) => s + r.chars, 0) / 1000)}k chars`);
if (scanned.length) {
  console.log(`\nNo text layer (needs OCR, ingest will skip these):`);
  for (const r of scanned) console.log(`  - ${r.file} (${r.perPage} chars/page)`);
}
if (failed.length) {
  console.log(`\nFailed to parse:`);
  for (const r of failed) console.log(`  - ${r.file}: ${r.error}`);
}
