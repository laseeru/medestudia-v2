import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

// Reuse the column mapping from ConvencionAdmin
const COMMISSION_KEYWORDS = [
  { slug: "educacion-medica", keywords: ["educacion medica", "educación médica", "educacion"] },
  { slug: "aps-pami", keywords: ["aps", "pami", "atencion primaria", "atención primaria", "medicina general"] },
  { slug: "enfermeria", keywords: ["enfermeria", "enfermería"] },
  { slug: "estomatologia", keywords: ["estomatologia", "estomatología"] },
  { slug: "investigacion-innovacion", keywords: ["investigacion", "innovacion", "investigación", "innovación"] },
  { slug: "promocion-prevencion", keywords: ["promocion", "prevencion", "promoción", "prevención"] },
  { slug: "tecnologia-educativa", keywords: ["tecnologia", "tecnología"] },
  { slug: "medicina-natural", keywords: ["medicina natural", "mnt", "tradicional"] },
];

function findCommissionSlug(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const { slug, keywords } of COMMISSION_KEYWORDS) {
    if (keywords.some((k) => lower.includes(k))) return slug;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const csvUrl = (req.query.url as string) || process.env.GOOGLE_SHEETS_CSV_URL;
  if (!csvUrl) {
    return res.status(400).json({
      error: "Falta la URL del CSV. Pásala como ?url= o configúrala como GOOGLE_SHEETS_CSV_URL en las variables de entorno de Vercel.",
    });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Supabase no configurado" });
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return res.status(502).json({ error: `Error al obtener CSV: HTTP ${response.status}` });
    }

    const csv = await response.text();
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      return res.status(400).json({ error: "CSV vacío o sin datos." });
    }

    const header = lines[0].toLowerCase();
    const delim = header.includes("\t") ? "\t" : ",";
    const cols = header.split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));

    const nameIdx = cols.findIndex(
      (c) => c.includes("nombre") || c.includes("name") || c.includes("apellido"),
    );
    const emailIdx = cols.findIndex(
      (c) => c.includes("email") || c.includes("correo") || c.includes("mail"),
    );
    const comIdx = cols.findIndex(
      (c) => c.includes("comisión") || c.includes("comision") || c.includes("commission"),
    );
    const instIdx = cols.findIndex(
      (c) =>
        c.includes("institución") || c.includes("institucion") || c.includes("institution") || c.includes("centro"),
    );

    if (nameIdx === -1) {
      return res.status(400).json({ error: "No se encontró columna de nombre." });
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));
      const name = row[nameIdx]?.trim();
      if (!name) continue;

      const email = emailIdx >= 0 ? (row[emailIdx]?.trim() ?? "") : "";
      const inst = instIdx >= 0 ? (row[instIdx]?.trim() ?? "") : "";

      let comSlug: string | null = null;
      if (comIdx >= 0) {
        const csvCom = row[comIdx]?.trim() ?? "";
        comSlug = findCommissionSlug(csvCom);
      }
      if (!comSlug) comSlug = "educacion-medica";

      // Check duplicate
      const { data: dup } = await sb
        .from("registrations")
        .select("id")
        .eq("full_name", name)
        .eq("commission_slug", comSlug)
        .limit(1);
      if (dup && dup.length > 0) {
        skipped++;
        continue;
      }

      const { error } = await sb.from("registrations").insert({
        full_name: name,
        email: email || null,
        commission_slug: comSlug,
        institution: inst || null,
      });

      if (error) errors++;
      else imported++;
    }

    return res.status(200).json({
      ok: true,
      imported,
      skipped,
      errors,
      total: lines.length - 1,
    });
  } catch (err) {
    console.error("Sync error:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
