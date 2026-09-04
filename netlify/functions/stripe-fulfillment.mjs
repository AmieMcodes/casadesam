import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

const CONTACT_ACTION_URL = "https://casadesam.org/.netlify/functions/contact-action";

function verifyStripeSignature(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return signatures.some((signature) => {
    try {
      const a = Buffer.from(signature, "hex");
      const b = Buffer.from(expected, "hex");
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

function createActionToken(email, action, secret) {
  const payload = {
    email,
    action,
    exp: Date.now() + 90 * 24 * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

async function apiRequest(apiKey, path, { method = "GET", body, headers = {}, allow404 = false, allow409 = false } = {}) {
  if (!apiKey) throw new Error(`Missing API key for ${path}`);

  console.log("Resend request", method, path);
  const response = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  console.log("Resend response", method, path, response.status);

  if (allow404 && response.status === 404) return null;
  if (allow409 && response.status === 409) return data;
  if (!response.ok) {
    throw new Error(
      `Resend ${method} ${path} failed (${response.status}): ${
        typeof data === "string" ? data : JSON.stringify(data)
      }`,
    );
  }
  return data;
}

async function sendRoiDeliveryEmail({ email, stripeSessionId, pdfBase64, webhookSecret }) {
  const sendingKey = process.env.RESEND_API_KEY;
  if (!sendingKey) throw new Error("RESEND_API_KEY is not configured");

  const quarterlyToken = createActionToken(email, "quarterly", webhookSecret);
  const boardToken = createActionToken(email, "board", webhookSecret);
  const quarterlyUrl = `${CONTACT_ACTION_URL}?token=${encodeURIComponent(quarterlyToken)}`;
  const boardUrl = `${CONTACT_ACTION_URL}?token=${encodeURIComponent(boardToken)}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#18324a;line-height:1.6">
      <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#55724a">Casa de SAM</p>
      <h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.2">Your ROI of Independence workbook is ready</h1>
      <p>Thank you for purchasing <strong>The ROI of Independence: Is This Skill Worth What It Costs?</strong></p>
      <p>Your complete Casa de SAM workbook is attached to this email as a PDF. Save it anywhere you keep important family-planning documents so you can return to the exercises and decision matrix over time.</p>
      <hr style="border:0;border-top:1px solid #ddd5c7;margin:28px 0">
      <h2 style="font-family:Georgia,serif">Want to stay connected?</h2>
      <p><a href="${quarterlyUrl}" style="color:#18324a;font-weight:700">Get Casa de SAM's quarterly updates →</a><br><span style="color:#667085">Four meaningful updates per year about our progress, plans, and major milestones.</span></p>
      <p><a href="${boardUrl}" style="color:#18324a;font-weight:700">I'm interested in possibly serving on the Casa de SAM board →</a><br><span style="color:#667085">No commitment. This simply lets us know you'd like to hear more as we build the board.</span></p>
      <p style="font-size:14px;color:#667085">Your purchase does not automatically subscribe you to marketing emails. Each option above requires a separate confirmation.</p>
      <p style="margin-top:32px">Thank you for supporting this work,<br><strong>Amie</strong><br>Founder, Casa de SAM</p>
      <p style="font-size:12px;color:#7a7a7a">Questions? Reply to this email and your message will go to hello@yourscripturecompanion.com.</p>
    </div>`;

  const text = `Your ROI of Independence workbook is ready\n\nThank you for purchasing The ROI of Independence: Is This Skill Worth What It Costs?\n\nYour complete Casa de SAM workbook is attached to this email as a PDF.\n\nOptional next steps:\nQuarterly Casa de SAM updates (four per year): ${quarterlyUrl}\nBoard interest: ${boardUrl}\n\nYour purchase does not automatically subscribe you to marketing emails. Each option requires a separate confirmation.\n\nThank you for supporting this work,\nAmie\nFounder, Casa de SAM`;

  return apiRequest(sendingKey, "/emails", {
    method: "POST",
    headers: { "Idempotency-Key": `roi-delivery/${stripeSessionId}` },
    body: {
      from: "Amie at Casa de SAM <hello@casadesam.org>",
      to: [email],
      reply_to: "hello@yourscripturecompanion.com",
      subject: "Your Casa de SAM ROI workbook is ready",
      html,
      text,
      attachments: [
        {
          filename: "Casa_de_SAM_ROI_of_Independence.pdf",
          content: pdfBase64,
        },
      ],
      tags: [
        { name: "product", value: "roi_independence" },
        { name: "purpose", value: "digital_delivery" },
      ],
    },
  });
}

async function syncRoiContact(email, sessionCreated) {
  const contactsKey = process.env.RESEND_CONTACTS_API_KEY;
  const roiSegmentId = process.env.RESEND_ROI_SEGMENT_ID;
  if (!contactsKey) throw new Error("RESEND_CONTACTS_API_KEY is not configured");
  if (!roiSegmentId) throw new Error("RESEND_ROI_SEGMENT_ID is not configured");

  const emailPath = encodeURIComponent(email);
  const existing = await apiRequest(contactsKey, `/contacts/${emailPath}`, { allow404: true });
  const purchaseDate = new Date((sessionCreated || Math.floor(Date.now() / 1000)) * 1000)
    .toISOString()
    .slice(0, 10);

  if (!existing) {
    await apiRequest(contactsKey, "/contacts", {
      method: "POST",
      body: {
        email,
        unsubscribed: false,
        properties: {
          source: "roi_workbook",
          customer_since: purchaseDate,
        },
        segments: [{ id: roiSegmentId }],
      },
    });
    return;
  }

  const properties = {};
  if (!existing.properties?.source) properties.source = "roi_workbook";
  if (!existing.properties?.customer_since) properties.customer_since = purchaseDate;

  if (Object.keys(properties).length > 0) {
    await apiRequest(contactsKey, `/contacts/${emailPath}`, {
      method: "PATCH",
      body: { properties },
    });
  }

  await apiRequest(contactsKey, `/contacts/${emailPath}/segments/${roiSegmentId}`, {
    method: "POST",
    allow409: true,
  });
}

async function fulfillRoi(session, stripeEventId, webhookSecret) {
  console.log("Fulfillment stage: start", stripeEventId, session.id);

  const expectedPaymentLink = process.env.STRIPE_ROI_PAYMENT_LINK_ID;
  if (!expectedPaymentLink) throw new Error("STRIPE_ROI_PAYMENT_LINK_ID is not configured");

  if (session.payment_link !== expectedPaymentLink) {
    console.log("Ignoring Checkout Session from another Payment Link", session.payment_link);
    return;
  }

  console.log("Fulfillment stage: payment link matched");

  if (session.payment_status && !["paid", "no_payment_required"].includes(session.payment_status)) {
    console.log(
      "Checkout Session is not paid yet; waiting for async payment success",
      session.id,
      session.payment_status,
    );
    return;
  }

  console.log("Fulfillment stage: payment confirmed", session.payment_status);

  const email = session.customer_details?.email || session.customer_email;
  if (!email) throw new Error(`No customer email found on Checkout Session ${session.id}`);

  console.log("Fulfillment stage: buyer email found");
  console.log("Fulfillment stage: opening blob store");

  const store = getStore("digital-products");
  console.log("Fulfillment stage: reading ROI blob");
  const pdf = await store.get("roi-of-independence.pdf", {
    type: "arrayBuffer",
    consistency: "strong",
  });
  if (!pdf) throw new Error("ROI workbook is not present in Netlify Blobs");

  console.log("Fulfillment stage: ROI blob loaded", pdf.byteLength);
  const pdfBase64 = Buffer.from(pdf).toString("base64");

  console.log("Fulfillment stage: sending delivery email");
  await sendRoiDeliveryEmail({
    email,
    stripeSessionId: session.id || stripeEventId,
    pdfBase64,
    webhookSecret,
  });
  console.log("Fulfillment stage: delivery email accepted by Resend");

  console.log("Fulfillment stage: syncing Resend contact");
  await syncRoiContact(email, session.created);
  console.log("Fulfillment stage: contact sync complete");
  console.log("ROI fulfillment completed", stripeEventId, session.id);
}

export default async (req, context) => {
  console.log("Stripe fulfillment invocation received", context?.requestId || "no-request-id");

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "POST" },
    });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return new Response("Webhook not configured", { status: 503 });
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!verifyStripeSignature(payload, signature, webhookSecret)) {
    console.error("Invalid or expired Stripe webhook signature.");
    return new Response("Invalid signature", { status: 400 });
  }

  let stripeEvent;
  try {
    stripeEvent = JSON.parse(payload);
  } catch (error) {
    console.error("Unable to parse Stripe webhook payload.", error);
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log("Stripe event verified", stripeEvent.id, stripeEvent.type);

  const supportedEvents = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
  ]);

  if (!supportedEvents.has(stripeEvent.type)) {
    return new Response("ignored", { status: 200 });
  }

  try {
    await fulfillRoi(stripeEvent.data?.object || {}, stripeEvent.id, webhookSecret);
    return new Response("ok", { status: 200 });
  } catch (error) {
    console.error("Casa de SAM fulfillment failed", stripeEvent.id, error);
    return new Response("Fulfillment failed", { status: 500 });
  }
};
