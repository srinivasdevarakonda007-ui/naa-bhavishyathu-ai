const N8N_WEBHOOK="https://pavansai2013.app.n8n.cloud/webhook/naa-bhavishyathu-ai";
export default async function handler(req,res){
 if(req.method!=="POST")return res.status(405).json({error:"POST only"});
 try{
  const {name="",profession="",question="",country="India",state=""}=req.body||{};
  if(!profession||!question.trim())return res.status(400).json({error:"Profession and question are required."});
  const r=await fetch(N8N_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   name:name||"User",profession,age:"",education:"",
   interests:profession+" career guidance",skills:"Not provided by user",
   goal:"You are Naa Bhavishyathu AI Career Agent. Answer this user's career question in simple, practical Telugu. Selected profession: "+profession+". User question: "+question+". Give accurate age-appropriate general guidance. Do not invent the user's qualifications, marks or achievements. If requirements vary by country/state or change over time, clearly say the user should verify current official eligibility. Keep the answer concise, useful and directly focused on the question.",
   question,language:"Telugu",response_language:"te-IN",country,state
  })});
  const text=await r.text();let data;try{data=JSON.parse(text)}catch{data={output:text}}
  if(!r.ok)return res.status(r.status).json({error:data?.message||data?.error||"Career Agent failed."});
  let answer=String(data?.output||data?.text||data?.message||data?.response||"").replace(/#{1,6}\\s*/g,"").replace(/\\*\\*/g,"").replace(/__+/g,"").replace(/\`+/g,"").trim();
  if(!answer)return res.status(502).json({error:"Career Agent returned no answer."});
  if(answer.length>1800)answer=answer.slice(0,1800).replace(/\\s+\\S*$/,"")+"…";
  return res.status(200).json({answer});
 }catch(e){return res.status(500).json({error:e?.message||"Unexpected Career Agent error."});}
}