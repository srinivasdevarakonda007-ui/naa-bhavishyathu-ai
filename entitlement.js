let entitlementState={freeAvailable:true,credits:0,pricePerPortrait:20};
let lastSuccessfulResult=null;

function paymentBox(){return document.querySelector("#paymentBox")}
function setEntitlementState(next){
  entitlementState={...entitlementState,...next};
  const box=paymentBox(), text=document.querySelector("#paymentText"), title=document.querySelector("#paymentTitle");
  if(title) title.textContent=entitlementState.credits>0?"AI Portrait Credit Ready":"మరిన్ని AI Portraits";
  if(text){
    if(entitlementState.freeAvailable) text.textContent="మీ మొదటి AI Portrait FREE. Successful generation తర్వాత మాత్రమే free chance ఉపయోగించినట్లవుతుంది.";
    else if(entitlementState.credits>0) text.textContent=`మీ వద్ద ${entitlementState.credits} paid portrait credit${entitlementState.credits===1?"":"s"} ఉంది. Successful generation తర్వాత మాత్రమే 1 credit తగ్గుతుంది.`;
    else text.textContent="First free portrait ఉపయోగించారు. ప్రతి ₹20 paymentకి 1 extra AI Portrait credit లభిస్తుంది.";
  }
  if(box) box.hidden=entitlementState.freeAvailable||entitlementState.credits>0;
}
async function refreshEntitlement(){
  try{
    const r=await fetch("/api/status",{cache:"no-store",credentials:"same-origin"});
    const d=await r.json();
    if(r.ok) setEntitlementState(d);
  }catch{}
}

function markResultPending(){
  const poster=document.querySelector("#poster"),actions=document.querySelector("#actions");
  if(actions) actions.hidden=true;
  if(poster) poster.style.opacity=".72";
}
function markResultReady(){
  const poster=document.querySelector("#poster"),actions=document.querySelector("#actions");
  if(actions) actions.hidden=false;
  if(poster) poster.style.opacity="1";
}
function restoreLastSuccessful(){
  const poster=document.querySelector("#poster"),role=document.querySelector("#role"),story=document.querySelector("#story");
  if(poster) poster.style.opacity="1";
  if(lastSuccessfulResult){
    let img=poster?.querySelector("img");
    if(!img&&poster){img=document.createElement("img");poster.prepend(img)}
    if(img) img.src=lastSuccessfulResult.image;
    if(role) role.textContent=lastSuccessfulResult.role;
    if(story) story.textContent=lastSuccessfulResult.story;
    document.querySelector("#actions").hidden=false;
  }
}

document.querySelector("#jobs")?.addEventListener("click",e=>{
  if(e.target.closest(".job") && document.querySelector("#poster img")) markResultPending();
});

function generationErrorMessage(e){
  const en=uiLang==="en";
  const code=e?.code||"";
  const raw=String(e?.message||"");
  if(code==="PAYMENT_REQUIRED") return en?"Payment is required for the next portrait.":"తదుపరి AI Portrait కోసం ₹20 payment అవసరం.";
  if(code==="GENERATION_IN_PROGRESS") return en?"A portrait is already being generated. Please wait.":"ఒక portrait ఇప్పటికే తయారవుతోంది. అది పూర్తయ్యే వరకు వేచి ఉండండి.";
  if(code==="RATE_LIMIT") return en?"Generation limit reached. Please try again later.":"Generation limit చేరుకుంది. కొంతసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.";
  if(code==="API_KEY_MISSING"||code==="API_AUTH") return en?"AI server connection is not configured correctly. Please contact the site owner.":"AI server connection configurationలో సమస్య ఉంది. Site owner settings check చేయాలి.";
  if(code==="API_QUOTA") return en?"AI API quota/billing limit has been reached. No credit was consumed.":"AI API quota/billing limit చేరుకుంది. మీ free chance/paid credit తగ్గలేదు.";
  if(code==="MODEL_ERROR") return en?"AI image model configuration needs an update. No credit was consumed.":"AI image model configuration update అవసరం. మీ free chance/paid credit తగ్గలేదు.";
  if(code==="IMAGE_INPUT_ERROR"||code==="UPLOAD_ERROR"||code==="IMAGE_TOO_LARGE") return en?(raw||"Please try another clear image under 8 MB."):(raw||"మరో clear photoతో ప్రయత్నించండి. Photo 8 MB లోపు ఉండాలి.");
  if(/safety|rejected|policy/i.test(raw)) return en?"This photo could not be processed by the AI safety check. Please try another clear front-facing photo.":"ఈ ఫోటో AI safety checkలో process కాలేదు. మరో clear front-facing photoతో ప్రయత్నించండి.";
  if(code==="AI_BUSY") return en?"AI service is temporarily busy. No credit was consumed. Please try again.":"AI service ప్రస్తుతం busyగా ఉంది. మీ free chance/paid credit తగ్గలేదు. మరోసారి ప్రయత్నించండి.";
  return en?`Generation failed: ${raw||"Unknown error"}. No credit was consumed.`:`Generation failed: ${raw||"Unknown error"}. మీ free chance/paid credit తగ్గలేదు.`;
}

async function secureGenerate(){
  await refreshEntitlement();
  if(!entitlementState.freeAvailable && entitlementState.credits<1){
    const box=paymentBox(); if(box){box.hidden=false;box.scrollIntoView({behavior:"smooth"});}
    return alert(uiLang==="en"?"Your first portrait has been used. Pay ₹20 to unlock one extra portrait.":"మీ మొదటి AI Portrait ఉపయోగించారు. మరో portrait కోసం ₹20 secure payment చేయండి.");
  }
  const file=document.querySelector("#photo").files[0];
  if(!file)return alert(uiLang==="en"?"Please upload your photo first.":"ముందుగా మీ ఫోటో upload చేయండి.");
  if(!selected)return alert(uiLang==="en"?"Please choose a profession.":"ఒక profession ఎంచుకోండి.");
  const personName=document.querySelector("#personName").value.trim();
  if(!personName)return alert(uiLang==="en"?"Please enter your name.":"మీ పేరు నమోదు చేయండి.");

  const btn=document.querySelector("#generate"),old=btn.textContent;
  btn.disabled=true;btn.textContent=uiLang==="en"?"Creating your AI portrait…":"AI మీ భవిష్యత్తు తయారవుతోంది…";
  markResultPending();
  try{
    const fd=new FormData();
    fd.append("image",file);fd.append("profession",selected);
    fd.append("country",document.querySelector("#country").value);
    fd.append("state",document.querySelector("#state").value);

    const imagePromise=fetch("/api/generate",{method:"POST",body:fd,credentials:"same-origin"}).then(async r=>{
      const d=await r.json().catch(()=>({}));
      if(!r.ok){const err=new Error(d.error||"Portrait generation failed");err.code=d.code;err.status=r.status;err.data=d;throw err}
      return d;
    });
    const storyPromise=fetch("/api/story",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:personName,profession:selected,country:document.querySelector("#country").value,state:document.querySelector("#state").value})}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Story generation failed");return d;});

    const [imageResult,storyResult]=await Promise.allSettled([imagePromise,storyPromise]);
    if(imageResult.status!=="fulfilled"){
      const e=imageResult.reason||{};
      if(e.data) setEntitlementState(e.data);
      restoreLastSuccessful();
      if(e.code==="PAYMENT_REQUIRED"){
        const box=paymentBox(); if(box){box.hidden=false;box.scrollIntoView({behavior:"smooth"});}
      }
      return alert(generationErrorMessage(e));
    }

    const imageData=imageResult.value;
    setEntitlementState(imageData);
    let img=document.querySelector("#poster img");
    if(!img){img=document.createElement("img");document.querySelector("#poster").prepend(img)}
    img.src=imageData.image;
    const story=storyResult.status==="fulfilled"?storyResult.value.story:(uiLang==="en"?"Your dream career portrait is ready.":"మీ Dream Career Portrait సిద్ధంగా ఉంది.");
    const role=personName+" — "+selected;
    document.querySelector("#role").textContent=role;
    document.querySelector("#story").textContent=story;
    lastSuccessfulResult={image:imageData.image,role,story};
    markResultReady();
    if(!entitlementState.freeAvailable&&entitlementState.credits<1) paymentBox().hidden=false;
    document.querySelector("#poster").scrollIntoView({behavior:"smooth"});
  }catch(e){
    restoreLastSuccessful();
    alert(generationErrorMessage(e));
  }finally{
    btn.disabled=false;btn.textContent=old;
  }
}

const generateBtn=document.querySelector("#generate");
if(generateBtn) generateBtn.onclick=secureGenerate;

(function replacePaymentButton(){
  const oldBtn=document.querySelector("#payBtn");
  if(!oldBtn)return;
  const btn=oldBtn.cloneNode(true);
  oldBtn.replaceWith(btn);
  btn.addEventListener("click",async()=>{
    const approvedHost="naa-bhavishyathu-ai.vercel.app";
    if(location.hostname!==approvedHost){location.href="https://"+approvedHost+"/";return;}
    if(btn.dataset.processing==="1")return;
    btn.dataset.processing="1";btn.disabled=true;const original=btn.textContent;btn.textContent="Payment opening…";
    try{
      const r=await fetch("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}",credentials:"same-origin"});
      const o=await r.json();if(!r.ok)throw new Error(o.error||"Payment unavailable");
      if(!window.Razorpay)throw new Error("Checkout unavailable");
      new Razorpay({key:o.key,amount:o.amount,currency:o.currency,name:"Naa Bhavishyathu AI",description:"1 Extra AI Portrait Credit",order_id:o.orderId,
        handler:async p=>{
          const vr=await fetch("/api/verify-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p),credentials:"same-origin"});
          const v=await vr.json();
          if(vr.ok&&v.verified){
            setEntitlementState(v);
            paymentBox().hidden=true;
            alert(uiLang==="en"?`Payment successful ✅ ${v.credits} portrait credit available.`:`Payment successful ✅ మీ వద్ద ${v.credits} AI Portrait credit ఉంది.`);
            document.querySelector("#generate").scrollIntoView({behavior:"smooth"});
          }else alert(v.error||"Payment verification failed.");
        },theme:{color:"#6d28d9"}
      }).open();
    }catch(e){alert(e.message||"Payment service unavailable.");}
    finally{btn.dataset.processing="0";btn.disabled=false;btn.textContent=original;}
  });
})();

refreshEntitlement();
