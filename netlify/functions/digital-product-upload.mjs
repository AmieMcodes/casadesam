import { getStore } from "@netlify/blobs";

const MAX_FILE_BYTES = 5 * 1024 * 1024;

function page(body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Casa de SAM Product Upload</title><style>body{margin:0;background:#f7f2e8;color:#18324a;font-family:Arial,sans-serif}main{max-width:680px;margin:8vh auto;padding:40px;background:#fff;border:1px solid #d8d1c4;border-radius:16px}h1{font-family:Georgia,serif}label{display:block;margin:18px 0 8px;font-weight:700}input{width:100%;box-sizing:border-box;padding:12px}.btn{margin-top:20px;background:#18324a;color:#fff;border:0;border-radius:8px;padding:14px 20px;font-weight:700;cursor:pointer}.muted{color:#667085;font-size:.92rem}</style></head><body><main>${body}</main></body></html>`;
}

export default async (req) => {
  if (req.method === "GET") {
    return new Response(page(`<h1>Upload a Casa de SAM digital product</h1><p>This private admin page stores the PDF in Netlify Blobs so it does not need to live in the public GitHub repository.</p><form method="post" enctype="multipart/form-data"><label for="secret">Upload secret</label><input id="secret" name="secret" type="password" required><label for="file">ROI workbook PDF</label><input id="file" name="file" type="file" accept="application/pdf,.pdf" required><button class="btn" type="submit">Upload PDF</button></form><p class="muted">Maximum file size: 5 MB. The PDF is stored as <code>roi-of-independence.pdf</code>.</p>`), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST" } });
  }

  const configuredSecret = process.env.PRODUCT_UPLOAD_SECRET;
  if (!configuredSecret) return new Response("Upload is not configured", { status: 503 });

  try {
    const form = await req.formData();
    const suppliedSecret = String(form.get("secret") || "");
    const file = form.get("file");

    if (suppliedSecret !== configuredSecret) {
      return new Response(page(`<h1>Upload rejected</h1><p>The upload secret was not correct.</p>`), {
        status: 403,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    if (!file || typeof file.arrayBuffer !== "function") {
      return new Response("No file supplied", { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return new Response(page(`<h1>File is too large</h1><p>This uploader currently accepts PDFs up to 5 MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)} MB.</p>`), {
        status: 413,
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    if (file.type && file.type !== "application/pdf") {
      return new Response("Only PDF files are accepted", { status: 415 });
    }

    const store = getStore("digital-products");
    await store.set("roi-of-independence.pdf", await file.arrayBuffer(), {
      metadata: {
        filename: "Casa_de_SAM_ROI_of_Independence.pdf",
        contentType: "application/pdf",
        uploadedAt: new Date().toISOString(),
      },
    });

    return new Response(page(`<h1>Upload complete</h1><p>The ROI workbook is now stored privately in Netlify Blobs and is ready for fulfillment.</p><p><a href="https://casadesam.org/roi-of-independence">Return to the product page</a></p>`), {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Digital product upload failed", error);
    return new Response(page(`<h1>Upload failed</h1><p>Something went wrong while storing the PDF. Check the Netlify function logs for details.</p>`), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
};
