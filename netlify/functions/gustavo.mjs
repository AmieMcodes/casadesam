import { CASA_KNOWLEDGE, PRIVATE_INSTRUCTIONS, PUBLIC_INSTRUCTIONS } from "./_shared/gustavo-knowledge.mjs";

const MODEL = "gpt-5.4-mini";
const MAX_MESSAGE_LENGTH = 2400;
const MAX_HISTORY = 8;
const ADMIN_TOKEN_DIGEST = "6ae26ac72b349eea21ba2abcbd4acb15807d6b16f20b15b24e367a556ebe01dc";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function safeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-MAX_HISTORY)
    .filter((item) => item && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
    .map((item) => ({ role: item.role, content: item.content.slice(0, MAX_MESSAGE_LENGTH) }));
}

async function validAdminToken(req) {
  const supplied = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!supplied) return false;
  const digestBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(supplied));
  const suppliedDigest = Array.from(new Uint8Array(digestBytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (suppliedDigest.length !== ADMIN_TOKEN_DIGEST.length) return false;
  let difference = 0;
  for (let i = 0; i < ADMIN_TOKEN_DIGEST.length; i += 1) {
    difference |= suppliedDigest.charCodeAt(i) ^ ADMIN_TOKEN_DIGEST.charCodeAt(i);
  }
  return difference === 0;
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const mode = body.mode === "private" ? "private" : "public";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return json({ error: `Please send a message between 1 and ${MAX_MESSAGE_LENGTH} characters.` }, 400);
    }
    if (mode === "private" && !(await validAdminToken(req))) {
      return json({ error: "That private access code was not accepted." }, 401);
    }

    const apiKey = Netlify.env.get("OPENAI_API_KEY");
    const baseUrl = Netlify.env.get("OPENAI_BASE_URL");
    if (!apiKey || !baseUrl) {
      console.error("Gustavo AI Gateway environment is unavailable");
      return json({ error: "Gustavo is not available yet. Please try again later." }, 503);
    }

    const instructions = mode === "private" ? PRIVATE_INSTRUCTIONS : PUBLIC_INSTRUCTIONS;
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_completion_tokens: mode === "private" ? 1800 : 700,
        messages: [
          { role: "system", content: `${instructions}\n\n${CASA_KNOWLEDGE}` },
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

    const answer = payload?.choices?.[0]?.message?.content?.trim();
    if (!answer) return json({ error: "Gustavo could not answer just now. Please try again." }, 502);
    return json({ answer, mode });
  } catch (error) {
    console.error("Gustavo request failed", error);
    return json({ error: "Gustavo could not answer just now. Please try again." }, 500);
  }
};

export const config = {
  path: "/api/gustavo",
  method: "POST",
};
