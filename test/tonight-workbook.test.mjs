import test from 'node:test';
import assert from 'node:assert/strict';
import { createTonightBundle, readTonightBundle, buildTonightDeliveryEmail, TONIGHT_BUNDLE_KEY } from '../netlify/functions/lib/tonight-workbook.mjs';
import { createUploadHandler } from '../netlify/functions/digital-product-upload.mjs';
import { selectWorkbook } from '../netlify/functions/lib/workbook-routing.mjs';

const en = Buffer.from('%PDF-1.4\nTonight English\n%%EOF');
const es = Buffer.from('%PDF-1.4\nTonight Spanish\n%%EOF');
test('Tonight delivery includes both matching, labeled PDFs and never the ROI book', async () => {
  const pair = createTonightBundle(en, es);
  const pdfs = await readTonightBundle({get:async key=>{assert.equal(key,TONIGHT_BUNDLE_KEY);return pair;}});
  const email = buildTonightDeliveryEmail({pdfs});
  assert.equal(email.attachments.length,2);
  assert.deepEqual(Buffer.from(email.attachments[0].content,'base64'),en);
  assert.deepEqual(Buffer.from(email.attachments[1].content,'base64'),es);
  for (const text of [email.html,email.text]) {
    assert.match(text,/If Something Happened Tonight/); assert.match(text,/Si esta noche me pasara algo/);
    for (const file of pdfs) assert.ok(text.includes(file.filename));
    assert.doesNotMatch(text,/ROI|Independence/);
  }
});
test('missing or corrupted editions fail before delivery', async()=>{
  await assert.rejects(()=>readTonightBundle({get:async()=>null}));
  const pair=createTonightBundle(en,es); pair.editions[1].content=en.toString('base64');
  await assert.rejects(()=>readTonightBundle({get:async()=>pair}),/integrity/);
});
test('uploading Tonight keeps the existing ROI bundle intact', async()=>{
  const values=new Map([['roi-of-independence-bilingual.json',{unchanged:true}]]);
  const handler=createUploadHandler({getProductStore:()=>({setJSON:async(k,v)=>values.set(k,v),get:async k=>values.get(k)}),env:{PRODUCT_UPLOAD_SECRET:'test-only'}});
  const data=new FormData();data.set('secret','test-only');data.set('product','tonight');
  data.set('file',new File([en],'en.pdf',{type:'application/pdf'}));data.set('spanish_file',new File([es],'es.pdf',{type:'application/pdf'}));
  assert.equal((await handler(new Request('https://example.test',{method:'POST',body:data}))).status,200);
  assert.deepEqual(values.get('roi-of-independence-bilingual.json'),{unchanged:true});
  assert.equal(values.get(TONIGHT_BUNDLE_KEY).editions.length,2);
});
test('only paid sessions from an explicitly configured workbook link can be fulfilled',()=>{
  const env={STRIPE_ROI_PAYMENT_LINK_ID:'roi-link',STRIPE_TONIGHT_PAYMENT_LINK_ID:'tonight-link'};
  const s={id:'fixture-session',payment_status:'paid',payment_link:'tonight-link'};
  assert.equal(selectWorkbook(s,env),'tonight');
  assert.equal(selectWorkbook({...s,payment_link:'roi-link'},env),'roi');
  for (const status of ['unpaid',undefined,'processing']) assert.equal(selectWorkbook({...s,payment_status:status},env),null);
  assert.equal(selectWorkbook({...s,payment_link:'other-link'},env),null);
  assert.equal(selectWorkbook(s,{}),null);
});
