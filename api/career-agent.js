const N8N_WEBHOOK="https://pavansai2013.app.n8n.cloud/webhook/naa-bhavishyathu-ai";

function cleanAnswer(value){
  return String(value||"")
    .replace(/#{1,6}\s*/g,"")
    .replace(/\*\*/g,"")
    .replace(/__+/g,"")
    .replace(/`+/g,"")
    .replace(/^(User|Assistant|AI)\s*[:：-]\s*/gim,"")
    .replace(/^(Likely Strengths|Curiosity|Observation|Career Paths)\s*[:：-]?\s*/gim,"")
    .trim();
}

function extractAnswer(data){
  if(data==null) return "";
  if(typeof data==="string") return cleanAnswer(data);
  if(Array.isArray(data)){
    for(const item of data){const a=extractAnswer(item);if(a)return a;}
    return "";
  }
  if(typeof data.output_text==="string"&&data.output_text.trim()) return cleanAnswer(data.output_text);
  if(Array.isArray(data.output)){
    for(const item of data.output){
      if(Array.isArray(item?.content)){
        for(const part of item.content){
          if(typeof part?.text==="string"&&part.text.trim()) return cleanAnswer(part.text);
        }
      }
    }
  }
  const candidates=[
    data.output,data.answer,data.text,data.message,data.response,data.content,
    data.result,data.reply,data.data?.output,data.data?.answer,data.data?.text,
    data.json?.output,data.json?.answer,data.json?.text
  ];
  for(const value of candidates){
    if(typeof value==="string"&&value.trim()) return cleanAnswer(value);
    if(value&&typeof value==="object"){
      const nested=extractAnswer(value);if(nested)return nested;
    }
  }
  return "";
}

function buildInstruction({profession,q,language,country,state}){
  const english=language==="en";
  return english
   ?`You are the Naa Bhavishyathu AI Career Agent. Selected profession: ${profession}. User question: ${q}. User location context: ${country}${state?", "+state:""}. Answer the exact question directly in clear, simple English. Stay focused on the selected profession. Use short sections or up to 5 concise points only when useful: Education, Skills, Courses, Career Path, Next Step. Do not invent marks, age, qualifications, strengths or achievements. Avoid personality analysis and generic filler. Keep it around 120 words. If eligibility, fees, dates or rules may change, say to verify the latest official notification.`
   :`నీవు Naa Bhavishyathu AI Career Agent. ఎంపిక చేసిన వృత్తి: ${profession}. యూజర్ అడిగిన అసలు ప్రశ్న: ${q}. ప్రాంతం: ${country}${state?", "+state:""}. ఆ ప్రశ్నకే నేరుగా, సహజమైన, సులభమైన తెలుగులో సమాధానం ఇవ్వాలి. ఎంపిక చేసిన వృత్తి గురించే ఉండాలి. అవసరమైనప్పుడు మాత్రమే చదువు, Skills, Courses, Career Path, Next Step అనే చిన్న విభాగాలు లేదా గరిష్టంగా 5 చిన్న points వాడాలి. యూజర్ చెప్పని marks, age, qualifications, strengths లేదా achievements ఊహించకూడదు. అనవసర personality analysis లేదా generic filler వద్దు. English technical course/exam names అవసరమైనప్పుడు మాత్రమే వాడాలి. సుమారు 120 పదాల్లో ఉంచాలి. eligibility, fees, dates లేదా rules మారే అంశమైతే latest official notification verify చేయాలని చివరలో చెప్పాలి.`;
}

async function askOpenAI(instruction){
  if(!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY_MISSING");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try{
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "Authorization":"Bearer "+process.env.OPENAI_API_KEY,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        model:"gpt-4.1-mini",
        input:[{role:"user",content:instruction}],
        max_output_tokens:450
      }),
      signal:controller.signal
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok){
      const msg=data?.error?.message||"OpenAI Career Agent request failed.";
      const err=new Error(msg);err.status=r.status;throw err;
    }
    const answer=extractAnswer(data);
    if(!answer) throw new Error("OpenAI returned no answer.");
    return answer;
  }finally{clearTimeout(timeout);}
}

async function askN8N(payload){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  try{
    const r=await fetch(N8N_WEBHOOK,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload),
      signal:controller.signal
    });
    const text=await r.text();
    let data;try{data=JSON.parse(text)}catch{data=text}
    if(!r.ok) throw new Error(extractAnswer(data)||"Career Agent fallback failed.");
    const answer=extractAnswer(data);
    if(!answer) throw new Error("Career Agent fallback returned no answer.");
    return answer;
  }finally{clearTimeout(timeout);}
}

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  try{
    const {name="",profession="",question="",country="India",state="",language="te"}=req.body||{};
    const q=String(question||"").trim();
    if(!profession||!q)return res.status(400).json({error:"Profession and question are required."});
    const instruction=buildInstruction({profession,q,language,country,state});

    let answer="";
    try{
      answer=await askOpenAI(instruction);
    }catch(primaryError){
      const payload={
        mode:"career_agent",
        source:"naa-bhavishyathu-ai",
        name:name||"User",
        profession,
        question:q,
        chatInput:instruction,
        prompt:instruction,
        input:instruction,
        userMessage:q,
        message:q,
        language:language==="en"?"English":"Telugu",
        response_language:language==="en"?"en-IN":"te-IN",
        country,
        state
      };
      try{
        answer=await askN8N(payload);
      }catch(fallbackError){
        const msg=primaryError?.message||fallbackError?.message||"Career Agent unavailable.";
        return res.status(primaryError?.status||502).json({error:msg,code:"CAREER_AGENT_UNAVAILABLE"});
      }
    }

    if(answer.length>1600)answer=answer.slice(0,1600).replace(/\s+\S*$/,"")+"…";
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({answer});
  }catch(e){
    const timedOut=e?.name==="AbortError";
    return res.status(timedOut?504:500).json({
      error:timedOut?"Career Agent timed out. Please try again.":(e?.message||"Unexpected Career Agent error.")
    });
  }
}
