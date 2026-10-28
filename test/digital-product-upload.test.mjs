import test from 'node:test';
import assert from 'node:assert/strict';
import { createUploadHandler } from '../netlify/functions/digital-product-upload.mjs';

function setup() {
  let bundle = null;
  let writes = 0;
  const store = { setJSON: async (_key, value) => { writes++; bundle = value; }, get: async () => bundle };
  const handler = createUploadHandler({ getProductStore: () => store, env: { PRODUCT_UPLOAD_SECRET: 'existing-key', PRODUCT_UPLOAD_AUTOMATION_SECRET: 'automation-key' } });
  return { handler, writes: () => writes };
}

function upload(secret, { spanish = true, invalid = false, status = false } = {}) {
  const data = new FormData(); data.set('secret', secret);
  if (status) data.set('operation', 'status');
  else {
    data.set('file', new File(['%PDF-1.4\nEnglish'], 'en.pdf', { type: 'application/pdf' }));
    if (spanish) data.set('spanish_file', new File([invalid ? 'bad' : '%PDF-1.4\nSpanish'], 'es.pdf', { type: 'application/pdf' }));
  }
  return new Request('https://example.test/upload', { method: 'POST', body: data });
}

test('the existing admin credential can publish and verify a complete pair in one write', async () => {
  const { handler, writes } = setup();
  assert.equal((await handler(upload('existing-key'))).status, 200);
  assert.equal(writes(), 1);
  const response = await handler(upload('existing-key', { status: true }));
  const metadata = await response.json();
  assert.deepEqual(metadata.editions.map(x => x.language), ['en', 'es']);
  assert.ok(metadata.editions.every(x => /^[a-f0-9]{64}$/.test(x.sha256)));
  assert.ok(metadata.editions.every(x => !('content' in x)));
});

test('a scoped automation credential works without replacing the existing credential', async () => {
  const { handler } = setup();
  assert.equal((await handler(upload('automation-key'))).status, 200);
  assert.equal((await handler(upload('existing-key', { status: true }))).status, 200);
});

test('unauthorized, missing, and invalid uploads leave the current bundle untouched', async () => {
  const { handler, writes } = setup();
  assert.equal((await handler(upload('wrong-key'))).status, 403);
  assert.equal((await handler(upload('existing-key', { spanish: false }))).status, 400);
  assert.equal((await handler(upload('existing-key', { invalid: true }))).status, 400);
  assert.equal(writes(), 0);
});
