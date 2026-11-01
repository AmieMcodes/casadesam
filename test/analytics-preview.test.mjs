import test from 'node:test';
import assert from 'node:assert/strict';
const preview = await import('../netlify/edge-functions/analytics-preview.js').catch(()=>null);
test('QA route never appears on production, branch deploy or unknown context',async()=>{
 assert.ok(preview,'missing preview-only fixture');
 for(const context of [{},{deploy:{}},{deploy:{context:'production'}},{deploy:{context:'branch-deploy'}}]){
  const r=await preview.default(new Request('https://casadesam.org/analytics-preview?context=deploy-preview',{headers:{'x-context':'deploy-preview'}}),context);
  assert.equal(r.status,404);
 }
});
test('trusted deploy-preview fixture blocks external connections and forms',async()=>{
 assert.ok(preview);
 const r=await preview.default(new Request('https://preview.test/analytics-preview'),{deploy:{context:'deploy-preview'}});
 assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/connect-src 'none'/);
 assert.match(r.headers.get('content-security-policy'),/form-action 'none'/);
 assert.match(r.headers.get('cache-control'),/no-store/);
 const html=await r.text();assert.match(html,/not live analytics/i);assert.doesNotMatch(html,/https:\/\/www.googletagmanager/);
 assert.equal(preview.config.path,'/analytics-preview');
});
