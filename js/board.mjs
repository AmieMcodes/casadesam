const messages={
  en:{sending:'Sending your details to Amie…',sent:'Thank you. Your interest has been emailed to Amie for personal follow-up. This is not a board appointment or a commitment to join.',error:'We could not confirm sending. Your details are still here. Use Retry to send the same details safely; please do not refresh or start a new submission. You can also contact hello@casadesam.org if you need help.',startError:'The form is not available just now. Your details are still here; please try again or email hello@casadesam.org.',retry:'Retry sending the same details',send:'Send my interest to Amie',done:'Sent to Amie',validation:'Please check your name, complete email address, country, and interest. Fields cannot contain only spaces. Nothing was sent; you can edit your details and try again.',expired:'This submission could not be resumed. Please contact hello@casadesam.org to check whether it arrived before sending again.'},
  es:{sending:'Enviando tus datos a Amie…',sent:'Gracias. Tu interés se envió por correo a Amie para que pueda conversar personalmente con vos. Esto no es un nombramiento ni un compromiso de integrar el consejo.',error:'No pudimos confirmar el envío. Tus datos siguen acá. Usá «Reintentar» para enviar los mismos datos de forma segura; por favor, no actualices la página ni empieces un envío nuevo. Si necesitás ayuda, podés escribir a hello@casadesam.org.',startError:'El formulario no está disponible ahora. Tus datos siguen acá; podés volver a intentar o escribir a hello@casadesam.org.',retry:'Reintentar el envío de los mismos datos',send:'Enviar mi interés a Amie',done:'Enviado a Amie',validation:'Revisá tu nombre, correo completo, país e interés. Los campos no pueden contener solo espacios. No se envió nada; podés corregir tus datos y volver a intentar.',expired:'No pudimos retomar este envío. Escribí a hello@casadesam.org para confirmar si llegó antes de enviarlo otra vez.'}
};

// The form never reads Gustavo's messages or conversation history.
export function createContactSender(fetcher=globalThis.fetch){
  let token=null,busy=false,sent=false,pending=null;
  async function request(body){
    const response=await fetcher('/api/gustavo-board',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(25000),body:JSON.stringify(body)});
    const data=await response.json();
    if(!response.ok){const error=new Error(data.error||'Unable to send');error.code=data.code;throw error;}
    return data;
  }
  return {
    get pending(){return pending!==null;},
    get sent(){return sent;},
    async submit({contact,consent,website=''}){
      if(busy)throw new Error('A submission is in progress');
      if(sent)throw new Error('Your details were already sent');
      if(consent!==true)throw new Error('Explicit consent is required');
      busy=true;
      try{
        const safeContact=Object.fromEntries(['name','email','country','preferredLanguage','interest'].map(key=>[key,String(contact?.[key]??'').trim()]));
        if(!token){const data=await request({action:'start-contact',language:safeContact.preferredLanguage});if(typeof data.state!=='string'||!data.state)throw new Error('Missing form state');token=data.state;}
        // Keep an identical payload after ambiguous transport failures: the server
        // can safely retry its idempotent email, without changing consented content.
        if(!pending)pending={action:'submit-contact',state:token,contact:safeContact,consent:true,website};
        const data=await request(pending);
        if(data.sent!==true)throw new Error('Sending was not confirmed');
        sent=true;pending=null;token=null;
        return data;
      } catch(error) {
        // VALIDATION is a definitive rejection before email delivery.
        if(error.code==='VALIDATION')pending=null;
        throw error;
      } finally {busy=false;}
    }
  };
}

export function mountBoardPage(doc=document,win=window){
  const form=doc.querySelector('#board-interest-form');
  if(!form)return;
  const fields=doc.querySelector('#board-form-fields');
  const submit=doc.querySelector('#board-submit');
  const status=doc.querySelector('#board-form-status');
  const sender=createContactSender();
  let language='en',statusKey='',inFlight=false;
  function paintStatus(){
    status.textContent=statusKey?messages[language][statusKey]:'';
    submit.textContent=messages[language][sender.sent?'done':sender.pending?'retry':'send'];
  }
  function setLanguage(lang){
    language=lang==='es'?'es':'en';doc.documentElement.lang=language;
    for(const element of doc.querySelectorAll('[data-en][data-es]'))element.textContent=element.dataset[language];
    for(const button of doc.querySelectorAll('[data-board-language]'))button.setAttribute('aria-pressed',String(button.dataset.boardLanguage===language));
    if(!fields.disabled)form.elements.namedItem('preferredLanguage').value=language;
    doc.title=language==='es'?'Interés en el consejo fundador — Casa de SAM':'Founding board interest — Casa de SAM';
    paintStatus();win.dispatchEvent(new CustomEvent('casa:languagechange',{detail:{language}}));
  }
  for(const button of doc.querySelectorAll('[data-board-language]'))button.addEventListener('click',()=>setLanguage(button.dataset.boardLanguage));
  const initial=new URL(win.location.href).searchParams.get('lang');
  setLanguage(initial==='es'?'es':'en');
  submit.disabled=false;
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(inFlight||sender.sent||statusKey==='expired')return;
    if(!sender.pending&&!form.reportValidity())return;
    const contact=Object.fromEntries(['name','email','country','preferredLanguage','interest'].map(key=>[key,form.elements.namedItem(key).value.trim()]));
    const consent=form.elements.namedItem('consent').checked;
    const website=form.elements.namedItem('website').value;
    inFlight=true;fields.disabled=true;submit.disabled=true;statusKey='sending';status.dataset.error='false';paintStatus();
    try{
      await sender.submit({contact,consent,website});
      statusKey='sent';form.reset();
    }catch(error){statusKey=error.code==='VALIDATION'?'validation':sender.pending?(['STATE_INVALID','SUBMISSION_CONFLICT'].includes(error.code)?'expired':'error'):'startError';status.dataset.error='true';}
    finally{
      inFlight=false;fields.disabled=sender.pending||sender.sent;submit.disabled=sender.sent||statusKey==='expired';paintStatus();status.focus();
    }
  });
}
if(typeof document!=='undefined')mountBoardPage();
