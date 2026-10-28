import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoiBundle, readRoiBundle, buildRoiDeliveryEmail } from '../netlify/functions/lib/roi-workbook.mjs';

const english = Buffer.from('%PDF-1.4\nEnglish fixture\n%%EOF');
const spanish = Buffer.from('%PDF-1.4\nSpanish fixture\n%%EOF');

test('one delivery includes two distinct PDFs under the language labels shown to buyers', async () => {
  const bundle = createRoiBundle(english, spanish);
  const pdfs = await readRoiBundle({ get: async () => bundle });
  const email = buildRoiDeliveryEmail({ pdfs, quarterlyUrl: 'https://example.test/quarterly', boardUrl: 'https://example.test/board' });
  assert.equal(email.attachments.length, 2);
  assert.equal(email.attachments[0].filename, 'Casa_de_SAM_ROI_of_Independence_English.pdf');
  assert.equal(email.attachments[1].filename, 'Casa_de_SAM_ROI_Independencia_Espanol.pdf');
  assert.deepEqual(Buffer.from(email.attachments[0].content, 'base64'), english);
  assert.deepEqual(Buffer.from(email.attachments[1].content, 'base64'), spanish);
  for (const copy of [email.html, email.text]) {
    assert.match(copy, /English version/);
    assert.match(copy, /Versión en español/);
    for (const attachment of email.attachments) assert.ok(copy.includes(attachment.filename));
  }
  assert.match(email.text, /four per year/);
  assert.match(email.text, /cuatro por año/);
});

test('missing or damaged Spanish content cannot become a one-file delivery', async () => {
  assert.throws(() => createRoiBundle(english, Buffer.from('not a PDF')), /PDF/);
  const bundle = createRoiBundle(english, spanish);
  bundle.editions.pop();
  await assert.rejects(() => readRoiBundle({ get: async () => bundle }), /both|editions|bundle/i);
  const corrupt = createRoiBundle(english, spanish);
  corrupt.editions[1].content = english.toString('base64');
  await assert.rejects(() => readRoiBundle({ get: async () => corrupt }), /integrity|hash|corrupt/i);
});

test('an unconfigured bundle fails instead of delivering the legacy English-only file', async () => {
  await assert.rejects(() => readRoiBundle({ get: async () => null }), /bundle|configured|present/i);
});
