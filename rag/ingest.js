import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

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

function normalizeAndCleanText(rawText) {
  return cleanText(rawText)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizedBulletLine(line))
    .join("\n")
    .replace(
      /\b([a-záéíóúüñ]{3,})\s+(dad|ción|ciones|mente|tico|tica|sión|logía|ismo|ista|izar|able|ables|encia|encias)\b/gi,
      "$1$2",
    )
    .replace(/\s+/g, " ") // remove extra spaces
    .replace(/\n+/g, "\n") // normalize newlines
    .trim();
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

function isMedicalContent(chunk) {
  const lower = chunk.toLowerCase();

  if (
    lower.includes("especialista") ||
    lower.includes("profesor") ||
    lower.includes("instructor") ||
    lower.includes("hospital") ||
    lower.includes("instituto") ||
    lower.includes("universidad")
  ) {
    return false;
  }

  const capitalWords = chunk.split(/\s+/).filter((word) => /^[A-ZÁÉÍÓÚÑ]/.test(word));
  if (capitalWords.length > 15) return false;

  // Filter front matter / table-of-contents style chunks.
  if (/\b(autores|colaboradores|edici[oó]n|bibliograf[ií]a)\b/i.test(lower)) return false;
  const tocMarkers = (chunk.match(/\/\s*\d{1,4}\b/g) || []).length;
  if (tocMarkers >= 4) return false;

  const medicalKeywords = [
    "enfermedad",
    "síndrome",
    "diagnóstico",
    "tratamiento",
    "fisiología",
    "patología",
    "síntomas",
    "causa",
    "mecanismo",
    "clínico",
  ];

  const hasMedicalContent = medicalKeywords.some((word) => lower.includes(word));
  return hasMedicalContent;
}

function inferSubjectFromFilename(filename) {
  const base = path.basename(filename, path.extname(filename)).toLowerCase();
  const [subject] = base.split("_");
  return subject || "general";
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const files = await fs.readdir(DOCS_DIR);
  const pdfFiles = files.filter((file) => file.toLowerCase().endsWith(".pdf"));

  if (pdfFiles.length === 0) {
    console.log("No PDF files found in ./docs");
    await fs.writeFile(OUTPUT_FILE, JSON.stringify([], null, 2), "utf-8");
    return;
  }

  const allChunks = [];

  for (const filename of pdfFiles) {
    const pdfPath = path.join(DOCS_DIR, filename);
    console.log(`Processing: ${filename}`);

    try {
      const rawText = await extractText(pdfPath);
      const cleanedText = normalizeAndCleanText(rawText);
      const chunks = chunkText(cleanedText)
        .filter(isValidChunk)
        .filter(hasExplanatoryContent)
        .filter(isMedicalContent);
      const subject = inferSubjectFromFilename(filename);

      chunks.forEach((content, index) => {
        allChunks.push({
          id: `${path.basename(filename, ".pdf")}_${index + 1}`,
          content,
          metadata: {
            subject,
            source: filename,
            chunkIndex: index + 1,
            totalChunks: chunks.length,
          },
        });
      });
    } catch (error) {
      console.error(`Failed to process ${filename}:`, error.message);
    }
  }

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(allChunks, null, 2), "utf-8");
  console.log(`Saved ${allChunks.length} chunks to ${OUTPUT_FILE}`);
}

main().catch((error) => {
  console.error("Ingestion failed:", error);
  process.exit(1);
});

