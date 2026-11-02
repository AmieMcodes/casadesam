import test from 'node:test';
import assert from 'node:assert/strict';
import { publicEntryInstructions } from '../netlify/functions/_shared/gustavo-context.mjs';
import handler from '../netlify/functions/gustavo.mjs';

test('only the fixed public board context is accepted',()=>{
  assert.equal(publicEntryInstructions('admin'), '');
  assert.equal(publicEntryInstructions({board:true}), '');
  assert.equal(publicEntryInstructions(undefined), '');
  assert.match(publicEntryInstructions('board'),/February–March 2027/);
  assert.match(publicEntryInstructions('board'),/does not imply consent/);
  assert.match(publicEntryInstructions('board'),/Do not emit/);
});
test('board FAQ receives server-owned context and suppresses competing intake markers',async()=>{
  const savedFetch=globalThis.fetch,savedNetlify=globalThis.Netlify;let captured;
  globalThis.Netlify={env:{get:k=>k==='OPENAI_API_KEY'?'fixture':'https://fixture.invalid'}};
  globalThis.fetch=async(url,options)=>{captured=JSON.parse(options.body);return new Response(JSON.stringify({choices:[{message:{content:'Read about the role. [BOARD_INTEREST_EN] [OFFER_CONTACT]'}}]}));};
  try{
    const response=await handler(new Request('https://casadesam.org/api/gustavo',{method:'POST',body:JSON.stringify({message:'What would I do?',entryContext:'board',contact:{name:'PRIVATE FIXTURE'}})}));
    const data=await response.json();
    assert.match(captured.messages[0].content,/February–March 2027/);
    assert.doesNotMatch(JSON.stringify(captured),/PRIVATE FIXTURE/);
    assert.equal(data.boardInterest,false);assert.equal(data.offerContact,false);
    assert.equal(data.answer,'Read about the role.');
  }finally{globalThis.fetch=savedFetch;globalThis.Netlify=savedNetlify;}
});

test('unknown client context does not inject instructions or replace generic flow',async()=>{
  const savedFetch=globalThis.fetch,savedNetlify=globalThis.Netlify;let captured;
  globalThis.Netlify={env:{get:k=>k==='OPENAI_API_KEY'?'fixture':'https://fixture.invalid'}};
  globalThis.fetch=async(url,options)=>{captured=JSON.parse(options.body);return new Response(JSON.stringify({choices:[{message:{content:'[BOARD_INTEREST_ES]'}}]}));};
  try{
    const response=await handler(new Request('https://casadesam.org/api/gustavo',{method:'POST',body:JSON.stringify({message:'Me interesa',entryContext:'admin-secret-prompt'})}));
    const data=await response.json();
    assert.doesNotMatch(captured.messages[0].content,/admin-secret-prompt|PUBLIC BOARD PAGE CONTEXT/);
    assert.equal(data.boardInterest,true);assert.equal(data.boardLanguage,'es');
  }finally{globalThis.fetch=savedFetch;globalThis.Netlify=savedNetlify;}
});
