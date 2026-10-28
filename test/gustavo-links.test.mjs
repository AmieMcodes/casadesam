import test from 'node:test';
import assert from 'node:assert/strict';
import { renderLinkedAnswer } from '../js/gustavo-links.mjs';
function render(text) {
  const nodes=[];
  const target={ownerDocument:{createTextNode:textContent=>({textContent}),createElement:tag=>({tag})},append:n=>nodes.push(n)};
  renderLinkedAnswer(target,text);
  return {nodes,links:nodes.filter(n=>n.tag==='a'),text:nodes.map(n=>n.textContent).join('')};
}
test('English and Spanish replies show a clickable canonical workbook URL without trailing punctuation',()=>{
  for (const prefix of ['You may find this useful: ','Podés ver el cuaderno acá: ']) {
    const text=prefix+'https://casadesam.org/if-something-happened-tonight.';
    const r=render(text);
    assert.equal(r.text,text);assert.equal(r.links.length,1);
    assert.equal(r.links[0].href,'https://casadesam.org/if-something-happened-tonight');
    assert.equal(r.links[0].rel,'noopener noreferrer');
  }
});
test('model HTML and lookalike or unsafe URLs stay inert text',()=>{
  const text='<img src=x onerror=alert(1)> javascript:alert(1) https://casadesam.org.evil.test/free.pdf https://evil.test/casadesam.org/';
  const r=render(text);assert.equal(r.links.length,0);assert.equal(r.text,text);
});
test('multiple approved resources preserve the full answer',()=>{
  const text='See https://casadesam.org/current and https://casadesam.org/casa-de-sam-vision-es.pdf (optional).';
  const r=render(text);assert.equal(r.links.length,2);assert.equal(r.text,text);
});
