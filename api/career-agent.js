const N8N_WEBHOOK="https://pavansai2013.app.n8n.cloud/webhook/naa-bhavishyathu-ai";

function cleanText(value){
  return String(value||"")
    .replace(/#{1,6}\s*/g,"")
    .replace(/\*\*/g,"")
    .replace(/__+/g,"")
    .replace(/\`+/g,"")
    .trim();
}

function extractText(data){
  if(data==null) return "";
  if(typeof data==="string") return cleanText(data);
  if(typeof data.output_text==="string") return cleanText(data.output_text);
  if(Array.isArray(data.output)){
    for(const item of data.output||[]){
      for(const part of item?.content||[]){
        if(typeof part?.text==="string"&&part.text.trim()) return cleanText(part.text);
      }
    }
  }
  const candidates=[data.answer,data.text,data.message,data.response,data.content,data.result,data.reply,data.data?.output,data.data?.answer];
  for(const value of candidates){
    if(typeof value==="string"&&value.trim()) return cleanText(value);
  }
  return "";
}

function safeJson(text){
  const raw=String(text||"").trim().replace(/^\`\`\`json\s*/i,"").replace(/\`\`\`$/,"").trim();
  try{return JSON.parse(raw)}catch{}
  const a=raw.indexOf("{"),b=raw.lastIndexOf("}");
  if(a>=0&&b>a){try{return JSON.parse(raw.slice(a,b+1))}catch{}}
  return null;
}

function defaultSteps(profession,language){
  const te=language!=="en";
  const maps={
    "Cricketer":te?[
      ["🏏","Practice","రోజూ Batting / Bowling / Fitness సాధన చేయండి."],
      ["🏫","Coaching","School / Club / Academyలో coaching తీసుకోండి."],
      ["🥇","Matches","School → District → State స్థాయిలో matches ఆడండి."],
      ["💪","Build Skills","Technique, Fitness, Discipline మెరుగుపరచండి."],
      ["🏆","Dream Goal","Professional Cricketer స్థాయికి ఎదగండి."]
    ]:[
      ["🏏","Practice","Train batting / bowling / fitness every day."],
      ["🏫","Coaching","Join school, club or academy coaching."],
      ["🥇","Matches","Progress through School → District → State matches."],
      ["💪","Build Skills","Improve technique, fitness and discipline."],
      ["🏆","Dream Goal","Work towards professional cricket."]
    ],
    "Doctor":te?[
      ["📚","10th","Science basics బలంగా చేసుకోండి."],["🧬","Intermediate BiPC","Biology, Physics, Chemistryపై focus చేయండి."],["📝","NEET","Latest official eligibility ప్రకారం NEETకి prepare అవ్వండి."],["🎓","MBBS","Medical collegeలో MBBS పూర్తి చేయండి."],["🏥","Doctor","Internship / registration తర్వాత medical career ప్రారంభించండి."]
    ]:[
      ["📚","10th","Build strong science basics."],["🧬","Intermediate BiPC","Focus on Biology, Physics and Chemistry."],["📝","NEET","Prepare according to the latest official NEET rules."],["🎓","MBBS","Complete MBBS at a recognized medical college."],["🏥","Doctor","Complete internship/registration and begin practice."]
    ],
    "Software Developer":te?[
      ["💻","Basics","Maths + computer basics నేర్చుకోండి."],["🧠","Coding","Python / JavaScript వంటి languageతో ప్రారంభించండి."],["🎓","Course / Degree","Degree లేదా strong skill-based training తీసుకోండి."],["🛠️","Projects","Real projects build చేసి portfolio తయారు చేయండి."],["🚀","Career","Internship / job ద్వారా Software Developerగా ఎదగండి."]
    ]:[
      ["💻","Basics","Learn maths and computer fundamentals."],["🧠","Coding","Start with a language such as Python or JavaScript."],["🎓","Course / Degree","Take a degree or strong skill-based training."],["🛠️","Projects","Build real projects and a portfolio."],["🚀","Career","Move into internships and software roles."]
    ],
    "IAS Officer":te?[
      ["📚","School","Strong reading, writing, general awareness పెంచుకోండి."],["🎓","Degree","Recognized degree పూర్తి చేయండి."],["📝","UPSC Preparation","Syllabus + current affairsతో structured preparation చేయండి."],["✅","Exam Stages","Prelims → Mains → Interviewకి prepare అవ్వండి."],["🏛️","IAS Goal","Latest UPSC notification ప్రకారం eligibility verify చేసి attempt చేయండి."]
    ]:[
      ["📚","School","Build reading, writing and general awareness."],["🎓","Degree","Complete a recognized degree."],["📝","UPSC Preparation","Prepare with the syllabus and current affairs."],["✅","Exam Stages","Prepare for Prelims → Mains → Interview."],["🏛️","IAS Goal","Verify current UPSC eligibility and attempt the exam."]
    ],
    "Sports Teacher":te?[
      ["🏃","Sports Base","School sportsలో active participation పెంచుకోండి."],["📚","Education","Required academic qualification పూర్తి చేయండి."],["🎓","Physical Education","Relevant PE qualification / training తీసుకోండి."],["📝","Recruitment","Latest teacher recruitment rulesను verify చేయండి."],["🏅","PE Teacher","School Physical Education Teacherగా career build చేయండి."]
    ]:[
      ["🏃","Sports Base","Build active participation in school sports."],["📚","Education","Complete the required academic qualification."],["🎓","Physical Education","Take the relevant PE qualification/training."],["📝","Recruitment","Verify the latest teacher recruitment rules."],["🏅","PE Teacher","Build a career as a Physical Education Teacher."]
    ]
  };
  return (maps[profession]|| (te?[
    ["📚","చదువు","మీ careerకి అవసరమైన basic education పూర్తి చేయండి."],
    ["🎯","Skills","ఈ professionకి అవసరమైన core skills practice చేయండి."],
    ["🏫","Training","సరైన course / training / coaching తీసుకోండి."],
    ["📝","Selection","అవసరమైన exams / selection process గురించి తెలుసుకోండి."],
    ["🏆","Dream Goal",profession+" లక్ష్యానికి step-by-stepగా ముందుకు సాగండి."]
  ]:[
    ["📚","Education","Complete the basic education needed for this career."],
    ["🎯","Skills","Practice the core skills required."],
    ["🏫","Training","Take suitable courses, training or coaching."],
    ["📝","Selection","Learn the relevant exam or selection process."],
    ["🏆","Dream Goal","Move step by step toward "+profession+"."]
  ])).map(([icon,title,description])=>({icon,title,description}));
}

function normalizeRoadmap(obj,{profession,currentStage,language}){
  const te=language!=="en";
  const base={
    career:profession,
    current_stage:currentStage|| (te?"Student":"Student"),
    goal:profession,
    short_motivation:te?"చిన్న చిన్న అడుగులతో మీ కలకు దగ్గరవ్వండి.":"Small consistent steps can move you toward your dream.",
    steps:defaultSteps(profession,language),
    skills:[],
    education:[],
    exams_or_selection:[],
    next_action:te?"ఈరోజే మొదటి చిన్న step ప్రారంభించండి.":"Start one small step today."
  };
  if(!obj||typeof obj!=="object") return base;
  const steps=Array.isArray(obj.steps)?obj.steps.slice(0,6).map((s,i)=>({
    icon:String(s?.icon||["📚","🎯","🏫","📝","🚀","🏆"][i]||"➡️").slice(0,8),
    title:cleanText(s?.title||"Step "+(i+1)).slice(0,70),
    description:cleanText(s?.description||"").slice(0,180)
  })).filter(s=>s.title||s.description):[];
  return {
    career:cleanText(obj.career||profession).slice(0,80),
    current_stage:cleanText(obj.current_stage||base.current_stage).slice(0,80),
    goal:cleanText(obj.goal||profession).slice(0,100),
    short_motivation:cleanText(obj.short_motivation||base.short_motivation).slice(0,220),
    steps:steps.length?steps:base.steps,
    skills:Array.isArray(obj.skills)?obj.skills.slice(0,5).map(x=>cleanText(x).slice(0,70)):[],
    education:Array.isArray(obj.education)?obj.education.slice(0,5).map(x=>cleanText(x).slice(0,90)):[],
    exams_or_selection:Array.isArray(obj.exams_or_selection)?obj.exams_or_selection.slice(0,5).map(x=>cleanText(x).slice(0,100)):[],
    next_action:cleanText(obj.next_action||base.next_action).slice(0,180)
  };
}

function buildInstruction({profession,q,language,country,state,currentStage}){
  const english=language==="en";
  const schema='{"career":"","current_stage":"","goal":"","short_motivation":"","steps":[{"icon":"","title":"","description":""}],"skills":[],"education":[],"exams_or_selection":[],"next_action":""}';
  if(english) return `You are the Naa Bhavishyathu AI Career Roadmap Agent. Profession: ${profession}. Current stage: ${currentStage||"Student"}. Location: ${country}${state?", "+state:""}. User question: ${q}. Return ONLY valid JSON matching this schema: ${schema}. Create 4-6 visually simple career steps in the correct order. Each step must have one emoji icon, a title of at most 4 words, and one very short sentence. Make it understandable to children and low-literacy users. Do not invent marks, qualifications or achievements. If rules/eligibility can change, keep wording general and mention verification in exams_or_selection. The next_action must be one simple thing the user can start now. No Markdown and no text outside JSON.`;
  return `నీవు Naa Bhavishyathu AI Visual Career Roadmap Agent. Profession: ${profession}. Current stage: ${currentStage||"Student"}. ప్రాంతం: ${country}${state?", "+state:""}. User question: ${q}. ఈ schemaకి సరిపోయే VALID JSON మాత్రమే ఇవ్వాలి: ${schema}. 4-6 చాలా సులభమైన visual career steps సరైన orderలో ఇవ్వాలి. ప్రతి stepలో ఒక emoji icon, చాలా చిన్న title, ఒకే చిన్న Telugu sentence ఉండాలి. పిల్లలు, తక్కువ చదువు ఉన్నవారు కూడా చూసి అర్థం చేసుకునేలా ఉండాలి. User చెప్పని marks, qualifications, achievements ఊహించకూడదు. మారే eligibility/rules ఉంటే exams_or_selectionలో latest official notification verify చేయాలని చెప్పాలి. next_actionలో ఇప్పుడే చేయగల ఒకే simple action ఇవ్వాలి. Markdown వద్దు. JSON బయట text వద్దు.`;
}

async function askOpenAI(instruction){
  if(!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY_MISSING");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),22000);
  try{
    const r=await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{"Authorization":"Bearer "+process.env.OPENAI_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({model:"gpt-4.1-mini",input:[{role:"user",content:instruction}],max_output_tokens:900}),
      signal:controller.signal
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok){const err=new Error(data?.error?.message||"OpenAI Career Agent request failed.");err.status=r.status;throw err;}
    const text=extractText(data);
    if(!text) throw new Error("OpenAI returned no answer.");
    return text;
  }finally{clearTimeout(timeout);}
}

async function askN8N(instruction,payload){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10000);
  try{
    const r=await fetch(N8N_WEBHOOK,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...payload,chatInput:instruction,prompt:instruction,input:instruction,goal:instruction}),signal:controller.signal});
    const text=await r.text();
    let data;try{data=JSON.parse(text)}catch{data=text}
    if(!r.ok) throw new Error(extractText(data)||"Career Agent fallback failed.");
    return extractText(data);
  }finally{clearTimeout(timeout);}
}

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({error:"POST only"});
  try{
    const {name="",profession="",question="",country="India",state="",language="te",currentStage="Student"}=req.body||{};
    const q=String(question||"").trim() || (language==="en"?"Show my career roadmap.":"నా career roadmap చూపించు.");
    if(!profession)return res.status(400).json({error:"Profession is required."});
    const instruction=buildInstruction({profession,q,language,country,state,currentStage});
    let raw="";
    try{
      raw=await askOpenAI(instruction);
    }catch(primaryError){
      try{
        raw=await askN8N(instruction,{mode:"career_agent",source:"naa-bhavishyathu-ai",name:name||"User",profession,question:q,userMessage:q,message:q,language:language==="en"?"English":"Telugu",response_language:language==="en"?"en-IN":"te-IN",country,state,currentStage});
      }catch{
        const roadmap=normalizeRoadmap(null,{profession,currentStage,language});
        return res.status(200).json({roadmap,fallback:true});
      }
    }
    const roadmap=normalizeRoadmap(safeJson(raw),{profession,currentStage,language});
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({roadmap});
  }catch(e){
    return res.status(500).json({error:e?.message||"Unexpected Career Agent error."});
  }
}
