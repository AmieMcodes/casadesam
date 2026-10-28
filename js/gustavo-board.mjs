const copy={en:{start:'Explore board service',skip:'Skip this question',review:'Review and finish',back:'Back to general chat',name:'Your name',email:'Your email',consent:'I agree to email Amie my contact details and the answers I reviewed here for a board-interest follow-up.',send:'Send my answers to Amie',sending:'Sending…',sent:'Your board-interest answers have been emailed to Amie for personal follow-up. This is not a board appointment. Thank you for sharing your perspective.',error:'That did not go through. Your answers are still here; please try again.',wait:'One moment…',followup:'Follow-up answer',privacy:'Edit or remove anything you do not want to share. Please leave out unnecessary private information. Empty answers will be marked as not answered.',cancel:'We’re back in the general chat. Your board-interest answers have not been sent.'},es:{start:'Conversar sobre el Consejo Directivo',skip:'Omitir esta pregunta',review:'Revisar y terminar',back:'Volver a la charla general',name:'Tu nombre',email:'Tu correo electrónico',consent:'Acepto que se envíen a Amie mis datos de contacto y las respuestas que revisé acá para conversar sobre mi interés en el Consejo Directivo.',send:'Enviar mis respuestas a Amie',sending:'Enviando…',sent:'Tus respuestas sobre el Consejo Directivo se enviaron por correo a Amie para que ella se comunique con vos. Esto no es un nombramiento. Gracias por compartir tu perspectiva.',error:'No se pudo confirmar el envío. Tus respuestas siguen acá; podés volver a intentar.',wait:'Un momento…',followup:'Respuesta a la pregunta de seguimiento',privacy:'Podés editar o borrar lo que no quieras compartir. Dejá afuera información privada innecesaria. Las respuestas vacías quedan como no respondidas.',cancel:'Volvimos a la charla general. No se enviaron tus respuestas sobre el Consejo Directivo.'}};
function el(tag,text,className){const n=document.createElement(tag);if(text)n.textContent=text;if(className)n.className=className;return n;}
export function mountBoardConversation({root,messages,input,chatForm,addMessage}){
  let active=false,busy=false,token=null,language='en';
  const invite=el('div',null,'gustavo-board-invite');invite.hidden=true;
  const begin=el('button',copy.en.start);begin.type='button';invite.append(begin);
  const controls=el('div',null,'gustavo-board-controls');controls.hidden=true;
  const skip=el('button'),review=el('button'),back=el('button');
  for(const b of [skip,review,back]){b.type='button';controls.append(b);}
  chatForm.after(invite,controls);
  function labels(){const c=copy[language];begin.textContent=c.start;skip.textContent=c.skip;review.textContent=c.review;back.textContent=c.back;}
  function lock(value){busy=value;for(const b of [begin,skip,review,back,chatForm.querySelector('button')])b.disabled=value;}
  async function request(action,extra={}){
    const r=await fetch('/api/gustavo-board',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,state:token,...extra})});
    const data=await r.json();if(!r.ok)throw new Error(data.error||copy[language].error);return data;
  }
  function accept(data,waiting){token=data.state||token;language=data.language||language;labels();waiting.textContent=data.answer||'';if(data.stage==='review')showReview(data.review);messages.scrollTop=messages.scrollHeight;}
  function exit(){active=false;token=null;controls.hidden=true;invite.hidden=true;chatForm.hidden=false;input.value='';}
  function field(label,type,value=''){
    const wrap=el('label',label);const n=el(type==='textarea'?'textarea':'input');
    if(type!=='textarea')n.type=type;else {n.rows=3;n.maxLength=2400;}
    n.value=value;wrap.append(n);return{wrap,input:n};
  }
  function showReview(entries){
    controls.hidden=true;chatForm.hidden=true;
    const form=el('form',null,'gustavo-board-review');
    form.append(el('p',copy[language].privacy));
    const editors=entries.map((entry,i)=>{
      const group=el('fieldset');group.append(el('legend',`${i+1}. ${entry.question}`));
      const main=field(language==='es'?'Tu respuesta':'Your answer','textarea',entry.answer||'');group.append(main.wrap);
      let follow;
      if(entry.followupQuestion){group.append(el('p',entry.followupQuestion));follow=field(copy[language].followup,'textarea',entry.followupAnswer||'');group.append(follow.wrap);}
      form.append(group);return{id:entry.id,main:main.input,follow:follow?.input};
    });
    const name=field(copy[language].name,'text');name.input.required=true;name.input.maxLength=120;name.input.autocomplete='name';
    const email=field(copy[language].email,'email');email.input.required=true;email.input.maxLength=254;email.input.autocomplete='email';
    const consent=el('label',null,'gustavo-board-consent');const check=el('input');check.type='checkbox';check.required=true;consent.append(check,document.createTextNode(copy[language].consent));
    const honey=field('Website','text');honey.wrap.hidden=true;honey.input.tabIndex=-1;honey.input.autocomplete='off';
    const submit=el('button',copy[language].send);submit.type='submit';
    const cancel=el('button',copy[language].back);cancel.type='button';cancel.addEventListener('click',()=>{form.remove();exit();addMessage(copy[language].cancel,'answer');});
    const status=el('p');status.setAttribute('role','status');
    form.append(name.wrap,email.wrap,honey.wrap,consent,submit,cancel,status);messages.append(form);
    form.addEventListener('submit',async event=>{
      event.preventDefault();if(busy||!form.reportValidity())return;
      lock(true);submit.disabled=true;cancel.disabled=true;status.textContent=copy[language].sending;
      try{
        const data=await request('submit',{contact:{name:name.input.value.trim(),email:email.input.value.trim()},consent:check.checked,website:honey.input.value,edits:editors.map(e=>({id:e.id,answer:e.main.value,followupAnswer:e.follow?.value||''}))});
        if(data.sent!==true)throw new Error(copy[language].error);
        form.remove();exit();addMessage(copy[language].sent,'answer');
      }catch(error){status.textContent=error.message||copy[language].error;}
      finally{lock(false);submit.disabled=false;cancel.disabled=false;}
    });
  }
  async function turn(action,message=''){
    if(busy)return;lock(true);
    if(message)addMessage(message,'question');input.value='';
    const waiting=addMessage(copy[language].wait,'answer');
    try{accept(await request(action,{message}),waiting);}catch(error){waiting.textContent=error.message||copy[language].error;input.value=message;}
    finally{lock(false);if(!chatForm.hidden)input.focus();}
  }
  begin.addEventListener('click',async()=>{
    if(busy)return;lock(true);invite.hidden=true;
    const waiting=addMessage(copy[language].wait,'answer');
    try{const data=await request('start',{language});active=true;controls.hidden=false;root.querySelector('.gustavo-handoff').hidden=true;accept(data,waiting);}
    catch(error){waiting.textContent=error.message||copy[language].error;invite.hidden=false;}
    finally{lock(false);input.focus();}
  });
  skip.addEventListener('click',()=>turn('skip'));
  review.addEventListener('click',()=>turn('review',input.value.trim()));
  back.addEventListener('click',()=>{if(busy)return;exit();addMessage(copy[language].cancel,'answer');});
  return {get active(){return active;},handleMessage:message=>turn('answer',message),offer(lang='en'){if(active)return;language=lang==='es'?'es':'en';labels();invite.hidden=false;}};
}
