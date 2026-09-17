/**
 * Filename -> subject mapping for the rag/docs corpus.
 *
 * Previously ingest.js guessed the subject by splitting the filename on "_",
 * which produced junk like "med" or the whole filename. With 39 books the
 * subject tag decides whether a Pediatría question can retrieve from the
 * Dermatología volume, so it is declared explicitly instead.
 *
 * `subjects` holds the app's own translation keys (see LanguageContext), so
 * retrieval can filter by exactly the subject/rotation the user is studying.
 */

export const PRECLINICAL_KEYS = [
  "anatomy", "histology", "cellBiology", "biochemistry", "physiology",
  "microbiology", "parasitology", "immunology", "biostatistics", "pharmacology",
];

/** Books excluded from the corpus, with the reason. */
export const EXCLUDED = {
  "NOTAS de internos HEM.pdf":
    "Informal, unreviewed intern notes — RAG would cite them with textbook authority.",
};

const MORFO = ["anatomy", "histology", "cellBiology", "physiology", "biochemistry"];

export const SOURCES = {
  // ---- Preclínico ----
  "Morfofisiología I.pdf":
    { title: "Morfofisiología, Tomo I", subject: "morfofisiologia", subjects: MORFO, area: "preclinico" },
  "Morfofisiología II.pdf":
    { title: "Morfofisiología, Tomo II", subject: "morfofisiologia", subjects: MORFO, area: "preclinico" },
  "Morfofisiología III.pdf":
    { title: "Morfofisiología, Tomo III", subject: "morfofisiologia", subjects: MORFO, area: "preclinico" },
  "bioquimica_medica_1.pdf":
    { title: "Bioquímica Médica, Tomo I", subject: "biochemistry", subjects: ["biochemistry"], area: "preclinico" },
  "bioquimica_completo.pdf":
    { title: "Bioquímica Médica, Tomo II", subject: "biochemistry", subjects: ["biochemistry"], area: "preclinico" },
  "Bioquimica medica Tomo III.pdf ( PDFDrive ).pdf":
    { title: "Bioquímica Médica, Tomo III", subject: "biochemistry", subjects: ["biochemistry"], area: "preclinico" },
  "farma_gral.pdf":
    { title: "Farmacología General", subject: "pharmacology", subjects: ["pharmacology"], area: "preclinico" },
  "farmacologia.pdf":
    { title: "Farmacología Clínica", subject: "pharmacology", subjects: ["pharmacology"], area: "preclinico" },

  // ---- Clínico: Medicina Interna ----
  "ROCA - Temas de Medicina Interna Tomo I.pdf":
    { title: "Temas de Medicina Interna (Roca), Tomo I", subject: "internalMedicine", subjects: ["internalMedicine"], area: "clinico", rotation: "internalMedicine" },
  "med_interna_t1.pdf":
    { title: "Medicina Interna, Tomo I", subject: "internalMedicine", subjects: ["internalMedicine"], area: "clinico", rotation: "internalMedicine" },
  "med_interna_t2.pdf":
    { title: "Medicina Interna, Tomo II", subject: "internalMedicine", subjects: ["internalMedicine"], area: "clinico", rotation: "internalMedicine" },
  "med_interna_t3.pdf":
    { title: "Medicina Interna, Tomo III", subject: "internalMedicine", subjects: ["internalMedicine"], area: "clinico", rotation: "internalMedicine" },
  "propedeutica_t1.pdf":
    { title: "Propedéutica Clínica y Semiología Médica, Tomo I", subject: "propedeutica", subjects: ["internalMedicine"], area: "clinico", rotation: "internalMedicine" },

  // ---- Clínico: MGI ----
  ...Object.fromEntries([1, 2, 3, 4, 5].map((n) => [
    `medicina_gral_tomo${n}.pdf`,
    { title: `Medicina General Integral, Tomo ${n}`, subject: "generalMedicine", subjects: ["generalMedicine"], area: "clinico", rotation: "generalMedicine" },
  ])),

  // ---- Clínico: Pediatría ----
  ...Object.entries({
    "ped-1.pdf": "I", "ped-t2.pdf": "II", "pediatria_t3.pdf": "III", "ped_iv.pdf": "IV",
    "pediatriav_completo.pdf": "V", "pediatria_tomo_vi.pdf": "VI", "pediatria_vii.pdf": "VII",
  }).reduce((acc, [file, vol]) => {
    acc[file] = { title: `Pediatría, Tomo ${vol}`, subject: "pediatrics", subjects: ["pediatrics"], area: "clinico", rotation: "pediatrics" };
    return acc;
  }, {}),
  "emergencias y urgencias pediátricas.pdf":
    { title: "Emergencias y Urgencias Pediátricas", subject: "pediatrics", subjects: ["pediatrics"], area: "clinico", rotation: "pediatrics" },

  // ---- Clínico: Cirugía ----
  "Cirugia 2018 - Tomo I (3).pdf":
    { title: "Cirugía (2018), Tomo I", subject: "surgery", subjects: ["surgery"], area: "clinico", rotation: "surgery" },
  "temas_cirugia_tomo1.pdf":
    { title: "Temas de Cirugía, Tomo I", subject: "surgery", subjects: ["surgery"], area: "clinico", rotation: "surgery" },
  "temas_cirugia_2_completo 3.pdf":
    { title: "Temas de Cirugía, Tomo II", subject: "surgery", subjects: ["surgery"], area: "clinico", rotation: "surgery" },
  "cirugia_abdomen_completo.pdf":
    { title: "Cirugía del Abdomen", subject: "surgery", subjects: ["surgery"], area: "clinico", rotation: "surgery" },
  "atencion_altraumatizado.pdf":
    { title: "Atención al Paciente Traumatizado", subject: "surgery", subjects: ["surgery"], area: "clinico", rotation: "surgery" },

  // ---- Clínico: Ginecología y Obstetricia ----
  "obstetricia_perinatologia.pdf":
    { title: "Obstetricia y Perinatología", subject: "gynecology", subjects: ["gynecology"], area: "clinico", rotation: "gynecology" },
  "manual_proc_ginec_completo.pdf":
    { title: "Manual de Procedimientos en Ginecología", subject: "gynecology", subjects: ["gynecology"], area: "clinico", rotation: "gynecology" },

  // ---- Clínico: especialidades ----
  "Manual de Psiquiatría.pdf":
    { title: "Manual de Psiquiatría", subject: "psychiatry", subjects: ["internalMedicine"], area: "clinico" },
  "Libro de Dermatología Manzur.pdf":
    { title: "Dermatología (Manzur)", subject: "dermatology", subjects: ["internalMedicine"], area: "clinico" },
  "Oftalmologia. Libro.pdf":
    { title: "Oftalmología", subject: "ophthalmology", subjects: ["surgery"], area: "clinico" },
  "libro de Otorrino.pdf":
    { title: "Otorrinolaringología", subject: "otolaryngology", subjects: ["surgery"], area: "clinico" },
  "temas_urologia.pdf":
    { title: "Temas de Urología", subject: "urology", subjects: ["surgery", "renal"], area: "clinico" },
};

/**
 * macOS returns filenames from readdir in NFD (decomposed: "i" + combining
 * acute), while the literals in this file are NFC. "Morfofisiología I.pdf"
 * therefore fails a plain key lookup. Normalise both sides before matching.
 */
const NFC_SOURCES = new Map(
  Object.entries(SOURCES).map(([k, v]) => [k.normalize("NFC"), v])
);
const NFC_EXCLUDED = new Set(Object.keys(EXCLUDED).map((k) => k.normalize("NFC")));

/** Metadata for a file, or null if it should be skipped. */
export function describeSource(filename) {
  const key = filename.normalize("NFC");
  if (NFC_EXCLUDED.has(key)) return null;
  return NFC_SOURCES.get(key) ?? {
    title: filename.replace(/\.pdf$/i, ""),
    subject: "general",
    subjects: [],
    area: "clinico",
  };
}

/** Filenames present on disk that have no explicit mapping. */
export function findUnmapped(filenames) {
  return filenames.filter(
    (f) => !NFC_SOURCES.has(f.normalize("NFC")) && !NFC_EXCLUDED.has(f.normalize("NFC"))
  );
}
