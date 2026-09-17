/**
 * Subject and rotation keys offered by the quick-session launcher.
 * Mirrors the lists rendered in Preclinical.tsx and ClinicalStudy.tsx; keys
 * must stay valid translation keys in LanguageContext.
 */
export const PRECLINICAL_AREA_KEYS = [
  'anatomy',
  'histology',
  'cellBiology',
  'biochemistry',
  'physiology',
  'microbiology',
  'parasitology',
  'immunology',
  'biostatistics',
  'pharmacology',
] as const;

export const CLINICAL_AREA_KEYS = [
  'internalMedicine',
  'surgery',
  'pediatrics',
  'gynecology',
  'generalMedicine',
] as const;
