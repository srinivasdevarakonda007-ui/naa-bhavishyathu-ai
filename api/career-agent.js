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
  const context=`Selected profession: ${profession}. User's exact question: ${q}. Location context: ${country}${state?", "+state:""}.`;
  const structure=`Return exactly these three sections, in this order, using these exact English headings so the website can format the result:
DIRECT ANSWER:
Write one direct, accurate, easy-to-understand answer to the user's exact question in the requested language.

STEP-BY-STEP PLAN:
Write 4 to 6 numbered steps, one step per line, in this exact format:
1. Short action title — practical explanation of what the student should do.
Each step must be relevant, concrete, logically ordered, and understandable to a school student. Do not repeat the same advice.

IMPORTANT NOTE:
Give one brief useful caution. If eligibility, official rules, dates, or fees can change, tell the user to verify the latest official notification. Never invent facts, marks, age limits, qualifications, fees, deadlines, or guaranteed outcomes. Do not assume personal details that the user did not provide. Stay focused on the selected profession and question. Avoid generic filler, personality analysis, Markdown tables, and extra headings. Keep the complete response concise (about 180–250 words).`;
  return english
    ?`You are the Naa Bhavishyathu AI Career Agent. Answer in clear, simple English. ${context}\n\n${structure}`
    :`నీవు Naa Bhavishyathu AI Career Agent. సమాధానం మరియు ప్రతి step వివరణ సహజమైన, సులభంగా అర్థమయ్యే తెలుగులో ఇవ్వాలి; అవసరమైన course/exam పేర్లు Englishలో ఉంచవచ్చు. ${context}\n\n${structure}\n\nThe section headings must remain exactly: DIRECT ANSWER:, STEP-BY-STEP PLAN:, IMPORTANT NOTE:. The actual answer and step descriptions must be in Telugu.`;
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
        max_output_tokens:650
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
