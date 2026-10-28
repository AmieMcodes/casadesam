import crypto from 'node:crypto';

export const ROI_BUNDLE_KEY = 'roi-of-independence-bilingual.json';
export const MAX_PDF_BYTES = 5 * 1024 * 1024;
const EDITIONS = [
  { language: 'en', filename: 'Casa_de_SAM_ROI_of_Independence_English.pdf' },
  { language: 'es', filename: 'Casa_de_SAM_ROI_Independencia_Espanol.pdf' },
];

function pdfRecord(bytes, edition) {
  const pdf = Buffer.from(bytes);
  if (pdf.length > MAX_PDF_BYTES) throw new RangeError('Each PDF must be no larger than 5 MB');
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Both files must be valid PDF files');
  return { ...edition, bytes: pdf.length, sha256: crypto.createHash('sha256').update(pdf).digest('hex'), content: pdf.toString('base64') };
}

export function createRoiBundle(englishBytes, spanishBytes) {
  return { version: 1, uploadedAt: new Date().toISOString(), editions: [pdfRecord(englishBytes, EDITIONS[0]), pdfRecord(spanishBytes, EDITIONS[1])] };
}

export async function readRoiBundle(store) {
  const bundle = await store.get(ROI_BUNDLE_KEY, { type: 'json', consistency: 'strong' });
  if (bundle?.version !== 1 || bundle.editions?.length !== 2) throw new Error('The bilingual ROI bundle must contain both editions');
  return EDITIONS.map((edition, index) => {
    const item = bundle.editions[index];
    if (item?.language !== edition.language || item.filename !== edition.filename || typeof item.content !== 'string') throw new Error('Invalid ROI bundle editions');
    const checked = pdfRecord(Buffer.from(item.content, 'base64'), edition);
    if (checked.bytes !== item.bytes || checked.sha256 !== item.sha256) throw new Error('ROI PDF integrity check failed');
    return { filename: edition.filename, content: item.content };
  });
}

export function buildRoiDeliveryEmail({ pdfs, quarterlyUrl, boardUrl }) {
  if (pdfs?.length !== 2) throw new Error('Both PDF editions are required for delivery');
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#18324a;line-height:1.6">
      <p style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#55724a">Casa de SAM</p>
      <h1 style="font-family:Georgia,serif;font-size:28px;line-height:1.2">Your workbook is ready<br><span lang="es">Tu cuaderno ya está listo</span></h1>
      <p>Thank you for purchasing <strong>The ROI of Independence</strong>. Both editions are attached to this email and included in your purchase.</p>
      <p lang="es">Gracias por comprar <strong>El retorno de la independencia</strong>. Tu compra incluye las dos ediciones, adjuntas a este correo.</p>
      <h2 style="font-family:Georgia,serif">English version</h2>
      <p><strong>Casa_de_SAM_ROI_of_Independence_English.pdf</strong><br>Open this attachment to read and use the workbook in English.</p>
      <h2 lang="es" style="font-family:Georgia,serif">Versión en español</h2>
      <p lang="es"><strong>Casa_de_SAM_ROI_Independencia_Espanol.pdf</strong><br>Abrí este archivo adjunto para leer y usar el cuaderno en español.</p>
      <p>Save both PDFs so you can return to the exercises and decision matrix whenever you need them.<br><span lang="es">Guardá ambos PDF para volver a los ejercicios y a la matriz de decisión cuando los necesites.</span></p>
      <hr style="border:0;border-top:1px solid #ddd5c7;margin:28px 0">
      <h2 style="font-family:Georgia,serif">Stay connected / <span lang="es">Seguí en contacto</span></h2>
      <p><a href="${quarterlyUrl}" style="color:#18324a;font-weight:700">Quarterly updates / Actualizaciones trimestrales</a><br>Four updates per year. <span lang="es">Cuatro actualizaciones por año.</span></p>
      <p><a href="${boardUrl}" style="color:#18324a;font-weight:700">Board interest / Interés en el Consejo Directivo</a><br>No commitment; request more information. <span lang="es">Sin compromiso; podés pedir más información.</span></p>
      <p style="font-size:14px;color:#667085">Your purchase does not automatically subscribe you to marketing emails. Each option requires a separate confirmation.<br><span lang="es">Tu compra no te suscribe automáticamente a correos de difusión. Cada opción requiere una confirmación aparte.</span></p>
      <p style="margin-top:32px">Thank you / Gracias,<br><strong>Amie</strong><br>Casa de SAM</p>
      <p style="font-size:12px;color:#7a7a7a">Questions? Reply to this email: hello@yourscripturecompanion.com.<br><span lang="es">¿Tenés preguntas? Respondé a este correo: hello@yourscripturecompanion.com.</span></p>
    </div>`;
  const text = `Your ROI workbook is ready / Tu cuaderno ya está listo

Thank you for purchasing The ROI of Independence. Both PDF editions are attached and included in your purchase.
Gracias por comprar El retorno de la independencia. Tu compra incluye las dos ediciones en PDF, adjuntas a este correo.

English version:
Casa_de_SAM_ROI_of_Independence_English.pdf
Open this attachment to read and use the workbook in English.

Versión en español:
Casa_de_SAM_ROI_Independencia_Espanol.pdf
Abrí este archivo adjunto para leer y usar el cuaderno en español.

Save both PDFs for future use. Guardá ambos PDF para volver a usarlos.

Optional / Opcional:
Quarterly updates (four per year) / Actualizaciones trimestrales (cuatro por año): ${quarterlyUrl}
Board interest / Interés en el Consejo Directivo: ${boardUrl}

Your purchase does not automatically subscribe you to marketing emails. Each option requires a separate confirmation.
Tu compra no te suscribe automáticamente a correos de difusión. Cada opción requiere una confirmación aparte.

Thank you / Gracias,
Amie
Casa de SAM

Questions? Reply to this email. ¿Tenés preguntas? Respondé a este correo.
hello@yourscripturecompanion.com`;
  return { subject: 'Your ROI workbook — English + Español', html, text, attachments: pdfs };
}
