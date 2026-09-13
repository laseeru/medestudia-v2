import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { describeSource, findUnmapped, EXCLUDED } from "./sources.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_DIR = path.join(__dirname, "docs");
const OUTPUT_DIR = path.join(__dirname, "output");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "chunks.json");
const MIN_SENTENCES_PER_CHUNK = 3;
const MAX_SENTENCES_PER_CHUNK = 5;
const MIN_WORDS_PER_CHUNK = 40;
// Carry the tail of each chunk into the next so an idea split across a
// boundary is still retrievable from either side.
const OVERLAP_SENTENCES = 1;

async function extractText(pdfPath) {
  const buffer = await fs.readFile(pdfPath);
  const parser = new pdfParse.PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return parsed.text || "";
  } finally {
    await parser.destroy();
  }
}

function cleanText(rawText) {
  return rawText
    .replace(/-\s+/g, "") // fix split words: "gaseo- so" -> "gaseoso"
    .replace(/Page \d+/gi, "")
    .replace(/-\s*\d+\s+of\s+\d+/gi, "")
    .replace(/(^|\s)-\d{1,4}(?=\s|$)/g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      // Remove page marker lines (e.g., "12", "Página 12", "-- 1 of 548 --")
      if (/^\d{1,4}$/.test(line)) return false;
      if (/^(page|página)\s+\d{1,4}$/i.test(line)) return false;
      if (/^[-\s]*\d+\s+of\s+\d+[-\s]*$/i.test(line)) return false;
      return true;
    })
    .join("\n");
}

/** Repair hyphenation artefacts and collapse whitespace within one passage. */
function normalizePassage(text) {
  return text
    .replace(
      /\b([a-záéíóúüñ]{3,})\s+(dad|ción|ciones|mente|tico|tica|sión|logía|ismo|ista|izar|able|ables|encia|encias)\b/gi,
      "$1$2",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeAndCleanLines(rawText) {
  return cleanText(rawText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizedBulletLine(line))
    .filter(Boolean);
}

const SECTION_WORDS =
  /^(definici[oó]n|concepto|introducci[oó]n|objetivos?|clasificaci[oó]n|etiolog[ií]a|epidemiolog[ií]a|fisiopatolog[ií]a|patogenia|anatom[ií]a|histolog[ií]a|cuadro cl[ií]nico|manifestaciones cl[ií]nicas|diagn[oó]stico|diagn[oó]stico diferencial|ex[aá]menes complementarios|tratamiento|pron[oó]stico|prevenci[oó]n|complicaciones|bibliograf[ií]a|resumen)\b/i;

/**
 * Headings carry the context a chunk needs to be citable ("Medicina Interna
 * Tomo II — Insuficiencia cardíaca" beats "chunk 8412"). They survive PDF
 * extraction as short lines with no terminal punctuation.
 */
function isHeading(line, prevLine) {
  const t = line.trim();
  if (t.length < 3 || t.length > 90) return false;
  if (/[.,;]$/.test(t)) return false;
  if (/^Punto clave:/.test(t)) return false;
  if (/^\s*\d+[).]\s/.test(t)) return false;

  const letters = t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  if (letters.length < 3) return false;

  // PDF extraction breaks sentences across lines, so a "line" is often a
  // mid-clause fragment. A real heading starts a new thought: the line before
  // it must have finished one.
  const followsSentenceEnd = prevLine == null || /[.!?:]$/.test(prevLine.trim());
  if (!followsSentenceEnd) return false;

  // Continuations start lowercase; headings do not.
  if (/^[a-záéíóúüñ]/.test(t)) return false;

  if (/^cap[ií]tulo\b/i.test(t)) return true;

  // Bare section labels only ("Tratamiento", "Cuadro clínico") — a comma or a
  // long tail means it is prose that happens to open with the same word.
  if (SECTION_WORDS.test(t) && !t.includes(",") && t.split(/\s+/).length <= 4) return true;

  // ALL CAPS short lines are almost always headings in these texts.
  const isUpper = letters === letters.toUpperCase();
  if (isUpper && t.split(/\s+/).length <= 12) return true;

  return false;
}

/** "Tratamiento del factor cervical 62" -> "Tratamiento del factor cervical". */
function cleanHeading(line) {
  return line
    .replace(/:$/, "")
    .replace(/\s+\d{1,4}$/, "") // trailing page number from TOC lines
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * A section shorter than one chunk would otherwise vanish, since chunking runs
 * per section. Fold those into the preceding section so no prose is lost; the
 * enclosing heading stays as the citation.
 */
function mergeSmallSections(sections) {
  const out = [];
  for (const section of sections) {
    const tooSmall = splitIntoSentences(section.text).length < MIN_SENTENCES_PER_CHUNK;
    if (tooSmall && out.length > 0) {
      const prev = out[out.length - 1];
      prev.text = `${prev.text} ${section.text}`.trim();
    } else {
      out.push({ ...section });
    }
  }
  return out;
}

/** Split cleaned lines into {heading, body} sections. */
function splitIntoSections(lines) {
  const sections = [];
  let heading = null;
  let body = [];
  const flush = () => {
    const text = normalizePassage(body.join(" "));
    if (text) sections.push({ heading, text });
    body = [];
  };
  lines.forEach((line, i) => {
    if (isHeading(line, i > 0 ? lines[i - 1] : null)) {
      flush();
      heading = cleanHeading(line) || null;
    } else {
      body.push(line);
    }
  });
  flush();

  // A heading that spans a huge run of text is not really labelling that text —
  // detection just missed every heading in between. Claiming it as the citation
  // would be worse than admitting we do not know the section.
  const MAX_TRUSTED_SECTION_CHARS = 12000;
  for (const section of sections) {
    if (section.heading && section.text.length > MAX_TRUSTED_SECTION_CHARS) {
      section.heading = null;
    }
  }

  return mergeSmallSections(sections);
}

function normalizedBulletLine(line) {
  if (line.includes("•")) {
    const bullets = line
      .split("•")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((item) => `Punto clave: ${item.replace(/[;,:]\s*$/, "")}.`);
    return bullets.join(" ");
  }

  if (/^[-*•]\s+/.test(line)) {
    const content = line.replace(/^[-*•]\s+/, "").trim().replace(/[;,:]\s*$/, "");
    return content ? `Punto clave: ${content}.` : "";
  }

  return line;
}

function splitIntoSentences(text) {
  const normalized = text.replace(/\n+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized.split(/(?<=[.!?])\s+/);
  return sentences.filter((sentence) => sentence.trim().length > 0);
}

function isSectionBoundary(sentence) {
  const s = sentence.trim().toLowerCase();
  return (
    /^(definici[oó]n|objetivo|objetivos|clasificaci[oó]n|etiolog[ií]a|fisiopatolog[ií]a|diagn[oó]stico|tratamiento|prevenci[oó]n)\b/.test(
      s,
    ) ||
    /\b(en primer lugar|por otra parte|en resumen)\b/.test(s)
  );
}

function isNumberedListItem(sentence) {
  return /^\s*\d+[\).\s]/.test(sentence);
}

function finalizeChunk(sentences) {
  const text = sentences.join(" ").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function chunkText(text) {
  const sentences = splitIntoSentences(text);
  if (sentences.length === 0) return [];

  const chunks = [];
  let currentSentences = [];
  let chunkHasNumberedList = false;

  for (let i = 0; i < sentences.length; i += 1) {
    const sentence = sentences[i];
    const nextSentence = sentences[i + 1] ?? "";
    const sentenceIsNumbered = isNumberedListItem(sentence);
    const nextIsNumbered = isNumberedListItem(nextSentence);

    if (
      isSectionBoundary(sentence) &&
      !sentenceIsNumbered &&
      !chunkHasNumberedList &&
      currentSentences.length >= MIN_SENTENCES_PER_CHUNK
    ) {
      const chunk = finalizeChunk(currentSentences);
      if (chunk) chunks.push(chunk);
      currentSentences = [];
    }

    currentSentences.push(sentence);
    if (sentenceIsNumbered) chunkHasNumberedList = true;

    // Keep numbered structures in one chunk; do not split mid-list.
    const listCanClose = chunkHasNumberedList && !sentenceIsNumbered && !nextIsNumbered;
    if (listCanClose && currentSentences.length >= MIN_SENTENCES_PER_CHUNK) {
      const chunk = finalizeChunk(currentSentences);
      if (chunk) chunks.push(chunk);
      currentSentences = [];
      chunkHasNumberedList = false;
      continue;
    }

    if (!chunkHasNumberedList && currentSentences.length >= MAX_SENTENCES_PER_CHUNK) {
      const chunk = finalizeChunk(currentSentences);
      if (chunk) chunks.push(chunk);
      currentSentences = [];
    }

    // Safety guard: close long list chunks only after list ends.
    if (chunkHasNumberedList && currentSentences.length >= MAX_SENTENCES_PER_CHUNK + 1 && !nextIsNumbered) {
      const chunk = finalizeChunk(currentSentences);
      if (chunk) chunks.push(chunk);
      currentSentences = [];
      chunkHasNumberedList = false;
    }
  }

  if (currentSentences.length >= MIN_SENTENCES_PER_CHUNK) {
    const chunk = finalizeChunk(currentSentences);
    if (chunk) chunks.push(chunk);
  } else if (currentSentences.length > 0 && chunks.length > 0) {
    // Merge short tail into previous chunk to preserve complete ideas.
    chunks[chunks.length - 1] = finalizeChunk([
      chunks[chunks.length - 1],
      currentSentences.join(" "),
    ]);
  } else if (currentSentences.length > 0) {
    const chunk = finalizeChunk(currentSentences);
    if (chunk) chunks.push(chunk);
  }

  return chunks;
}

function isValidChunk(chunk) {
  const words = chunk.split(/\s+/).filter(Boolean);
  if (chunk.length < 100) return false;
  if (words.length < MIN_WORDS_PER_CHUNK) return false;
  if (words.length === 0) return false;

  const upperWords = words.filter((word) => {
    const lettersOnly = word.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
    if (!lettersOnly) return false;
    return lettersOnly === lettersOnly.toUpperCase();
  });
  const upperRatio = upperWords.length / words.length;
  if (upperRatio > 0.4) return false;

  if (/\b(CUADRO|TABLA)\b/i.test(chunk)) return false;

  return true;
}

function hasExplanatoryContent(chunk) {
  const lower = chunk.toLowerCase();
  const explanatorySignals = [
    "es ",
    "son ",
    "se ",
    "consiste",
    "define",
    "describe",
    "explica",
    "debido",
    "porque",
    "por lo tanto",
    "mecanismo",
    "causa",
    "tratamiento",
    "diagnóstico",
    "síntoma",
    "fisiología",
    "patología",
  ];
  return explanatorySignals.some((signal) => lower.includes(signal));
}

/**
 * Basic-science passages ("El tejido epitelial se caracteriza por...") contain
 * none of the clinical keywords, so a single keyword list silently discarded
 * most of Morfofisiología, Bioquímica and Farmacología. Keywords are chosen
 * per area instead.
 */
const CLINICAL_KEYWORDS = [
  "enfermedad", "síndrome", "diagnóstico", "tratamiento", "fisiología",
  "patología", "síntomas", "causa", "mecanismo", "clínico",
];

const PRECLINICAL_KEYWORDS = [
  "célula", "células", "tejido", "membrana", "proteína", "proteínas", "enzima",
  "órgano", "estructura", "función", "metabolismo", "molécula", "molecular",
  "sistema", "aparato", "embrión", "embrionario", "desarrollo", "anatomía",
  "histología", "fisiología", "bioquímica", "receptor", "hormona", "músculo",
  "nervio", "arteria", "vena", "hueso", "articulación", "epitelio", "síntesis",
  "ácido", "lípido", "glucosa", "ADN", "ARN", "mitocondria", "fármaco",
  "farmacológ", "dosis", "absorción", "mecanismo", "vía",
];

function isMedicalContent(chunk, area = "clinico") {
  const lower = chunk.toLowerCase();

  // Author/credits front matter stacks several of these markers together. A
  // single mention ("ingresó en el hospital", "criterios de la Universidad...")
  // is ordinary clinical prose, so require a cluster before discarding.
  const frontMatterMarkers = [
    "especialista", "profesor", "instructor", "hospital", "instituto", "universidad",
  ].filter((m) => lower.includes(m)).length;
  if (frontMatterMarkers >= 2) return false;

  // Proportional, not absolute: a 400-word anatomy passage legitimately names
  // many capitalised structures, while a short TOC line is mostly capitals.
  const allWords = chunk.split(/\s+/).filter(Boolean);
  const capitalWords = allWords.filter((word) => /^[A-ZÁÉÍÓÚÑ]/.test(word));
  if (capitalWords.length > 15 && capitalWords.length / allWords.length > 0.3) return false;

  // Filter front matter / table-of-contents style chunks.
  if (/\b(autores|colaboradores|edici[oó]n|bibliograf[ií]a)\b/i.test(lower)) return false;
  const tocMarkers = (chunk.match(/\/\s*\d{1,4}\b/g) || []).length;
  if (tocMarkers >= 4) return false;

  const medicalKeywords =
    area === "preclinico"
      ? [...PRECLINICAL_KEYWORDS, ...CLINICAL_KEYWORDS]
      : CLINICAL_KEYWORDS;

  return medicalKeywords.some((word) => lower.includes(word));
}

/** Prepend the tail of the previous chunk so ideas spanning a split stay findable. */
function withOverlap(chunks) {
  if (OVERLAP_SENTENCES <= 0) return chunks;
  return chunks.map((chunk, i) => {
    if (i === 0) return chunk;
    const prev = splitIntoSentences(chunks[i - 1]).slice(-OVERLAP_SENTENCES).join(" ");
    return prev ? `${prev} ${chunk}` : chunk;
  });
}

function slugify(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const files = await fs.readdir(DOCS_DIR);
  const pdfFiles = files.filter((file) => file.toLowerCase().endsWith(".pdf")).sort();

  if (pdfFiles.length === 0) {
    console.log("No PDF files found in ./docs");
    await fs.writeFile(OUTPUT_FILE, JSON.stringify([], null, 2), "utf-8");
    return;
  }

  // An unmapped file still ingests, but lands in a "general" bucket with no
  // subject keys — invisible to filtered retrieval. Never let that pass quietly.
  const unmapped = findUnmapped(pdfFiles);
  if (unmapped.length > 0) {
    console.warn(`\nWARNING: ${unmapped.length} file(s) have no entry in sources.js.`);
    console.warn(`They will be tagged "general" and cannot be filtered by subject:`);
    for (const f of unmapped) console.warn(`  - ${f}`);
    console.warn(`Add them to SOURCES (or EXCLUDED) in rag/sources.js.\n`);
  }

  const allChunks = [];
  const report = [];

  for (const filename of pdfFiles) {
    const source = describeSource(filename);
    if (!source) {
      console.log(`Skipping: ${filename} — ${EXCLUDED[filename]}`);
      continue;
    }

    const pdfPath = path.join(DOCS_DIR, filename);
    process.stdout.write(`${filename.slice(0, 44).padEnd(44)} `);

    try {
      const rawText = await extractText(pdfPath);
      const sections = splitIntoSections(normalizeAndCleanLines(rawText));

      const slug = slugify(source.title);
      let kept = 0;
      let seen = 0;

      for (const section of sections) {
        const chunks = withOverlap(chunkText(section.text))
          .filter(isValidChunk)
          .filter(hasExplanatoryContent)
          .filter((c) => isMedicalContent(c, source.area));
        seen += chunks.length;

        for (const content of chunks) {
          kept += 1;
          allChunks.push({
            id: `${slug}_${kept}`,
            content,
            metadata: {
              title: source.title,
              subject: source.subject,
              subjects: source.subjects,
              area: source.area,
              ...(source.rotation ? { rotation: source.rotation } : {}),
              section: section.heading ?? null,
              source: filename,
              chunkIndex: kept,
            },
          });
        }
      }

      const withSection = allChunks.filter(
        (c) => c.metadata.source === filename && c.metadata.section
      ).length;
      report.push({ filename, title: source.title, sections: sections.length, kept, withSection });
      console.log(
        `${String(kept).padStart(6)} chunks  ${String(sections.length).padStart(5)} sections  ` +
          `${Math.round((withSection / Math.max(kept, 1)) * 100)}% titled`
      );
    } catch (error) {
      console.error(`FAILED — ${error.message}`);
    }
  }

  // totalChunks is only knowable per source once that source is finished.
  const totals = new Map();
  for (const c of allChunks) {
    totals.set(c.metadata.source, (totals.get(c.metadata.source) ?? 0) + 1);
  }
  for (const c of allChunks) c.metadata.totalChunks = totals.get(c.metadata.source);

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(allChunks, null, 2), "utf-8");

  const bySubject = new Map();
  for (const c of allChunks) {
    bySubject.set(c.metadata.subject, (bySubject.get(c.metadata.subject) ?? 0) + 1);
  }
  console.log(`\n${"=".repeat(72)}`);
  console.log(`${allChunks.length} chunks from ${report.length} books -> ${path.relative(process.cwd(), OUTPUT_FILE)}\n`);
  for (const [subject, n] of [...bySubject].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${subject.padEnd(20)} ${String(n).padStart(6)}`);
  }
}

main().catch((error) => {
  console.error("Ingestion failed:", error);
  process.exit(1);
});

