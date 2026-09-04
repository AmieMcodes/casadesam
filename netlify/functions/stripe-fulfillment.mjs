import crypto from "node:crypto";

function verifyStripeSignature(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return signatures.some((signature) => {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed",
    };
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured.");
    return { statusCode: 503, body: "Webhook not configured" };
  }

  const payload = event.body || "";
  const signature = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];

  if (!verifyStripeSignature(payload, signature, webhookSecret)) {
    console.error("Invalid Stripe webhook signature.");
    return { statusCode: 400, body: "Invalid signature" };
  }

  let stripeEvent;
  try {
    stripeEvent = JSON.parse(payload);
  } catch (error) {
    console.error("Unable to parse Stripe webhook payload.", error);
    return { statusCode: 400, body: "Invalid JSON" };
  }

  if (stripeEvent.type === "checkout.session.completed") {
    // Product-specific fulfillment will be added after the Stripe signing
    // secret and Casa de SAM delivery settings are configured in Netlify.
    console.log("Received checkout.session.completed", stripeEvent.id);
  }

  return { statusCode: 200, body: "ok" };
};
