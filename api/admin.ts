import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

/**
 * Admin data API for the convention panel.
 *
 * Previously the panel checked a password, set sessionStorage["...auth"]="true",
 * and then talked to Supabase directly with the anon key — so the "auth" was a
 * client-side flag anyone could set, and the tables had to stay world-writable
 * for it to work. Now every read and write happens here, server-side, with the
 * service_role key, behind a signed token. RLS can therefore deny anon access
 * to registrations and name_merges entirely.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET;

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // one working session

type Json = Record<string, unknown>;

/** Compare without leaking length or position through timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) {
    // Still burn a comparison so the failure path costs the same.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function issueToken(secret: string): string {
  const body = `${Date.now() + TOKEN_TTL_MS}.${randomBytes(8).toString("hex")}`;
  return `${body}.${sign(body, secret)}`;
}

function verifyToken(token: string | undefined, secret: string): boolean {
  if (!token) return false;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return false;
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!safeEqual(sig, sign(body, secret))) return false;
  const expiry = Number(body.split(".")[0]);
  return Number.isFinite(expiry) && Date.now() < expiry;
}

/** Thin REST call against Supabase using the service_role key (bypasses RLS). */
async function sb(
  path: string,
  init: { method?: string; body?: unknown; prefer?: string } = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: init.method ?? "GET",
    headers: {
      apikey: SERVICE_KEY as string,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!ADMIN_PASSWORD || !TOKEN_SECRET) {
    return res.status(500).json({
      error:
        "Admin no configurado. Faltan ADMIN_PASSWORD y/o ADMIN_TOKEN_SECRET.",
    });
  }

  const { action, password, token, payload } = (req.body ?? {}) as {
    action?: string;
    password?: string;
    token?: string;
    payload?: Json;
  };

  // ---- login: the only action reachable without a token ----
  if (action === "login") {
    if (typeof password !== "string" || !safeEqual(password, ADMIN_PASSWORD)) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }
    return res.status(200).json({ ok: true, token: issueToken(TOKEN_SECRET) });
  }

  if (!verifyToken(token, TOKEN_SECRET)) {
    return res.status(401).json({ error: "Sesión expirada o inválida" });
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({
      error: "Falta SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_URL en el servidor.",
    });
  }

  try {
    switch (action) {
      // Everything the panel renders, in one round trip.
      case "load": {
        const [summaries, comments, registrations, merges] = await Promise.all([
          sb("summaries?select=*&order=created_at.desc"),
          sb("comments?select=*&order=created_at.asc"),
          sb("registrations?select=*&order=registered_at.desc"),
          sb("name_merges?select=*"),
        ]);
        const failed = [summaries, comments, registrations, merges].find((r) => !r.ok);
        if (failed) {
          return res.status(502).json({ error: "Supabase error", detail: failed.data });
        }
        return res.status(200).json({
          summaries: summaries.data,
          comments: comments.data,
          registrations: registrations.data,
          nameMerges: merges.data,
        });
      }

      case "mergeUpsert": {
        const rows = Array.isArray(payload?.rows) ? payload.rows : [payload];
        const r = await sb("name_merges?on_conflict=alias", {
          method: "POST",
          body: rows,
          prefer: "resolution=merge-duplicates,return=minimal",
        });
        return r.ok ? res.status(200).json({ ok: true })
                    : res.status(502).json({ error: "Supabase error", detail: r.data });
      }

      case "mergeDelete": {
        const alias = String(payload?.alias ?? "");
        if (!alias) return res.status(400).json({ error: "alias requerido" });
        const r = await sb(`name_merges?alias=eq.${encodeURIComponent(alias)}`, {
          method: "DELETE",
          prefer: "return=minimal",
        });
        return r.ok ? res.status(200).json({ ok: true })
                    : res.status(502).json({ error: "Supabase error", detail: r.data });
      }

      case "mergeClear": {
        // neq on a value that cannot exist == delete all, matching prior behaviour.
        const r = await sb("name_merges?alias=neq.__nonexistent__", {
          method: "DELETE",
          prefer: "return=minimal",
        });
        return r.ok ? res.status(200).json({ ok: true })
                    : res.status(502).json({ error: "Supabase error", detail: r.data });
      }

      case "registrationInsert": {
        const rows = Array.isArray(payload?.rows) ? payload.rows : [payload];
        const r = await sb("registrations", {
          method: "POST",
          body: rows,
          prefer: "return=minimal",
        });
        return r.ok ? res.status(200).json({ ok: true })
                    : res.status(502).json({ error: "Supabase error", detail: r.data });
      }

      case "registrationDelete": {
        const id = String(payload?.id ?? "");
        if (!id) return res.status(400).json({ error: "id requerido" });
        const r = await sb(`registrations?id=eq.${encodeURIComponent(id)}`, {
          method: "DELETE",
          prefer: "return=minimal",
        });
        return r.ok ? res.status(200).json({ ok: true })
                    : res.status(502).json({ error: "Supabase error", detail: r.data });
      }

      default:
        return res.status(400).json({ error: `Acción desconocida: ${action}` });
    }
  } catch (err) {
    console.error("admin api error", err);
    return res.status(500).json({ error: "Error interno" });
  }
}
