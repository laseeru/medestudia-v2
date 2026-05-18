import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return res.status(500).json({ error: "Telegram not configured" });
  }

  const { title, authors, institution, commission } = req.body ?? {};

  const message = [
    "*Nuevo resumen publicado*",
    "",
    `*Comisión:* ${commission}`,
    `*Título:* ${title}`,
    `*Autores:* ${authors}`,
    `*Institución:* ${institution}`,
    "",
    `🔗 https://medestudia-v2.vercel.app/convencion/admin`,
  ].join("\n");

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: Number(chatId),
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("Telegram API error:", err);
      return res.status(500).json({ error: "Failed to send notification" });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Telegram notification error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
