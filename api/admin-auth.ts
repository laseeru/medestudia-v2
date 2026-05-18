import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body ?? {};
  const expected = process.env.VITE_ADMIN_PASSWORD;

  if (!expected) {
    return res.status(500).json({ error: "Admin password not configured" });
  }

  if (password === expected) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ error: "Invalid password" });
}
