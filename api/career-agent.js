const N8N_WEBHOOK="https://pavansai2013.app.n8n.cloud/webhook/naa-bhavishyathu-ai";
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"POST only"});
 try{
  const {name="",profession="",question="",country="India",state="",language="te"}=req.body||{};
  if(!profession||!question.trim())return res.status(400).json({error:"Profession and question are required."});
  const english=language==="en";
  const instruction=english
   ?"You are the Naa Bhavishyathu AI Career Agent. Selected profession: "+profession+". User question: "+question+". Answer directly in clear, simple English. Use short sections or up to 5 concise points when useful: Education, Skills, Courses, Career Path, Next Step. Do not invent marks, age, qualifications, strengths or achievements. Avoid personality analysis and generic template filler. Keep it around 120 words. If eligibility or rules can change, advise checking the current official notification."
   :"నీవు Naa Bhavishyathu AI Career Agent. ఎంపిక చేసిన వృత్తి: "+profession+". యూజర్ ప్రశ్న: "+question+". ప్రశ్నకు నేరుగా సహజమైన, సులభమైన తెలుగులో సమాధానం ఇవ్వాలి. అవసరమైనప్పుడు చదువు, Skills, Courses, Career Path, Next Step అనే చిన్న విభాగాలు లేదా గరిష్టంగా 5 చిన్న points వాడాలి. అనవసర పరిచయం లేదా personality analysis వద్దు. యూజర్ చెప్పని marks, age, qualifications, strengths లేదా achievements ఊహించకూడదు. English technical course లేదా exam names అవసరమైనప్పుడు మాత్రమే వాడవచ్చు. సుమారు 120 పదాల్లో ఉంచాలి. eligibility లేదా rules మారే అంశమైతే ప్రస్తుత అధికారిక notificationను verify చేయాలని చివరలో చిన్న వాక్యం చెప్పాలి.";
  const r=await fetch(N8N_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   name:name||"User",profession,age:"",education:"",
   interests:profession+" career guidance",skills:"Not provided by user",
   goal:instruction,question,language:english?"English":"Telugu",response_language:english?"en-IN":"te-IN",country,state
  })});
  const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={output:text}}
  if(!r.ok)return res.status(r.status).json({error:data?.message||data?.error||"Career Agent failed."});
  let answer=String(data?.output||data?.text||data?.message||data?.response||"")
   .replace(/#{1,6}\s*/g,"").replace(/\*\*/g,"").replace(/__+/g,"").replace(/`+/g,"")
   .replace(/^(User|Assistant|AI)\s*[:：-]\s*/gim,"")
   .replace(/^(Likely Strengths|Curiosity|Observation|Career Paths)\s*[:：-]?\s*/gim,"").trim();
  if(!answer)return res.status(502).json({error:"Career Agent returned no answer."});
  if(answer.length>1400)answer=answer.slice(0,1400).replace(/\s+\S*$/,"")+"…";
  return res.status(200).json({answer});
 }catch(e){return res.status(500).json({error:e?.message||"Unexpected Career Agent error."});}
}