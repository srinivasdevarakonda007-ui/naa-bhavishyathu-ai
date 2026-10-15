let paidCredit=false;let successfulGenerations=0;let generatedPortraitSrc="";let latestCareerResult=null;
const jobs=[
["🇮🇳","Indian Cricket Team Player"],["🇮🇳","Indian Women's Cricket Player"],["🏏","Cricketer"],["🏏","Athlete"],
["👮","Police Officer"],["🛡️","IPS Officer"],["🏛️","IAS Officer"],["🪖","Real Army Soldier"],["🎖️","Army Officer"],["⚓","Navy Officer"],["✈️","Air Force Officer"],["⚜️","Scouts and Guides Officer"],
["🩺","Doctor"],["🦷","Dentist"],["👩‍⚕️","Nurse"],["💊","Pharmacist"],["🧑‍⚕️","Physiotherapist"],
["👩‍🏫","Teacher"],["🔬","Scientist"],["🚀","Astronaut"],["🧑‍✈️","Pilot"],
["💻","Engineer"],["🏗️","Civil Engineer"],["📐","Architect"],["👨‍💻","Software Developer"],["🤖","AI Engineer"],["🔐","Cybersecurity Expert"],
["⚖️","Lawyer"],["👩‍⚖️","Judge"],["📊","Chartered Accountant"],["🏦","Banker"],["💼","Entrepreneur"],["👨‍🍳","Chef"],
["🌾","Farmer / Agri Entrepreneur"],["🌳","Forest Officer"],["🚒","Fire & Rescue Officer"],["🚆","Railway Officer"],
["🎙️","Journalist"],["📹","Content Creator"],["🎨","Artist / Designer"],["🤝","Social Worker"],["🏛️","Public Representative"],
["🏅","Sports Teacher"],["🏸","Badminton Player"],["⚽","Footballer"],["🏑","Hockey Player"],["🤼","Kabaddi Player"],["🥋","Wrestler"]
];let selected="";const grid=document.querySelector("#jobs");jobs.forEach(([icon,name])=>{const b=document.createElement("button");b.className="job";b.innerHTML="<span>"+icon+"</span><b>"+name+"</b>";b.onclick=()=>{document.querySelectorAll(".job").forEach(x=>x.classList.remove("active"));b.classList.add("active");selected=name;const agentStatus=document.querySelector("#agentStatus");if(agentStatus){agentStatus.textContent="✅ "+name+" ఎంపికైంది — ఇప్పుడు మీ ప్రశ్న టైప్ చేయండి.";agentStatus.classList.add("ready");}document.querySelector("#agentQuestion")?.focus();document.querySelector("#role").textContent=(document.querySelector("#personName")?.value.trim()||"నా కల")+" — "+name};grid.appendChild(b)});document.querySelector("#photo").onchange=e=>{const f=e.target.files[0];if(!f)return;generatedPortraitSrc="";const url=URL.createObjectURL(f);document.querySelector("#preview").innerHTML='<img src="'+url+'" alt="preview">';document.querySelector("#poster").querySelector(".placeholder")?.remove();let img=document.querySelector("#poster img");if(!img){img=document.createElement("img");document.querySelector("#poster").prepend(img)}img.src=url;if(latestCareerResult)renderCareerResult(latestCareerResult.question,latestCareerResult.rawAnswer);};
document.querySelector("#generate").onclick=async()=>{
 if(successfulGenerations>=1&&!paidCredit){document.querySelector("#paymentBox").hidden=false;document.querySelector("#paymentBox").scrollIntoView({behavior:"smooth"});return alert("మొదటి AI Portrait ఉచితం. మరో portrait కోసం ₹20 secure payment చేయండి.");}
 const file=document.querySelector("#photo").files[0];
 if(!file)return alert("ముందుగా మీ ఫోటో upload చేయండి.");
 if(!selected)return alert("ఒక profession ఎంచుకోండి.");
 const personName=document.querySelector("#personName").value.trim();
 if(!personName)return alert("మీ పేరు నమోదు చేయండి.");
 const btn=document.querySelector("#generate"),old=btn.textContent;
 btn.disabled=true;btn.textContent="AI మీ భవిష్యత్తు తయారవుతోంది…";
 document.querySelector("#role").textContent=personName+" — "+selected;
 try{
   const storyRequest=fetch("/api/story",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
     name:personName,
     profession:selected,
     country:document.querySelector("#country").value,
     state:document.querySelector("#state").value
   })}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Story generation failed");return d;});

   const fd=new FormData();
   fd.append("image",file);fd.append("profession",selected);
   fd.append("country",document.querySelector("#country").value);
   fd.append("state",document.querySelector("#state").value);
   const imageRequest=fetch("/api/generate",{method:"POST",body:fd}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Portrait generation failed");return d;});

   const [storyResult,imageResult]=await Promise.allSettled([storyRequest,imageRequest]);
   if(storyResult.status==="fulfilled"){
     document.querySelector("#story").textContent=storyResult.value.story;
   }else{
     document.querySelector("#story").textContent="AI story error: "+storyResult.reason.message;
   }
   if(imageResult.status==="fulfilled"){
     let img=document.querySelector("#poster img");
     if(!img){img=document.createElement("img");document.querySelector("#poster").prepend(img)}
     img.src=imageResult.value.image;
     generatedPortraitSrc=imageResult.value.image;
     if(latestCareerResult)renderCareerResult(latestCareerResult.question,latestCareerResult.rawAnswer);
     successfulGenerations += 1;
     paidCredit = false;
     document.querySelector("#paymentBox").hidden = false;
   }else{
     const rawMsg=String(imageResult.reason?.message||"");
     const safeMsg=/safety|rejected|policy/i.test(rawMsg)
       ?"ఈ ఫోటోతో AI portrait తయారు చేయలేకపోయింది. AI image safety check వల్ల ఈ ఫోటో process కాలేదు. మరో clear front-facing photoతో ప్రయత్నించండి."
       :"Portrait తయారీలో తాత్కాలిక సమస్య వచ్చింది. మరోసారి ప్రయత్నించండి.";
     alert(safeMsg);
   }
   document.querySelector("#actions").hidden=false;
   document.querySelector("#poster").scrollIntoView({behavior:"smooth"});
 }catch(e){alert("AI generation error: "+e.message)}
 finally{btn.disabled=false;btn.textContent=old}
};
document.querySelector("#country").onchange=e=>{const s=document.querySelector("#state");s.style.display=e.target.value==="India"?"inline-block":"none";};
document.querySelector("#personName").addEventListener("input",e=>{document.querySelector("#role").textContent=(e.target.value.trim()||"నా కల")+(selected?" — "+selected:"");});
async function posterBlob(){
 const poster=document.querySelector("#poster"),img=poster.querySelector("img"); if(!img?.src) throw new Error("ముందుగా portrait తయారు చేయండి.");
 const c=document.createElement("canvas");c.width=1240;c.height=1754;const x=c.getContext("2d");
 const g=x.createLinearGradient(0,0,c.width,c.height);g.addColorStop(0,"#1f1147");g.addColorStop(.55,"#6d28d9");g.addColorStop(1,"#be185d");x.fillStyle=g;x.fillRect(0,0,c.width,c.height);
 const im=new Image();im.crossOrigin="anonymous";await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=img.src});
 const pad=65,top=65,w=c.width-pad*2,h=1180;const scale=Math.max(w/im.width,h/im.height),sw=w/scale,sh=h/scale,sx=(im.width-sw)/2,sy=(im.height-sh)/2;x.drawImage(im,sx,sy,sw,sh,pad,top,w,h);
 x.fillStyle="#fff";x.textAlign="center";x.font="bold 58px sans-serif";x.fillText(document.querySelector("#role").textContent,c.width/2,1335);
 x.font="34px sans-serif";const story=document.querySelector("#story").textContent;const words=story.split(" ");let line="",y=1410;for(const word of words){const test=line+word+" ";if(x.measureText(test).width>1050){x.fillText(line,c.width/2,y);line=word+" ";y+=52}else line=test}x.fillText(line,c.width/2,y);
 x.font="26px sans-serif";x.fillText("Naa Bhavishyathu AI • AI Career Portrait",c.width/2,1695);
 return await new Promise(r=>c.toBlob(r,"image/jpeg",.95));
}
document.querySelector("#download").onclick=async()=>{try{const b=await posterBlob(),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=(document.querySelector("#personName").value.trim()||"portrait")+"-"+(selected||"career")+".jpg";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}catch(e){alert(e.message)}};
document.querySelector("#print").onclick=async()=>{try{const b=await posterBlob(),u=URL.createObjectURL(b),w=window.open("","_blank");w.document.write('<html><head><title>A4 Print</title><style>@page{size:A4 portrait;margin:0}body{margin:0}img{width:210mm;height:297mm;object-fit:contain;display:block}</style></head><body><img src="'+u+'" onload="window.print()"></body></html>');w.document.close()}catch(e){alert(e.message)}};
document.querySelector("#share").onclick=async()=>{try{
 const b=await posterBlob();
 const file=new File([b],"naa-bhavishyathu-ai.jpg",{type:"image/jpeg"});
 const siteUrl="https://naa-bhavishyathu-ai.vercel.app/";
 const role=document.querySelector("#role").textContent;
 const shareText=role+"\n\n✨ Naa Bhavishyathu AI\nమీ ఫోటోను మీ Dream Profession రూపంలో AI Portraitగా మార్చుకోండి.\n🌐 "+siteUrl;
 if(navigator.share&&navigator.canShare?.({files:[file]})){
   await navigator.share({title:"Naa Bhavishyathu AI",text:shareText,url:siteUrl,files:[file]});
 }else{
   const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="naa-bhavishyathu-ai.jpg";a.click();
   setTimeout(()=>URL.revokeObjectURL(a.href),1500);
   window.open("https://wa.me/?text="+encodeURIComponent(shareText),"_blank");
 }
}catch(e){if(e.name!=="AbortError")alert(e.message)}};



const uiText={
 te:{heroTitle:'మీ ఫోటో. మీ కల.<br><em>మీ భవిష్యత్తు.</em>',heroText:'మీ ఫోటోను మీ Dream Profession రూపంలో AI portraitగా మార్చండి. మీ పేరుతో చిన్న తెలుగు inspirational message కూడా పొందండి.',upload:'📷 ఫోటో ఎంచుకోండి',details:'మీ వివరాలు',name:'మీ పేరు',country:'దేశం',state:'రాష్ట్రం',profession:'మీ Dream Profession ఎంచుకోండి',create:'మీ Future Portrait తయారు చేయండి',createText:'Photo + Name + Profession సిద్ధంగా ఉంటే Generate నొక్కండి.',generate:'✨ AI Portrait తయారు చేయండి',result:'మీ Dream Portrait',agentTitle:'🤖 మీ Portraitకి Career Guidance',agentIntro:'మీ profession గురించి చదువు, skills, courses, eligibility, career path మరియు next steps గురించి తెలుగులో లేదా Englishలో అడగండి.',agentLabel:'✍️ మీ ప్రశ్న ఇక్కడ టైప్ చేయండి',agentPlaceholder:'ఉదా: Engineer కావాలంటే 10th తర్వాత ఏమి చదవాలి?',ask:'🤖 అడగండి'},
 en:{heroTitle:'Your Photo. Your Dream.<br><em>Your Future.</em>',heroText:'Turn your photo into a premium AI dream-career portrait and get a short inspirational message with your name.',upload:'📷 Choose Photo',details:'Your Details',name:'Your Name',country:'Country',state:'State',profession:'Choose Your Dream Profession',create:'Create Your Future Portrait',createText:'When your photo, name and profession are ready, press Generate.',generate:'✨ Create AI Portrait',result:'Your Dream Portrait',agentTitle:'🤖 Career Guidance for Your Portrait',agentIntro:'Ask about education, skills, courses, eligibility, career path and next steps in English or Telugu.',agentLabel:'✍️ Type your question here',agentPlaceholder:'Example: What should I study after 10th to become an Engineer?',ask:'🤖 Ask'}
};
let uiLang='te';
document.querySelector('#lang')?.addEventListener('click',()=>{
 uiLang=uiLang==='te'?'en':'te';const t=uiText[uiLang];
 document.querySelector('#lang').textContent=uiLang==='te'?'తెలుగు / EN':'EN / తెలుగు';
 document.querySelector('#heroTitle').innerHTML=t.heroTitle;document.querySelector('#heroText').textContent=t.heroText;
 document.querySelector('#uploadBtn').textContent=t.upload;document.querySelector('#detailsTitle').textContent=t.details;
 document.querySelector('#nameLabel').textContent=t.name;document.querySelector('#countryLabel').textContent=t.country;
 document.querySelector('#stateLabel').textContent=t.state;document.querySelector('#professionTitle').textContent=t.profession;
 document.querySelector('#createTitle').textContent=t.create;document.querySelector('#createText').textContent=t.createText;
 const g=document.querySelector('#generate');if(!g.disabled)g.textContent=t.generate;
 document.querySelector('#resultTitle').textContent=t.result;
 document.querySelector('#agentTitle').textContent=t.agentTitle;document.querySelector('#agentIntro').textContent=t.agentIntro;
 document.querySelector('#agentQuestionLabel').textContent=t.agentLabel;document.querySelector('#agentQuestion').placeholder=t.agentPlaceholder;
 const ask=document.querySelector('#askAgent');if(!ask.disabled)ask.textContent=t.ask;
});
async function startRazorpayPayment(){
 const btn=document.querySelector("#payBtn");
 const approvedHost="naa-bhavishyathu-ai.vercel.app";
 if(location.hostname!==approvedHost){
   alert("Secure payment కోసం approved Production website మాత్రమే ఉపయోగించండి.");
   location.href="https://"+approvedHost+"/";
   return;
 }
 if(btn?.dataset.processing==="1") return;
 if(btn){btn.dataset.processing="1";btn.disabled=true;btn.textContent="Payment opening…";}
 try{
  const r=await fetch("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
  const o=await r.json(); if(!r.ok)throw new Error(o.error||"Payment unavailable");
  if(!window.Razorpay)throw new Error("Checkout unavailable");
  new Razorpay({key:o.key,amount:o.amount,currency:o.currency,name:"Naa Bhavishyathu AI",description:"Extra AI Portrait Access",order_id:o.orderId,
   handler:async function(p){
    const vr=await fetch("/api/verify-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
    const v=await vr.json();
    if(vr.ok&&v.verified){paidCredit=true;alert("Payment successful ✅ ఇప్పుడు 1 extra AI Portrait generate చేయవచ్చు.");document.querySelector("#paymentBox").hidden=true;document.querySelector("#generate").scrollIntoView({behavior:"smooth"});}
    else alert("Payment verification failed. Please contact support.");
   },theme:{color:"#6d28d9"}}).open();
 }catch(e){alert(e.message||"Payment service unavailable.");}
 finally{if(btn){btn.dataset.processing="0";btn.disabled=false;btn.textContent="Pay ₹20 & Continue";}}
}
document.querySelector("#payBtn")?.addEventListener("click",startRazorpayPayment);

function addAgentBubble(text,isUser=false){
 const box=document.querySelector("#agentMessages"); if(!box)return;
 const d=document.createElement("div");d.className="agent-bubble"+(isUser?" user":"");d.textContent=text;box.appendChild(d);box.scrollTop=box.scrollHeight;
}
function parseCareerAnswer(raw){
 const text=String(raw||"").replace(/\r/g,"").trim();
 const answerMatch=text.match(/DIRECT ANSWER\s*[:：]\s*([\s\S]*?)(?=\n\s*STEP-BY-STEP PLAN\s*[:：]|\n\s*IMPORTANT NOTE\s*[:：]|$)/i);
 const stepsMatch=text.match(/STEP-BY-STEP PLAN\s*[:：]\s*([\s\S]*?)(?=\n\s*IMPORTANT NOTE\s*[:：]|$)/i);
 const noteMatch=text.match(/IMPORTANT NOTE\s*[:：]\s*([\s\S]*?)$/i);
 let answer=(answerMatch?.[1]||"").trim();
 let stepText=(stepsMatch?.[1]||"").trim();
 let steps=[];
 for(const line of stepText.split(/\n+/)){
  const m=line.match(/^\s*(?:step\s*)?(\d{1,2})[.)\-:]\s*(.+)$/i);
  if(!m)continue;
  const body=m[2].trim();
  const split=body.match(/^(.{2,70}?)[—–:]\s*(.+)$/);
  steps.push({title:split?split[1].trim():(uiLang==="en"?"Step ":"దశ ")+m[1],description:split?split[2].trim():body});
 }
 if(!answer){
  answer=text.replace(/STEP-BY-STEP PLAN\s*[:：]?[\s\S]*$/i,"").replace(/IMPORTANT NOTE\s*[:：]?[\s\S]*$/i,"").trim();
  if(!answer)answer=text;
 }
 return {answer,steps,note:(noteMatch?.[1]||"").trim()};
}
function renderCareerResult(question,rawAnswer){
 const card=document.querySelector("#careerResult");if(!card)return;
 const parsed=parseCareerAnswer(rawAnswer);
 latestCareerResult={question:String(question||""),rawAnswer:String(rawAnswer||""),answer:parsed.answer,steps:parsed.steps,note:parsed.note,profession:selected,language:uiLang,photo:generatedPortraitSrc};
 const heading=document.querySelector("#careerResultHeading");
 const q=document.querySelector("#careerResultQuestion");
 const answer=document.querySelector("#careerResultAnswer");
 const photo=document.querySelector("#careerResultPhoto");
 const photoHint=document.querySelector("#careerResultPhotoHint");
 const note=document.querySelector("#careerResultNote");
 const stepsWrap=document.querySelector("#careerResultSteps");
 if(heading)heading.textContent=selected||"Career Guidance";
 if(q)q.textContent=question;
 if(answer)answer.textContent=parsed.answer;
 if(photo){
  if(generatedPortraitSrc.startsWith("data:image/")){photo.src=generatedPortraitSrc;photo.hidden=false;if(photoHint)photoHint.hidden=true;}
  else{photo.removeAttribute("src");photo.hidden=true;if(photoHint)photoHint.hidden=false;}
 }
 if(note){note.textContent=parsed.note;note.hidden=!parsed.note;}
 if(stepsWrap){
  stepsWrap.replaceChildren();
  parsed.steps.forEach((step,index)=>{
   const article=document.createElement("article");article.className="career-step-card step-color-"+((index%5)+1);
   const number=document.createElement("span");number.className="career-step-number";number.textContent=String(index+1).padStart(2,"0");
   const content=document.createElement("div");content.className="career-step-content";
   const title=document.createElement("h4");title.textContent=step.title;
   const desc=document.createElement("p");desc.textContent=step.description;
   content.append(title,desc);article.append(number,content);stepsWrap.appendChild(article);
  });
  const empty=document.querySelector("#careerStepsEmpty");
  if(empty)empty.hidden=parsed.steps.length>0;
 }
 card.hidden=false;
}
function escapeResultHtml(value){
 return String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function buildCompleteResultHtml(autoPrint=false){
 if(!latestCareerResult)throw new Error(uiLang==="en"?"Ask the Career Agent first to create a result.":"ముందుగా Career Agentని అడిగి ఫలితాన్ని తయారు చేయండి.");
 const r=latestCareerResult;
 const safePhoto=/^data:image\/(?:png|jpeg|jpg|webp);base64,/i.test(r.photo||"")?r.photo:"";
 const photoHtml=safePhoto?'<img class="portrait" src="'+safePhoto+'" alt="AI career portrait">':'<p class="no-photo">AI portrait ఇంకా తయారు కాలేదు. ఫోటో లేకుండా career guide సేవ్ చేయబడింది.</p>';
 const stepsHtml=(r.steps||[]).map((step,i)=>'<article class="step step-'+(i%5+1)+'"><span>'+(i+1)+'</span><div><h3>'+escapeResultHtml(step.title)+'</h3><p>'+escapeResultHtml(step.description)+'</p></div></article>').join("");
 const noteHtml=r.note?'<aside><strong>Important note</strong><p>'+escapeResultHtml(r.note)+'</p></aside>':"";
 return '<!doctype html><html lang="'+(r.language==="en"?"en":"te")+'"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Naa Bhavishyathu AI - Career Guide</title><style>*{box-sizing:border-box}body{font-family:Arial,"Noto Sans Telugu",sans-serif;margin:0;background:#f5f3ff;color:#24183b;line-height:1.65}.page{max-width:900px;margin:24px auto;background:white;padding:28px;border-radius:24px;box-shadow:0 10px 35px #312e811a}.hero{padding:22px;border-radius:18px;background:linear-gradient(125deg,#dbeafe,#f3e8ff,#ccfbf1)}.brand{font-size:13px;font-weight:800;color:#6d28d9}.hero h1{margin:8px 0;color:#312e81;font-size:30px}.meta{font-size:14px;color:#51456b}.portrait{display:block;width:min(100%,440px);max-height:580px;object-fit:contain;margin:22px auto;border-radius:18px;border:1px solid #ddd6fe}.answer,.step{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:16px;margin:12px 0}.answer{border-left:6px solid #7c3aed}.step{display:flex;gap:14px;align-items:flex-start}.step>span{display:grid;place-items:center;min-width:38px;height:38px;border-radius:12px;background:#ede9fe;color:#5b21b6;font-weight:900}.step-2{background:#eff6ff}.step-3{background:#ecfdf5}.step-4{background:#fff7ed}.step-5{background:#fdf2f8}h2{color:#4c1d95;margin:24px 0 8px}h3{margin:0 0 5px;font-size:17px}p{margin:4px 0;white-space:pre-wrap}aside{padding:14px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa}.no-photo{padding:20px;background:#f8fafc;border-radius:12px;text-align:center;color:#64748b}.foot{margin-top:24px;text-align:center;color:#6b7280;font-size:12px}@media print{body{background:#fff}.page{margin:0 auto;box-shadow:none;border-radius:0;padding:12mm;max-width:none}h2{break-after:avoid}.step{break-inside:avoid}.portrait{max-height:245mm}}@media(max-width:600px){.page{margin:0;padding:16px;border-radius:0}.hero h1{font-size:25px}}</style></head><body><main class="page"><header class="hero"><div class="brand">✨ Naa Bhavishyathu AI</div><h1>'+escapeResultHtml(r.profession||selected||"Career Guidance")+'</h1><p class="meta"><strong>Question:</strong> '+escapeResultHtml(r.question)+'</p></header>'+photoHtml+'<h2>AI Answer / సమాధానం</h2><section class="answer"><p>'+escapeResultHtml(r.answer)+'</p></section><h2>Step-by-Step Plan / దశలవారీ ప్రణాళిక</h2>'+ (stepsHtml||'<p>ఈ సమాధానంలో ప్రత్యేక numbered steps అందుబాటులో లేవు.</p>')+noteHtml+'<footer class="foot">Created with Naa Bhavishyathu AI • Educational guidance; verify changing official requirements.</footer></main>'+(autoPrint?'<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},400)});<\/script>':"")+'</body></html>';
}
function downloadData(data,filename,type){
 const blob=new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function downloadRawPortrait(){
 try{
  if(!generatedPortraitSrc)throw new Error(uiLang==="en"?"Generate an AI portrait first.":"ముందుగా AI Portrait తయారు చేయండి.");
  const response=await fetch(generatedPortraitSrc);if(!response.ok)throw new Error("Image download failed.");
  const blob=await response.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;
  const slug=(selected||"career").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"career";
  a.download="naa-bhavishyathu-"+slug+"-portrait.png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }catch(e){alert(e.message||"Image download failed.");}
}
function downloadCompleteResult(){
 try{
  if(!latestCareerResult)throw new Error(uiLang==="en"?"Ask the Career Agent first.":"ముందుగా Career Agentని అడగండి.");
  const slug=(latestCareerResult.profession||"career").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"career";
  downloadData(buildCompleteResultHtml(false),"naa-bhavishyathu-"+slug+"-complete-result.html","text/html;charset=utf-8");
 }catch(e){alert(e.message||"Could not download result.");}
}
function downloadGuideText(){
 try{
  if(!latestCareerResult)throw new Error(uiLang==="en"?"Ask the Career Agent first.":"ముందుగా Career Agentని అడగండి.");
  const r=latestCareerResult;const content=["Naa Bhavishyathu AI - Career Guide","Profession: "+(r.profession||""),"Question: "+r.question,"","ANSWER",r.answer,"","STEP-BY-STEP PLAN",...(r.steps||[]).map((s,i)=>(i+1)+". "+s.title+" - "+s.description),r.note?"":"",r.note?"IMPORTANT NOTE: "+r.note:""].filter(Boolean).join("\n");
  downloadData(content,"naa-bhavishyathu-career-guide.txt","text/plain;charset=utf-8");
 }catch(e){alert(e.message||"Could not download guide.");}
}
function saveCompleteResultPdf(){
 try{
  const w=window.open("","_blank");if(!w)throw new Error(uiLang==="en"?"Allow pop-ups to print or save as PDF.":"PDF సేవ్ చేయడానికి browserలో pop-ups అనుమతించండి.");
  w.document.open();w.document.write(buildCompleteResultHtml(true));w.document.close();
 }catch(e){alert(e.message||"Could not open the print view.");}
}
document.querySelector("#downloadCareerPhoto")?.addEventListener("click",downloadRawPortrait);
document.querySelector("#downloadCompleteResult")?.addEventListener("click",downloadCompleteResult);
document.querySelector("#downloadGuideOnly")?.addEventListener("click",downloadGuideText);
document.querySelector("#saveResultPdf")?.addEventListener("click",saveCompleteResultPdf);
document.querySelector("#askAgent")?.addEventListener("click",async()=>{
 const input=document.querySelector("#agentQuestion"),btn=document.querySelector("#askAgent");
 const question=input.value.trim(),name=document.querySelector("#personName").value.trim();
 if(!selected)return alert("ముందుగా మీ Dream Profession ఎంచుకోండి.");
 if(!question)return alert("Career Agentకి ఒక ప్రశ్న అడగండి.");
 addAgentBubble(question,true);input.value="";btn.disabled=true;btn.textContent="ఆలోచిస్తోంది…";
 try{
  const r=await fetch("/api/career-agent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,profession:selected,question,country:document.querySelector("#country").value,state:document.querySelector("#state").value,language:uiLang})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||"Career Agent unavailable");
  renderCareerResult(question,d.answer);
  const status=document.querySelector("#agentStatus");if(status){status.textContent=uiLang==="en"?"✅ Your career plan is ready below.":"✅ మీ Career Plan క్రింద సిద్ధంగా ఉంది.";status.classList.add("ready");}
 }catch(e){addAgentBubble(uiLang==="en"?"Career Agent error: "+(e.message||"Please try again."):"Career Agent error: "+(e.message||"మళ్లీ ప్రయత్నించండి."));}
 finally{btn.disabled=false;btn.textContent=uiLang==="en"?"🤖 Ask":"🤖 అడగండి";}
});
document.querySelector("#agentQuestion")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();document.querySelector("#askAgent")?.click();}});
