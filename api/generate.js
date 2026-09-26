import {readEntitlement,writeEntitlement,publicEntitlement} from "./_entitlement.js";
export const config = { api: { bodyParser: false } };

const APPROVED_HOST="naa-bhavishyathu-ai.vercel.app";
const prompts = {
  "IAS Officer":"Transform the person into a dignified fictional Indian civil-service leadership career portrait in elegant formal attire, premium government-office-inspired setting, no official emblem, no ID card, no credential claim. Preserve identity and natural facial features.",
  "Police Officer":"Transform the person into a dignified fictional professional police-officer career portrait. Generic clean uniform, no real department insignia, no official ID, no document. Preserve the person's identity, facial structure, skin tone, hairstyle and age as closely as possible.",
  "Lawyer":"Transform the person into a premium professional lawyer portrait in formal black advocate attire, elegant legal-office background. Preserve identity and natural facial features.",
  "Sports Teacher":"Transform the person into a confident professional physical education teacher portrait on a modern school sports ground, premium sportswear, whistle, tasteful athletic atmosphere. Preserve identity.",
  "Athlete":"Transform the person into an elite inspirational athlete portrait in a stadium, premium sports kit, dynamic but realistic. Preserve identity.",
  "Doctor":"Transform the person into a professional doctor career portrait with clean white coat and modern clinic background, no ID card or credential claims. Preserve identity.",
  "Teacher":"Transform the person into a warm professional teacher portrait in a modern classroom. Preserve identity.",
  "Scientist":"Transform the person into a professional scientist portrait in a modern research laboratory. Preserve identity.",
  "Pilot":"Transform the person into a fictional commercial pilot career portrait in a premium aviation setting, generic uniform with no real airline insignia. Preserve identity.",
  "Army Officer":"Transform the person into a fictional inspirational military career portrait, generic ceremonial uniform with no real unit insignia, no official credential. Preserve identity.",
  "Chef":"Transform the person into a premium professional chef portrait in a modern restaurant kitchen. Preserve identity.",
  "Entrepreneur":"Transform the person into a successful modern entrepreneur portrait in an elegant office. Preserve identity.",
  "Engineer":"Transform the person into a professional engineer portrait in a modern technology workspace. Preserve identity.",
  "Public Representative":"Transform the person into a neutral, fictional public-leadership portrait in a civic community setting, wearing dignified formal Indian attire. No political party logo, flag, election symbol, campaign slogan, ballot material or endorsement claim. Preserve identity and natural facial features.",
  "Navy Officer":"Transform the person into a fictional inspirational naval-officer career portrait in a clean maritime setting, generic ceremonial naval-style uniform with no real insignia, unit marks, official badge or credential. Preserve identity.",
  "Air Force Officer":"Transform the person into a fictional inspirational air-force career portrait near a modern aviation setting, generic formal uniform with no real insignia, squadron marks, official badge or credential. Preserve identity.",
  "Nurse":"Transform the person into a compassionate professional nurse career portrait in a modern hospital environment, clean professional attire, no ID or credential claims. Preserve identity.",
  "Pharmacist":"Transform the person into a professional pharmacist career portrait in a modern pharmacy or pharmaceutical workspace, clean professional attire. Preserve identity.",
  "Software Developer":"Transform the person into a modern professional software developer portrait in a premium technology workspace with tasteful computer screens and coding atmosphere. Preserve identity.",
  "Civil Engineer":"Transform the person into a professional civil engineer portrait at a safe modern infrastructure or construction-planning setting, wearing appropriate professional attire and safety gear. Preserve identity.",
  "Chartered Accountant":"Transform the person into a premium professional chartered-accountancy career portrait in an elegant finance office, formal attire, no credential claims. Preserve identity.",
  "Banker":"Transform the person into a premium professional banker portrait in a modern financial-office environment, formal attire, no real bank logos. Preserve identity.",
  "Journalist":"Transform the person into a professional journalist career portrait in a modern newsroom or field-reporting setting, generic microphone with no real media logo. Preserve identity.",
  "Farmer / Agri Entrepreneur":"Transform the person into an inspiring modern farmer and agri-entrepreneur portrait in a productive agricultural setting using modern farming technology. Preserve identity.",
  "Forest Officer":"Transform the person into a fictional professional forest-officer career portrait in a natural forest setting, generic field uniform with no real department insignia or official credential. Preserve identity.",
  "Fire & Rescue Officer":"Transform the person into a fictional professional fire-and-rescue career portrait in a safe training or station setting, generic protective uniform with no real department insignia. Preserve identity.",
  "Social Worker":"Transform the person into an inspiring professional social-worker portrait in a community-development setting, warm and dignified. Preserve identity.",
  "Artist / Designer":"Transform the person into a creative professional artist or designer portrait in a premium studio workspace with tasteful creative tools. Preserve identity.",
  "Content Creator":"Transform the person into a professional digital content creator portrait in a modern studio with camera, microphone and editing workspace, no platform logos. Preserve identity."
};

const rateBuckets = globalThis.__nbaiRateBuckets || (globalThis.__nbaiRateBuckets = new Map());
const activeGenerations = globalThis.__nbaiActiveGenerations || (globalThis.__nbaiActiveGenerations = new Set());
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 15;
function validHost(req){return String(req.headers["x-forwarded-host"]||req.headers.host||"").split(",")[0].trim()===APPROVED_HOST;}
function checkLimit(sessionId){
  const now=Date.now(), bucket=rateBuckets.get(sessionId);
  if(!bucket || now-bucket.start>=RATE_WINDOW_MS) return {ok:true};
  if(bucket.count>=RATE_MAX) return {ok:false,retryAfter:Math.max(1,Math.ceil((RATE_WINDOW_MS-(now-bucket.start))/60000))};
  return {ok:true};
}
function recordSuccess(sessionId){
  const now=Date.now(), bucket=rateBuckets.get(sessionId);
  if(!bucket || now-bucket.start>=RATE_WINDOW_MS) rateBuckets.set(sessionId,{start:now,count:1});
  else bucket.count++;
}
function buildImageForm(image,profession,country,state){
  const form=new FormData();
  form.append("model","gpt-image-2");
  form.append("prompt",prompts[profession]+" Location context: "+country+(country==="India"?", "+state:"")+". Photorealistic premium studio quality, natural skin texture, realistic proportions, vertical portrait composition. Do not add text to the image.");
  form.append("size","1024x1536");
  form.append("quality","medium");
  form.append("image",new Blob([image.data],{type:image.type}),image.filename);
  return form;
}
async function callImageApi(image,profession,country,state){
  let lastResponse=null,lastData=null;
  for(let attempt=0;attempt<2;attempt++){
    const r=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:"Bearer "+process.env.OPENAI_API_KEY},body:buildImageForm(image,profession,country,state)});
    const data=await r.json().catch(()=>({}));
    lastResponse=r; lastData=data;
    if(r.ok) return {r,data};
    if(attempt===0 && (r.status===429 || r.status>=500)){
      await new Promise(resolve=>setTimeout(resolve,900));
      continue;
    }
    break;
  }
  return {r:lastResponse,data:lastData};
}
function apiErrorCode(status,message){
  const m=String(message||"").toLowerCase();
  if(status===401||status===403) return "API_AUTH";
  if(status===429 && /quota|billing|credit|limit/.test(m)) return "API_QUOTA";
  if(status===429) return "AI_BUSY";
  if(status===400 && /model/.test(m)) return "MODEL_ERROR";
  if(status===400 && /image|format|size|input/.test(m)) return "IMAGE_INPUT_ERROR";
  if(status>=500) return "AI_BUSY";
  return "AI_ERROR";
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  if(!validHost(req)) return res.status(403).json({error:"AI Portrait generation is available only on the official Naa Bhavishyathu AI website.",code:"INVALID_HOST"});
  if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"Server API key is not configured.",code:"API_KEY_MISSING"});

  const state=readEntitlement(req);
  const useFree=!state.freeUsed;
  const usePaid=!useFree && state.credits>0;
  if(!useFree&&!usePaid){
    writeEntitlement(res,state);
    return res.status(402).json({error:"Your free portrait has been used. Pay ₹20 to unlock one extra portrait.",code:"PAYMENT_REQUIRED",...publicEntitlement(state)});
  }
  const limit=checkLimit(state.sid);
  if(!limit.ok) return res.status(429).json({error:"Generation limit reached for this session. Please try again later.",code:"RATE_LIMIT",retryAfterMinutes:limit.retryAfter});
  if(activeGenerations.has(state.sid)) return res.status(409).json({error:"A portrait is already being generated. Please wait for it to finish.",code:"GENERATION_IN_PROGRESS"});

  activeGenerations.add(state.sid);
  try{
    const chunks=[]; for await(const chunk of req) chunks.push(chunk);
    const raw=Buffer.concat(chunks);
    const ct=req.headers["content-type"]||"";
    const boundary=ct.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.slice(1).find(Boolean);
    if(!boundary) return res.status(400).json({error:"Invalid upload.",code:"UPLOAD_ERROR"});
    const bin=raw.toString("binary");
    const parts=bin.split("--"+boundary);
    let image=null, profession="", country="India", stateName="Andhra Pradesh";
    for(const part of parts){
      const split=part.indexOf("\r\n\r\n"); if(split<0) continue;
      const head=part.slice(0,split), body=part.slice(split+4,-2);
      const name=head.match(/name="([^"]+)"/)?.[1];
      if(name==="profession") profession=Buffer.from(body,"binary").toString("utf8");
      if(name==="country") country=Buffer.from(body,"binary").toString("utf8");
      if(name==="state") stateName=Buffer.from(body,"binary").toString("utf8");
      if(name==="image"){
        const filename=head.match(/filename="([^"]*)"/)?.[1]||"portrait.jpg";
        const type=head.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]||"image/jpeg";
        image={filename,type,data:Buffer.from(body,"binary")};
      }
    }
    if(!image||!profession) return res.status(400).json({error:"Photo and profession are required.",code:"UPLOAD_ERROR"});
    if(!prompts[profession]) return res.status(400).json({error:"Please choose a supported profession.",code:"UNSUPPORTED_PROFESSION"});
    if(image.data.length>8*1024*1024) return res.status(413).json({error:"Photo is too large. Please use an image under 8 MB.",code:"IMAGE_TOO_LARGE"});

    const {r,data}=await callImageApi(image,profession,country,stateName);
    if(!r?.ok){
      const message=data?.error?.message||"AI generation failed.";
      return res.status(r?.status||502).json({error:message,code:apiErrorCode(r?.status||502,message),...publicEntitlement(state)});
    }
    const b64=data?.data?.[0]?.b64_json;
    if(!b64) return res.status(502).json({error:"No image returned.",code:"NO_IMAGE",...publicEntitlement(state)});

    if(useFree) state.freeUsed=true;
    else state.credits=Math.max(0,state.credits-1);
    recordSuccess(state.sid);
    writeEntitlement(res,state);
    return res.status(200).json({image:"data:image/png;base64,"+b64,usedFree:useFree,usedPaid:usePaid,...publicEntitlement(state)});
  }catch(e){
    return res.status(500).json({error:e?.message||"Unexpected server error.",code:"SERVER_ERROR",...publicEntitlement(state)});
  }finally{
    activeGenerations.delete(state.sid);
  }
}
