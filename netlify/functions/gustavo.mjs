import { CASA_KNOWLEDGE, PUBLIC_INSTRUCTIONS } from "./_shared/gustavo-knowledge.mjs";

const MODEL = "gpt-5.4-mini";
const MAX_MESSAGE_LENGTH = 2400;
const MAX_HISTORY = 12;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
  });
}

function safeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-MAX_HISTORY)
    .filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
    .map((item) => ({ role: item.role, content: item.content.slice(0, MAX_MESSAGE_LENGTH) }));
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > MAX_MESSAGE_LENGTH) return json({ error: `Please send a message between 1 and ${MAX_MESSAGE_LENGTH} characters.` }, 400);

    const apiKey = Netlify.env.get("OPENAI_API_KEY");
    const baseUrl = Netlify.env.get("OPENAI_BASE_URL");
    if (!apiKey || !baseUrl) {
      console.error("Gustavo AI Gateway environment is unavailable");
      return json({ error: "Gustavo is not available just now. Please try again later." }, 503);
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: 850,
        messages: [
          { role: "system", content: `${PUBLIC_INSTRUCTIONS}\n\n${CASA_KNOWLEDGE}` },
          ...safeHistory(body.history),
          { role: "user", content: message },
        ],
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      console.error("Gustavo model request failed", response.status, payload?.error?.message || "unknown error");
      return json({ error: "Gustavo could not answer just now. Please try again." }, 502);
    }
    const rawAnswer = payload?.choices?.[0]?.message?.content?.trim();
    if (!rawAnswer) return json({ error: "Gustavo could not answer just now. Please try again." }, 502);
    const offerContact = /\[OFFER_CONTACT\]/i.test(rawAnswer);
    return json({ answer: rawAnswer.replace(/\[OFFER_CONTACT\]/gi, "").trim(), offerContact });
  } catch (error) {
    console.error("Gustavo request failed", error);
    return json({ error: "Gustavo could not answer just now. Please try again." }, 500);
  }
};

export const config = { path: "/api/gustavo", method: "POST" };
