import crypto from 'node:crypto';

const EN = [
  ['motivation','What draws you to Casa de SAM and to serving on its board?'],
  ['good-life','Casa de SAM is being designed for adults with substantial lifelong support needs. People who can sustain traditional employment are not the intended resident population. What does a good adult life look like for someone who will always need substantial support?'],
  ['education-work','Learning and meaningful participation can matter without employment or independence becoming the expected outcome. What place should education, skill-building, and work have in that person’s life?'],
  ['choice','Residents will not have to earn their home through work, classes, productivity, or increasing independence. How would you respond if a resident didn’t want to attend an optional class or participate in a bakery or farm activity?'],
  ['mission','Board members bring expertise while protecting the established mission. How would you handle a disagreement between your professional instincts and Casa de SAM’s founding principles?'],
  ['through-2030','The expected founding-phase commitment through 2030 is roughly 20 hours a year or less: occasional virtual meetings, document review, questions, and governance work. Board service is unpaid; this is not a donation or fundraising commitment. What could you realistically contribute during that phase?'],
  ['after-2030','Around 2030, responsibilities are expected to increase: quarterly board meetings plus committee/project work, potentially monthly meetings during active periods. There will be a fresh conversation about continuing; joining now does not imply an indefinite commitment. Would continued service interest you, or would the founding phase suit you better?'],
  ['background','What experience or perspective would you bring, and are there any relationships or business interests you would want to discuss directly with Amie? You don’t need to share private family, medical, religious, or financial details here.'],
];
const ES = [
  ['motivation','¿Qué te atrae de Casa de SAM y de la posibilidad de integrar su Consejo Directivo?'],
  ['good-life','Casa de SAM se está diseñando para personas adultas que necesitan apoyo significativo de por vida. Quienes pueden sostener un empleo tradicional no son la población residente prevista. ¿Cómo sería una buena vida adulta para alguien que siempre va a necesitar mucho apoyo?'],
  ['education-work','Aprender y participar en actividades con sentido puede ser valioso sin que el empleo o la independencia sean el resultado esperado. ¿Qué lugar deberían tener la educación, el aprendizaje de habilidades y el trabajo en la vida de esa persona?'],
  ['choice','Las personas residentes no tendrán que ganarse su hogar trabajando, asistiendo a clases, siendo productivas o volviéndose más independientes. ¿Cómo responderías si una persona no quisiera asistir a una clase opcional o participar en una actividad de la panadería o la granja?'],
  ['mission','Cada integrante aporta experiencia y ayuda a proteger la misión establecida. ¿Cómo manejarías un desacuerdo entre tu criterio profesional y los principios fundacionales de Casa de SAM?'],
  ['through-2030','Hasta 2030, se prevé una dedicación de unas 20 horas al año o menos: algunas reuniones virtuales, revisión de documentos, consultas y tareas de gobierno institucional. Es un servicio no remunerado, sin compromiso de donar ni de recaudar fondos. ¿Qué podrías aportar de forma realista durante esa etapa?'],
  ['after-2030','Alrededor de 2030 se prevé más trabajo: reuniones trimestrales y tareas de comités o proyectos, con posibles reuniones mensuales en períodos de mayor actividad. Habrá una nueva conversación para decidir si seguís; sumarte ahora no implica un compromiso indefinido. ¿Te interesaría considerar esa continuidad o te quedaría mejor la etapa fundacional?'],
  ['background','¿Qué experiencia o perspectiva podrías aportar y hay vínculos o intereses comerciales que quisieras conversar directamente con Amie? No hace falta compartir acá detalles privados de tu familia, salud, religión o finanzas.'],
];
export const questions = lang => (lang === 'es' ? ES : EN).map(([id,question])=>({id,question}));
export function newInterview(lang='en') {
  return {version:1,id:crypto.randomUUID(),language:lang==='es'?'es':'en',expires:Date.now()+8*60*60*1000,index:0,entries:[],awaitingFollowup:false,stage:'interview'};
}
export function sealState(state,secret) {
  if(!secret)throw new Error('Board conversation is not configured');
  const payload=Buffer.from(JSON.stringify(state)).toString('base64url');
  return payload+'.'+crypto.createHmac('sha256',secret).update(payload).digest('base64url');
}
export function openState(token,secret) {
  if(typeof token!=='string'||token.length>90000||!secret)throw new Error('Invalid conversation');
  const parts=token.split('.');if(parts.length!==2)throw new Error('Invalid conversation');
  const [payload,signature]=parts;
  const expected=crypto.createHmac('sha256',secret).update(payload).digest();
  const actual=Buffer.from(signature,'base64url');
  if(actual.length!==expected.length||!crypto.timingSafeEqual(actual,expected))throw new Error('Invalid conversation');
  const state=JSON.parse(Buffer.from(payload,'base64url').toString());
  if(state.version!==1||!state.id||state.expires<Date.now()||!Array.isArray(state.entries)||!Number.isInteger(state.index)||state.index<0||state.index>8)throw new Error('Conversation expired or invalid');
  return state;
}
export function stepInterview(state,message,decision={kind:'advance'}) {
  if(state.stage!=='interview')throw new Error('Review is already open');
  if(decision.kind==='clarify')return {...state,language:decision.language==='es'?'es':decision.language==='en'?'en':state.language};
  const s=structuredClone(state);
  if(['en','es'].includes(decision.language))s.language=decision.language;
  const q=questions(s.language)[s.index];
  if(s.awaitingFollowup){
    const entry=s.entries.at(-1);
    entry.followupAnswer=decision.kind==='skip'?'':message;
    if(decision.kind==='skip')entry.followupSkipped=true;
    s.awaitingFollowup=false;s.index++;
  } else {
    const entry={...q,answer:decision.kind==='skip'?'':message,skipped:decision.kind==='skip'};
    s.entries.push(entry);
    if(decision.kind==='followup'&&typeof decision.question==='string'&&decision.question.trim()){
      entry.followupQuestion=decision.question.trim().slice(0,500);s.awaitingFollowup=true;
    } else s.index++;
  }
  if(s.index>=8)s.stage='review';
  return s;
}
export function reviewEntries(state) {
  return questions(state.language).map(q=>({...q,...state.entries.find(e=>e.id===q.id)}));
}
export function applyEdits(state,edits) {
  if(edits===undefined)return state;
  if(!Array.isArray(edits)||edits.length>8)throw new Error('Invalid reviewed answers');
  const s=structuredClone(state);const ids=new Set();
  for(const e of edits){
    if(!questions(s.language).some(q=>q.id===e.id)||ids.has(e.id))throw new Error('Invalid question');ids.add(e.id);
    if(typeof e.answer!=='string'||e.answer.length>2400||typeof(e.followupAnswer??'')!=='string'||(e.followupAnswer??'').length>2400)throw new Error('Answer too long');
    let entry=s.entries.find(x=>x.id===e.id);
    if(!entry){entry={...questions(s.language).find(q=>q.id===e.id)};s.entries.push(entry);}
    entry.answer=e.answer.trim();entry.skipped=!entry.answer;
    if(entry.followupQuestion)entry.followupAnswer=(e.followupAnswer||'').trim();
  }
  return s;
}
export function validContact(contact) {
  return typeof contact?.name==='string'&&contact.name.trim().length>0&&contact.name.length<=120&&!/[\r\n]/.test(contact.name)&&typeof contact?.email==='string'&&contact.email.length<=254&&/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(contact.email);
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function buildBoardEmail(state,contact) {
  const entries=reviewEntries(state);
  const lines=entries.map((e,i)=>`${i+1}. ${e.question}\n${e.answer||'[Skipped / not answered]'}${e.followupQuestion?`\nFollow-up: ${e.followupQuestion}\n${e.followupAnswer||'[Skipped / not answered]'}`:''}`);
  const text=`Casa de SAM board interest\nName: ${contact.name}\nEmail: ${contact.email}\nConversation language: ${state.language}\n\nThe visitor reviewed these answers and explicitly agreed to send them to Amie. Original answers; no assessment, scoring or inferred motivation. This is interest in a follow-up conversation, not an appointment.\n\n${lines.join('\n\n')}\n\nInterview reference: ${state.id}`;
  return {subject:`Casa de SAM board interest — ${contact.name}`,text,html:`<div style="font-family:Arial,sans-serif;max-width:760px;color:#244844;line-height:1.6"><h1>Casa de SAM board interest</h1><p><strong>${esc(contact.name)}</strong><br>${esc(contact.email)}</p><p>The visitor reviewed these answers and agreed to send them. No assessment or score has been assigned.</p>${entries.map((e,i)=>`<h2 style="font-size:18px">${i+1}. ${esc(e.question)}</h2><p style="white-space:pre-wrap">${esc(e.answer||'[Skipped / not answered]')}</p>${e.followupQuestion?`<p><strong>Follow-up:</strong> ${esc(e.followupQuestion)}</p><p style="white-space:pre-wrap">${esc(e.followupAnswer||'[Skipped / not answered]')}</p>`:''}`).join('')}<p>Interview reference: ${esc(state.id)}</p></div>`};
}
