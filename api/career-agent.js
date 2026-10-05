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

export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"POST only"});
 try{
  const {name="",profession="",question="",country="India",state="",language="te"}=req.body||{};
  const q=String(question||"").trim();
  if(!profession||!q)return res.status(400).json({error:"Profession and question are required."});
  const english=language==="en";
  const instruction=english
   ?"You are the Naa Bhavishyathu AI Career Agent. Selected profession: "+profession+". User question: "+q+". Answer the user's exact question directly in clear, simple English. Stay focused on the selected profession. Use short sections or up to 5 concise points only when useful: Education, Skills, Courses, Career Path, Next Step. Do not invent marks, age, qualifications, strengths or achievements. Avoid personality analysis and generic filler. Keep it around 120 words. If eligibility, fees, dates or rules can change, say to verify the latest official notification."
   :"నీవు Naa Bhavishyathu AI Career Agent. ఎంపిక చేసిన వృత్తి: "+profession+". యూజర్ అడిగిన అసలు ప్రశ్న: "+q+". ఆ ప్రశ్నకే నేరుగా, సహజమైన, సులభమైన తెలుగులో సమాధానం ఇవ్వాలి. ఎంపిక చేసిన వృత్తి గురించే ఉండాలి. అవసరమైనప్పుడు మాత్రమే చదువు, Skills, Courses, Career Path, Next Step అనే చిన్న విభాగాలు లేదా గరిష్టంగా 5 చిన్న points వాడాలి. యూజర్ చెప్పని marks, age, qualifications, strengths లేదా achievements ఊహించకూడదు. అనవసర personality analysis లేదా generic filler వద్దు. English technical course/exam names అవసరమైనప్పుడు మాత్రమే వాడాలి. సుమారు 120 పదాల్లో ఉంచాలి. eligibility, fees, dates లేదా rules మారే అంశమైతే latest official notification verify చేయాలని చివరలో చెప్పాలి.";

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
    age:"",
    education:"",
    interests:profession+" career guidance",
    skills:"Not provided by user",
    goal:instruction,
    language:english?"English":"Telugu",
    response_language:english?"en-IN":"te-IN",
    output_format:"Direct answer to the user's career question",
    country,
    state
  };

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),25000);
  let r;
  try{
    r=await fetch(N8N_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:controller.signal});
  }finally{clearTimeout(timeout);}

  const text=await r.text();
  let data;try{data=JSON.parse(text)}catch{data=text}
  if(!r.ok)return res.status(r.status).json({error:extractAnswer(data)||"Career Agent failed."});

  let answer=extractAnswer(data);
  if(!answer)return res.status(502).json({error:"Career Agent returned no answer.",code:"EMPTY_N8N_RESPONSE"});
  if(answer.length>1600)answer=answer.slice(0,1600).replace(/\s+\S*$/,"")+"…";
  return res.status(200).json({answer});
 }catch(e){
   const timedOut=e?.name==="AbortError";
   return res.status(timedOut?504:500).json({error:timedOut?"Career Agent timed out. Please try again.":(e?.message||"Unexpected Career Agent error.")});
 }
}
