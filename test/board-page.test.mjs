import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = new URL('../js/board.mjs', import.meta.url);
const module = await import(source.href).catch(() => ({}));
const contact={name:'Test Visitor',email:'test@example.org',country:'Paraguay',preferredLanguage:'es',interest:'I would like to learn more.'};
const response=data=>({ok:true,json:async()=>data});

test('board sender exists and rejects missing consent before any request',async()=>{
  assert.equal(typeof module.createContactSender,'function');
  let calls=0;
  const sender=module.createContactSender(async()=>{calls++;return response({state:'signed'});});
  await assert.rejects(sender.submit({contact,consent:false}),/consent/i);
  assert.equal(calls,0);
});
test('only entered form fields are sent, without chat history',async()=>{
  assert.equal(typeof module.createContactSender,'function');
  const requests=[];
  const sender=module.createContactSender(async(url,options)=>{requests.push(JSON.parse(options.body));return response(requests.length===1?{state:'signed'}:{sent:true});});
  await sender.submit({contact:{...contact,history:'PRIVATE CHAT'},consent:true,history:'PRIVATE CHAT'});
  assert.deepEqual(requests[0],{action:'start-contact',language:'es'});
  assert.deepEqual(requests[1],{action:'submit-contact',state:'signed',contact,consent:true,website:''});
});
test('duplicate clicks do not send twice and successful submission cannot replay',async()=>{
  assert.equal(typeof module.createContactSender,'function');
  let release;const waiting=new Promise(resolve=>release=resolve);let calls=0;
  const sender=module.createContactSender(async()=>{calls++;if(calls===1){await waiting;return response({state:'signed'});}return response({sent:true});});
  const first=sender.submit({contact,consent:true});
  await assert.rejects(sender.submit({contact,consent:true}),/progress/i);
  release();await first;
  await assert.rejects(sender.submit({contact,consent:true}),/already/i);
  assert.equal(calls,2);
});
test('failed send keeps the same token and submitted details for an explicit retry',async()=>{
  assert.equal(typeof module.createContactSender,'function');
  const requests=[];
  const sender=module.createContactSender(async(url,options)=>{requests.push(JSON.parse(options.body));if(requests.length===1)return response({state:'signed'});if(requests.length===2)throw Error('Offline');return response({sent:true});});
  await assert.rejects(sender.submit({contact,consent:true}),/Offline/);
  await sender.submit({contact,consent:true});
  assert.deepEqual(requests[2],requests[1]);
});
test('landing page has accessible explicit consent, separate anonymous FAQ and all existing PDFs',async()=>{
  const html=await readFile(new URL('../board.html',import.meta.url),'utf8').catch(()=>'');
  assert.match(html,/data-gustavo-context="board"/);
  assert.match(html,/data-gustavo-board-chat/);
  assert.match(html,/<input[^>]+name="consent"[^>]+required/);
  assert.doesNotMatch(html,/<input[^>]+name="consent"[^>]+checked/);
  for(const pdf of ['casa-de-sam-vision.pdf','casa-de-sam-vision-es.pdf','casa-de-sam-board-commitment-2030.pdf','casa-de-sam-compromiso-junta-2030-es.pdf'])assert.ok(html.includes(pdf));
  assert.match(html,/role="status"/);
  assert.match(html,/<noscript>/);
  assert.match(html,/February–March 2027/);
});

test('validation failures permit correction but ambiguous failures keep original payload',async()=>{
  const requests=[];
  const sender=module.createContactSender(async(url,options)=>{requests.push(JSON.parse(options.body));if(requests.length===1)return response({state:'signed'});if(requests.length===2)return {ok:false,json:async()=>({error:'Check your details',code:'VALIDATION'})};return response({sent:true});});
  await assert.rejects(sender.submit({contact,consent:true}),/Check your details/);
  assert.equal(sender.pending,false);
  const corrected={...contact,name:'Corrected Visitor'};
  await sender.submit({contact:corrected,consent:true});
  assert.equal(requests[2].contact.name,'Corrected Visitor');
});
function pageFixture(){
  const inputs=Object.fromEntries(Object.entries({...contact,consent:'',website:''}).map(([key,value])=>[key,{value,checked:key==='consent'}]));
  const fields={disabled:false};const submit={disabled:false,textContent:''};const status={textContent:'',dataset:{},focus(){this.focused=true;}};
  const listeners={};const buttons=['en','es'].map(language=>({dataset:{boardLanguage:language},attrs:{},setAttribute(key,value){this.attrs[key]=value;},addEventListener(type,fn){this.click=fn;}}));
  const text={dataset:{en:'English title',es:'Título en español'},textContent:''};
  const form={elements:{namedItem:key=>inputs[key]},valid:true,reportValidity(){return this.valid;},addEventListener(type,fn){listeners[type]=fn;},reset(){for(const input of Object.values(inputs)){input.value='';input.checked=false;}}};
  const nodes={'#board-interest-form':form,'#board-form-fields':fields,'#board-submit':submit,'#board-form-status':status};
  const doc={documentElement:{lang:'en'},querySelector:selector=>nodes[selector],querySelectorAll:selector=>selector==='[data-board-language]'?buttons:[text]};
  const events=[];const win={location:{href:'https://casadesam.org/board'},dispatchEvent:event=>events.push(event)};
  return {inputs,fields,submit,status,buttons,text,form,listeners,doc,win,events};
}
test('language toggle changes page language and FAQ event without clearing form details',()=>{
  const p=pageFixture();module.mountBoardPage(p.doc,p.win);
  p.buttons[1].click();
  assert.equal(p.doc.documentElement.lang,'es');assert.equal(p.text.textContent,'Título en español');
  assert.equal(p.inputs.name.value,contact.name);assert.equal(p.inputs.preferredLanguage.value,'es');
  assert.equal(p.events.at(-1).type,'casa:languagechange');assert.equal(p.events.at(-1).detail.language,'es');
});
test('invalid form makes no request; uncertain send freezes fields and retry clears them only after success',async()=>{
  const original=globalThis.fetch;const requests=[];
  globalThis.fetch=async(url,options)=>{requests.push(JSON.parse(options.body));if(requests.length===1)return response({state:'signed'});if(requests.length===2)throw Error('offline');return response({sent:true});};
  try{
    const p=pageFixture();module.mountBoardPage(p.doc,p.win);
    p.form.valid=false;await p.listeners.submit({preventDefault(){}});assert.equal(requests.length,0);
    p.form.valid=true;await p.listeners.submit({preventDefault(){}});
    assert.equal(p.fields.disabled,true);assert.equal(p.submit.disabled,false);assert.equal(p.inputs.name.value,contact.name);assert.match(p.status.textContent,/Retry/);
    p.buttons[1].click();assert.equal(p.inputs.preferredLanguage.value,'en');
    await p.listeners.submit({preventDefault(){}});
    assert.deepEqual(requests[2],requests[1]);assert.equal(p.submit.disabled,true);assert.equal(p.inputs.name.value,'');assert.match(p.status.textContent,/Gracias/);
  }finally{globalThis.fetch=original;}
});
test('without JavaScript the form cannot submit PII through a GET URL',async()=>{
  const html=await readFile(new URL('../board.html',import.meta.url),'utf8');
  assert.match(html,/<form[^>]+method="post"[^>]+action="\/api\/gustavo-board"/);
  assert.match(html,/<button[^>]+id="board-submit"[^>]+disabled/);
  const p=pageFixture();p.submit.disabled=true;module.mountBoardPage(p.doc,p.win);assert.equal(p.submit.disabled,false);
});
test('submission conflict stops retries and provides a contact fallback',async()=>{
  const original=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;return calls===1?response({state:'signed'}):{ok:false,json:async()=>({error:'conflict',code:'SUBMISSION_CONFLICT'})};};
  try{const p=pageFixture();module.mountBoardPage(p.doc,p.win);await p.listeners.submit({preventDefault(){}});assert.equal(p.submit.disabled,true);assert.match(p.status.textContent,/hello@casadesam.org/);}finally{globalThis.fetch=original;}
});
