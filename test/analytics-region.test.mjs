import test from 'node:test';
import assert from 'node:assert/strict';

const edgeModule = await import('../netlify/edge-functions/analytics-region.js').catch(() => null);
test('regional endpoint exists', () => assert.ok(edgeModule, 'missing regional endpoint'));
const ask = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO','SK','SI','ES','SE','GB','CH'];
for (const code of [...ask, 'PY', 'US', 'CA', undefined, '', 'XX']) test(`trusted region policy: ${code}`, async () => {
  assert.ok(edgeModule);
  const response = await edgeModule.default(new Request('https://casadesam.org/analytics-region?country=US', {headers:{'x-country':'US','x-nf-geo':'US'}}), {geo:{country:{code}}});
  assert.deepEqual(await response.json(), {mode:ask.includes(code)?'consent':'automatic'});
  for (const header of ['cache-control','netlify-cdn-cache-control','cdn-cache-control']) assert.match(response.headers.get(header), /no-store/);
});
test('missing trusted geo uses owner-selected automatic fallback; route is explicit and uncached', async () => {
  assert.ok(edgeModule);
  assert.deepEqual(await (await edgeModule.default(new Request('https://casadesam.org/analytics-region'), {})).json(),{mode:'automatic'});
  assert.equal(edgeModule.config.path,'/analytics-region');
  assert.notEqual(edgeModule.config.cache,'manual');
});
