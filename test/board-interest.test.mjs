import test from 'node:test';
import assert from 'node:assert/strict';
import { newInterview, stepInterview, sealState, openState, buildBoardEmail, questions } from '../netlify/functions/lib/board-interest.mjs';
import { createBoardHandler } from '../netlify/functions/gustavo-board.mjs';
const secret='fixture-signing-secret-not-for-production';
test('signed state preserves all eight answers and rejects tampering or expiry',()=>{
  let s=newInterview('en');
  for(let i=0;i<8;i++)s=stepInterview(s,`My distinct answer ${i}`,{kind:'advance'});
  assert.equal(s.stage,'review');assert.equal(s.entries.length,8);
  const token=sealState(s,secret);const read=openState(token,secret);
  assert.equal(read.entries[0].answer,'My distinct answer 0');
  assert.throws(()=>openState(token+'x',secret));
  assert.throws(()=>openState(sealState({...s,expires:1},secret),secret));
});
test('one follow-up maximum, then move on even if the model requests another',()=>{
  let s=stepInterview(newInterview('en'),'I have nonprofit experience',{kind:'followup',question:'What kind of work did you do?'});
  assert.equal(s.index,0);assert.equal(s.awaitingFollowup,true);
  s=stepInterview(s,'I prefer not to discuss more',{kind:'followup',question:'More details?'});
  assert.equal(s.index,1);assert.equal(s.entries[0].followupAnswer,'I prefer not to discuss more');
});
test('clarification does not consume an answer and skipping is explicit',()=>{
  const s=newInterview('es');
  assert.deepEqual(stepInterview(s,'What does that mean?',{kind:'clarify'}),s);
  const next=stepInterview(s,'',{kind:'skip'});
  assert.equal(next.index,1);assert.equal(next.entries[0].answer,'');assert.equal(next.entries[0].skipped,true);
});
test('email preserves uncertainty and safely escapes applicant HTML',()=>{
  let s=newInterview('en');s=stepInterview(s,'<img src=x> I am unsure about 2030',{kind:'advance'});s.stage='review';
  const mail=buildBoardEmail(s,{name:'Example Person',email:'person@example.test'});
  assert.match(mail.subject,/board interest/);assert.match(mail.text,/I am unsure about 2030/);
  assert.doesNotMatch(mail.html,/<img src=x>/);assert.match(mail.html,/&lt;img/);
  assert.equal(questions('es').length,8);
});
function fixture(fail=false){
  const records=new Map();let sent=[];
  const handler=createBoardHandler({env:{GUSTAVO_BOARD_STATE_SECRET:secret,GUSTAVO_BOARD_TO_EMAIL:'owner@example.test'},modelTurn:async()=>({kind:'advance'}),send:async body=>{if(fail)throw Error('mail unavailable');sent.push(body);return{id:'fixture-mail'};},getReceipts:()=>({get:async k=>records.get(k),setJSON:async(k,v)=>records.set(k,v)})});
  return {handler,sent};
}
async function call(handler,body){return handler(new Request('https://casadesam.org/api/gustavo-board',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));}
test('sending requires review, explicit consent and valid contact; retries send once',async()=>{
  const {handler,sent}=fixture();let s=newInterview('en');s.stage='review';const token=sealState(s,secret);
  const body={action:'submit',state:token,contact:{name:'Example Person',email:'person@example.test'},consent:true};
  assert.equal((await call(handler,{...body,consent:false})).status,400);
  assert.equal((await call(handler,{...body,contact:{name:'X',email:'bad'}})).status,400);
  assert.equal(sent.length,0);
  assert.equal((await call(handler,body)).status,200);assert.equal((await call(handler,body)).status,200);
  assert.equal(sent.length,1);assert.deepEqual(sent[0].to,['owner@example.test']);
});
test('email failure stays retryable and is never reported as sent',async()=>{
  const {handler}=fixture(true);const s=newInterview('es');s.stage='review';
  const response=await call(handler,{action:'submit',state:sealState(s,secret),contact:{name:'Example',email:'person@example.test'},consent:true});
  assert.equal(response.status,502);assert.equal((await response.json()).sent,undefined);
});
test('sixteen conversation turns retain every answer and follow-up through review and edits',async()=>{
  const sent=[];
  const handler=createBoardHandler({env:{GUSTAVO_BOARD_STATE_SECRET:secret,GUSTAVO_BOARD_TO_EMAIL:'owner@example.test'},modelTurn:async()=>({kind:'followup',question:'What contribution do you have in mind?'}),send:async body=>{sent.push(body);return{id:'long-fixture'};},getReceipts:()=>({get:async()=>null,setJSON:async()=>{}})});
  let data=await(await call(handler,{action:'start',language:'es'})).json();
  for(let i=0;i<8;i++){
    data=await(await call(handler,{action:'answer',state:data.state,message:`Respuesta principal ${i}`})).json();
    data=await(await call(handler,{action:'answer',state:data.state,message:`Detalle ${i}`})).json();
  }
  assert.equal(data.stage,'review');assert.equal(data.review.length,8);
  assert.equal(data.review[0].answer,'Respuesta principal 0');assert.equal(data.review[7].followupAnswer,'Detalle 7');
  const response=await call(handler,{action:'submit',state:data.state,consent:true,contact:{name:'Example',email:'person@example.test'},edits:[{id:'motivation',answer:'Reviewed motivation',followupAnswer:'Reviewed detail'}],to:'attacker@example.test'});
  assert.equal(response.status,200);assert.match(sent[0].text,/Reviewed motivation/);assert.match(sent[0].text,/Detalle 7/);assert.deepEqual(sent[0].to,['owner@example.test']);
});
test('private refusals bypass follow-up planning; premature, forged and bot submissions cannot send',async()=>{
  let planned=0,sends=0;
  const handler=createBoardHandler({env:{GUSTAVO_BOARD_STATE_SECRET:secret,GUSTAVO_BOARD_TO_EMAIL:'owner@example.test'},modelTurn:async()=>{planned++;return{kind:'followup',question:'More?'};},send:async()=>{sends++;return{id:'never'};}});
  const start=await(await call(handler,{action:'start'})).json();
  const next=await(await call(handler,{action:'answer',state:start.state,message:'I prefer not to discuss that'})).json();
  assert.equal(planned,0);assert.equal(openState(next.state,secret).index,1);
  const submit={action:'submit',state:next.state,consent:true,contact:{name:'Example',email:'person@example.test'}};
  assert.equal((await call(handler,submit)).status,400);
  assert.equal((await call(handler,{...submit,state:next.state+'x'})).status,400);
  assert.equal((await call(handler,{...submit,website:'bot-filled'})).status,400);
  assert.equal(sends,0);
});
