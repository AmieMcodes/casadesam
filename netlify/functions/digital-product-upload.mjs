import { getStore } from "@netlify/blobs";
import { createRoiBundle, readRoiBundle, ROI_BUNDLE_KEY, MAX_PDF_BYTES } from "./lib/roi-workbook.mjs";

import { createTonightBundle, readTonightBundle, TONIGHT_BUNDLE_KEY } from "./lib/tonight-workbook.mjs";

function page(body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Casa de SAM Product Upload</title><style>body{margin:0;background:#f7f2e8;color:#18324a;font-family:Arial,sans-serif}main{max-width:680px;margin:8vh auto;padding:40px;background:#fff;border:1px solid #d8d1c4;border-radius:16px}h1{font-family:Georgia,serif}label{display:block;margin:18px 0 8px;font-weight:700}input{width:100%;box-sizing:border-box;padding:12px}.btn{margin-top:20px;background:#18324a;color:#fff;border:0;border-radius:8px;padding:14px 20px;font-weight:700;cursor:pointer}.muted{color:#667085;font-size:.92rem}</style></head><body><main>${body}</main></body></html>`;
}


const HTML_HEADERS = { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" };

export function createUploadHandler({ getProductStore = () => getStore("digital-products"), env = process.env } = {}) {
  return async (req) => {
    if (req.method === "GET") {
      return new Response(page(`<h1>Upload both workbook editions</h1><p>The PDFs are stored privately and published together as one complete delivery bundle.</p><form method="post" enctype="multipart/form-data"><label for="product">Workbook</label><select name="product" id="product"><option value="roi">The ROI of Independence</option><option value="tonight">If Something Happened Tonight</option></select><label for="secret">Upload secret</label><input id="secret" name="secret" type="password" required><label for="file">English workbook PDF</label><input id="file" name="file" type="file" accept="application/pdf,.pdf" required><label for="spanish_file">Spanish workbook PDF</label><input id="spanish_file" name="spanish_file" type="file" accept="application/pdf,.pdf" required><button class="btn" type="submit">Publish both PDF editions</button></form><p class="muted">Maximum combined size: 4 MB for both PDFs.</p>`), { headers: HTML_HEADERS });
    }
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST" } });
    const acceptedSecrets = [env.PRODUCT_UPLOAD_SECRET, env.PRODUCT_UPLOAD_AUTOMATION_SECRET, env.PRODUCT_UPLOAD_TONIGHT_SECRET].filter(Boolean);
    if (!acceptedSecrets.length) return new Response("Upload is not configured", { status: 503 });
    try {
      const form = await req.formData();
      const secret = String(form.get("secret") || "");
      if (!acceptedSecrets.includes(secret)) return new Response("Upload rejected", { status: 403, headers: { "Cache-Control": "no-store" } });
      const product = String(form.get("product") || "roi");
      if (!["roi", "tonight"].includes(product)) return new Response("Unknown product", { status: 400 });
      const key = product === "tonight" ? TONIGHT_BUNDLE_KEY : ROI_BUNDLE_KEY;
      const readBundle = product === "tonight" ? readTonightBundle : readRoiBundle;
      const createBundle = product === "tonight" ? createTonightBundle : createRoiBundle;
      const store = getProductStore();
      if (form.get("operation") === "status") {
        await readBundle(store);
        const current = await store.get(key, { type: "json", consistency: "strong" });
        return Response.json({ version: current.version, uploadedAt: current.uploadedAt, editions: current.editions.map(({ language, filename, bytes, sha256 }) => ({ language, filename, bytes, sha256 })) }, { headers: { "Cache-Control": "no-store" } });
      }
      const english = form.get("file");
      const spanish = form.get("spanish_file");
      if (!english || !spanish || typeof english.arrayBuffer !== "function" || typeof spanish.arrayBuffer !== "function") return new Response("Both English and Spanish PDF files are required", { status: 400 });
      if (english.size + spanish.size > 4 * 1024 * 1024) return new Response("The combined PDF upload must be no larger than 4 MB", { status: 413 });
      if ([english, spanish].some(file => file.size > MAX_PDF_BYTES)) return new Response("Each PDF must be no larger than 5 MB", { status: 413 });
      if ([english, spanish].some(file => file.type && file.type !== "application/pdf")) return new Response("Only PDF files are accepted", { status: 415 });
      const bundle = createBundle(await english.arrayBuffer(), await spanish.arrayBuffer());
      // One write publishes the pair atomically; validation above never changes the existing bundle.
      await store.setJSON(key, bundle);
      return new Response(page(`<h1>Both editions published</h1><p>The English and Spanish workbooks are stored privately and ready to be attached to one delivery email.</p><p>The selected workbook bundle is ready for delivery.</p>`), { headers: HTML_HEADERS });
    } catch (error) {
      console.error("Digital product upload failed", error.message);
      const invalid = /PDF|5 MB/.test(error.message);
      return new Response(invalid ? error.message : "Unable to publish or verify the workbook bundle", { status: invalid ? 400 : 500, headers: { "Cache-Control": "no-store" } });
    }
  };
}

export default createUploadHandler();
