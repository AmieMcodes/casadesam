import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoardHandler } from '../netlify/functions/gustavo-board.mjs';
import { newInterview, sealState } from '../netlify/functions/lib/board-interest.mjs';
const secret = 'fixture-secret-never-production';
const contact = {name:'Example Person',email:'person@example.test',country:'Paraguay',preferredLanguage:'es',interest:'I would like to understand the founding role.'};
function fixture(){
  const records=new Map(),sent=[]; let fail=false,models=0;
  const handler=createBoardHandler({env:{GUSTAVO_BOARD_STATE_SECRET:secret,GUSTAVO_BOARD_TO_EMAIL:'owner@example.test'},modelTurn:async()=>{models++;throw Error('No model call expected');},send:async(body,key,id)=>{if(fail)throw Error('mail unavailable');sent.push({body,id});return{id:'fixture-mail'};},getReceipts:()=>({get:async key=>records.get(key),setJSON:async(key,value)=>records.set(key,value)})});
  return {handler,sent,records,setFail:value=>{fail=value;},models:()=>models};
}
async function call(handler,body,origin='https://casadesam.org') {return handler(new Request('https://casadesam.org/api/gustavo-board',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)}));}
async function start(handler,language='en'){const response=await call(handler,{action:'start-contact',language});assert.equal(response.status,200);return (await response.json()).state;}
test('contact flow sends only explicitly provided fields to the configured recipient without a model call',async()=>{
  const f=fixture();const state=await start(f.handler,'es');
  const response=await call(f.handler,{action:'submit-contact',state,contact,consent:true,to:'attacker@example.test',history:[{content:'PRIVATE CHAT'}]});
  assert.equal(response.status,200);assert.equal((await response.json()).sent,true);
  assert.equal(f.sent.length,1);assert.deepEqual(f.sent[0].body.to,['owner@example.test']);
  assert.match(f.sent[0].body.text,/Paraguay/);assert.match(f.sent[0].body.text,/Preferred language: es/);
  assert.doesNotMatch(f.sent[0].body.text,/PRIVATE CHAT/);assert.doesNotMatch(f.sent[0].body.text,/attacker/);
  assert.equal(f.models(),0);
});
test('contact submission requires explicit boolean consent and valid bounded fields',async()=>{
  const f=fixture();const state=await start(f.handler);const body={action:'submit-contact',state,contact,consent:true};
  for(const consent of [false,undefined,'true',1])assert.equal((await call(f.handler,{...body,consent})).status,400);
  for(const invalid of [{name:''},{name:'X\nBCC: bad'},{name:'x'.repeat(121)},{email:'bad'},{email:'x'.repeat(255)},{country:''},{country:'x'.repeat(121)},{preferredLanguage:'fr'},{interest:''},{interest:'x'.repeat(2401)}])assert.equal((await call(f.handler,{...body,contact:{...contact,...invalid}})).status,400,JSON.stringify(invalid));
  assert.equal((await call(f.handler,{...body,website:'bot'})).status,400);assert.equal(f.sent.length,0);
});
test('contact tokens cannot submit interviews and interview tokens cannot submit contacts',async()=>{
  const f=fixture();const state=await start(f.handler);const interview=newInterview('en');interview.stage='review';
  assert.equal((await call(f.handler,{action:'submit',state,contact,consent:true})).status,400);
  assert.equal((await call(f.handler,{action:'submit-contact',state:sealState(interview,secret),contact,consent:true})).status,400);
  for(const action of ['answer','skip','review'])assert.equal((await call(f.handler,{action,state,message:'not an answer'})).status,400);
  assert.equal(f.sent.length,0);
});
test('expired, tampered, malformed and cross-origin requests cannot send contact mail',async()=>{
  const f=fixture();const state=await start(f.handler);const body={action:'submit-contact',state,contact,consent:true};
  for(const token of [state+'x','bad',null,sealState({...newInterview(),purpose:'board-contact',stage:'contact',expires:1},secret)])assert.equal((await call(f.handler,{...body,state:token})).status,400);
  assert.equal((await call(f.handler,body,'https://attacker.example')).status,403);
  assert.equal((await call(f.handler,null)).status,400);
  assert.equal(f.sent.length,0);
});
test('failed send is retryable, successful replay sends once and stores no contact details in receipts',async()=>{
  const f=fixture();const state=await start(f.handler);const body={action:'submit-contact',state,contact,consent:true};
  f.setFail(true);const failure=await call(f.handler,body);assert.equal(failure.status,502);assert.equal((await failure.json()).sent,undefined);
  f.setFail(false);assert.equal((await call(f.handler,body)).status,200);assert.equal((await call(f.handler,body)).status,200);assert.equal(f.sent.length,1);
  assert.doesNotMatch(JSON.stringify([...f.records.values()]),/person@example|Example Person|Paraguay/);
});
test('contact email safely escapes HTML and states follow-up is not appointment',async()=>{
  const f=fixture();const state=await start(f.handler);assert.equal((await call(f.handler,{action:'submit-contact',state,contact:{...contact,name:'<img src=x>',interest:'<script>alert(1)</script>'},consent:true})).status,200);
  assert.doesNotMatch(f.sent[0].body.html,/<img|<script/);assert.match(f.sent[0].body.html,/&lt;script/);assert.match(f.sent[0].body.text,/not.*appointment/i);
});
test('successful replay with different fields is a conflict, not a false new submission',async()=>{
  const f=fixture();const state=await start(f.handler);const body={action:'submit-contact',state,contact,consent:true};
  assert.equal((await call(f.handler,body)).status,200);
  const response=await call(f.handler,{...body,contact:{...contact,interest:'A different submission'}});
  assert.equal(response.status,409);assert.equal((await response.json()).sent,undefined);assert.equal(f.sent.length,1);
});
test('existing interview introduces both planned entities and the February–March window without guaranteeing formation',async()=>{
  const f=fixture();
  for(const language of ['en','es']){
    const response=await call(f.handler,{action:'start',language});assert.equal(response.status,200);
    const {answer}=await response.json();
    assert.match(answer,language==='en'?/February–March 2027/:/febrero–marzo de 2027/);
    assert.match(answer,/Paraguay/);assert.match(answer,/Friends/);
    assert.match(answer,language==='en'?/plan, not a guarantee/:/plan, no una garantía/);
  }
});
test('receipt-store failure is retryable uncertainty, never mislabeled as an invalid state',async()=>{
  const handler=createBoardHandler({env:{GUSTAVO_BOARD_STATE_SECRET:secret,GUSTAVO_BOARD_TO_EMAIL:'owner@example.test'},send:async()=>{throw Error('must not send');},getReceipts:()=>({get:async()=>{throw Error('storage unavailable');}})});
  const state=await start(handler);
  const response=await call(handler,{action:'submit-contact',state,contact,consent:true});
  assert.equal(response.status,502);assert.equal((await response.json()).code,'SEND_UNCONFIRMED');
});
