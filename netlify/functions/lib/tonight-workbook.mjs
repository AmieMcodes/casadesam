import crypto from 'node:crypto';

export const TONIGHT_BUNDLE_KEY = 'if-something-happened-tonight-bilingual.json';
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
const EDITIONS = [
  { language: 'en', filename: 'Casa_de_SAM_If_Something_Happened_Tonight_English.pdf' },
  { language: 'es', filename: 'Casa_de_SAM_Si_Esta_Noche_Me_Pasara_Algo_Espanol.pdf' },
];

function pdfRecord(bytes, edition) {
  const pdf = Buffer.from(bytes);
  if (pdf.length > MAX_PDF_BYTES) throw new RangeError('Each PDF must be no larger than 5 MB');
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Both files must be valid PDF files');
  return { ...edition, bytes: pdf.length, sha256: crypto.createHash('sha256').update(pdf).digest('hex'), content: pdf.toString('base64') };
}

export function createTonightBundle(englishBytes, spanishBytes) {
  return { version: 1, uploadedAt: new Date().toISOString(), editions: [pdfRecord(englishBytes, EDITIONS[0]), pdfRecord(spanishBytes, EDITIONS[1])] };
}

export async function readTonightBundle(store) {
  const bundle = await store.get(TONIGHT_BUNDLE_KEY, { type: 'json', consistency: 'strong' });
  if (bundle?.version !== 1 || bundle.editions?.length !== 2) throw new Error('The bilingual Tonight bundle must contain both editions');
  return EDITIONS.map((edition, index) => {
    const item = bundle.editions[index];
    if (item?.language !== edition.language || item.filename !== edition.filename || typeof item.content !== 'string') throw new Error('Invalid Tonight bundle editions');
    const checked = pdfRecord(Buffer.from(item.content, 'base64'), edition);
    if (checked.bytes !== item.bytes || checked.sha256 !== item.sha256) throw new Error('Tonight PDF integrity check failed');
    return { filename: edition.filename, content: item.content };
  });
}

export function buildTonightDeliveryEmail({ pdfs }) {
  if (pdfs?.length !== 2) throw new Error('Both PDF editions are required for delivery');
  const text = `Your workbook is ready / Tu cuaderno ya está listo

Thank you for purchasing If Something Happened Tonight. Your purchase includes both attached PDF editions.
Gracias por comprar Si esta noche me pasara algo. Tu compra incluye las dos ediciones en PDF, adjuntas a este correo.

English version: ${pdfs[0].filename}
Versión en español: ${pdfs[1].filename}

Save both PDFs and start with the most useful next step for your family.
Guardá ambos PDF y empezá por el próximo paso más útil para tu familia.

Your purchase does not subscribe you to marketing emails.
Tu compra no te suscribe a correos de difusión.

Thank you / Gracias,
Amie
Casa de SAM
https://casadesam.org/current

Questions? Reply to this email. ¿Tenés preguntas? Respondé a este correo.
hello@yourscripturecompanion.com`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#244844;line-height:1.6"><p style="letter-spacing:.08em;font-size:13px">CASA DE SAM</p><h1>Your workbook is ready<br><span lang="es-PY">Tu cuaderno ya está listo</span></h1><p>Thank you for purchasing <strong>If Something Happened Tonight</strong>. Both PDF editions are attached and included in your purchase.</p><p lang="es-PY">Gracias por comprar <strong>Si esta noche me pasara algo</strong>. Tu compra incluye las dos ediciones en PDF, adjuntas a este correo.</p><h2>English version</h2><p>${pdfs[0].filename}</p><h2 lang="es-PY">Versión en español</h2><p>${pdfs[1].filename}</p><p>Save both PDFs and start with the most useful next step for your family.</p><p lang="es-PY">Guardá ambos PDF y empezá por el próximo paso más útil para tu familia.</p><p style="font-size:14px">Your purchase does not subscribe you to marketing emails.<br><span lang="es-PY">Tu compra no te suscribe a correos de difusión.</span></p><p>Thank you / Gracias,<br><strong>Amie</strong><br>Casa de SAM</p><p><a href="https://casadesam.org/current">Current update / Novedades</a></p><p style="font-size:13px">Questions? Reply to this email. ¿Tenés preguntas? Respondé a este correo.<br>hello@yourscripturecompanion.com</p></div>`;
  return { subject: 'If Something Happened Tonight — English + Español', text, html, attachments: pdfs };
}
