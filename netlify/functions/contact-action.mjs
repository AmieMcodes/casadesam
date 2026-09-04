import crypto from "node:crypto";

const BASE_URL = "https://casadesam.org/.netlify/functions/contact-action";

function htmlPage(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Casa de SAM</title><style>body{margin:0;background:#f7f2e8;color:#18324a;font-family:Arial,sans-serif}main{max-width:680px;margin:8vh auto;padding:40px;background:#fff;border:1px solid #d8d1c4;border-radius:16px}h1{font-family:Georgia,serif;font-size:2rem;margin-top:0}p{line-height:1.6}.btn{display:inline-block;background:#18324a;color:#fff;border:0;border-radius:8px;padding:14px 20px;font-weight:700;cursor:pointer;text-decoration:none}.muted{color:#667085;font-size:.95rem}</style></head><body><main>${body}</main></body></html>`;
}

function verifyToken(token, secret) {
  if (!token || !secret) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!payload.email || !payload.action || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

async function resendRequest(path, method, body) {
  const apiKey = process.env.RESEND_CONTACTS_API_KEY;
  if (!apiKey) throw new Error("RESEND_CONTACTS_API_KEY is not configured");
  const response = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    throw new Error(`Resend ${method} ${path} failed (${response.status}): ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }
  return data;
}

export const handler = async (event) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const token = event.httpMethod === "POST"
    ? new URLSearchParams(event.body || "").get("token")
    : event.queryStringParameters?.token;
  const payload = verifyToken(token, secret);

  if (!payload) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: htmlPage("Link unavailable", `<h1>This link is unavailable.</h1><p>It may have expired or been altered. If you need help, reply to your Casa de SAM purchase email.</p>`),
    };
  }

  if (event.httpMethod === "GET") {
    const isQuarterly = payload.action === "quarterly";
    const title = isQuarterly ? "Confirm quarterly updates" : "Confirm board interest";
    const heading = isQuarterly ? "Receive Casa de SAM quarterly updates?" : "Interested in the Casa de SAM board?";
    const copy = isQuarterly
      ? "Confirm below to receive four Casa de SAM progress updates per year. Your purchase did not subscribe you automatically."
      : "Confirm below to let us know you would like to hear more about possibly serving on the Casa de SAM board. This is not a commitment.";
    const button = isQuarterly ? "Yes, send me quarterly updates" : "Yes, record my board interest";
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      body: htmlPage(title, `<h1>${heading}</h1><p>${copy}</p><form method="post" action="${BASE_URL}"><input type="hidden" name="token" value="${token}"><button class="btn" type="submit">${button}</button></form><p class="muted">Nothing changes unless you press the confirmation button.</p>`),
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { Allow: "GET, POST" }, body: "Method Not Allowed" };
  }

  try {
    const emailPath = encodeURIComponent(payload.email);
    const today = new Date().toISOString().slice(0, 10);

    if (payload.action === "quarterly") {
      const topicId = process.env.RESEND_QUARTERLY_TOPIC_ID;
      if (!topicId) throw new Error("RESEND_QUARTERLY_TOPIC_ID is not configured");
      await resendRequest(`/contacts/${emailPath}`, "PATCH", {
        unsubscribed: false,
        properties: { quarterly_opt_in_date: today },
      });
      await resendRequest(`/contacts/${emailPath}/topics`, "PATCH", {
        topics: [{ id: topicId, subscription: "opt_in" }],
      });
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        body: htmlPage("You're subscribed", `<h1>You're in.</h1><p>You'll receive Casa de SAM's quarterly updates — four meaningful updates per year.</p><p><a class="btn" href="https://casadesam.org/current">See what's current</a></p>`),
      };
    }

    if (payload.action === "board") {
      const segmentId = process.env.RESEND_BOARD_SEGMENT_ID;
      if (!segmentId) throw new Error("RESEND_BOARD_SEGMENT_ID is not configured");
      await resendRequest(`/contacts/${emailPath}/segments/${segmentId}`, "POST");
      await resendRequest(`/contacts/${emailPath}`, "PATCH", {
        properties: { board_interest_date: today },
      });
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        body: htmlPage("Board interest recorded", `<h1>Thank you.</h1><p>We've recorded your interest in learning more about the Casa de SAM board. This is not a commitment; it simply lets us know you'd like to be part of that conversation.</p><p><a class="btn" href="https://casadesam.org/current">See what's current</a></p>`),
      };
    }

    return { statusCode: 400, body: "Unknown action" };
  } catch (error) {
    console.error("Contact action failed", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      body: htmlPage("Something went wrong", `<h1>We couldn't save that yet.</h1><p>Please try again in a few minutes. If it keeps happening, reply to your Casa de SAM purchase email.</p>`),
    };
  }
};
