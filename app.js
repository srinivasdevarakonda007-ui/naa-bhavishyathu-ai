let paidCredit=false;let successfulGenerations=0;let currentRoadmap=null;
const jobs=[["👮","Police Officer"],["🏛️","IAS Officer"],["⚖️","Lawyer"],["🏅","Sports Teacher"],["🏃","Athlete"],["🏏","Cricketer"],["🩺","Doctor"],["👩‍🏫","Teacher"],["🔬","Scientist"],["✈️","Pilot"],["🪖","Army Officer"],["👨‍🍳","Chef"],["💼","Entrepreneur"],["💻","Engineer"]];let selected="";const grid=document.querySelector("#jobs");jobs.forEach(([icon,name])=>{const b=document.createElement("button");b.className="job";b.innerHTML="<span>"+icon+"</span><b>"+name+"</b>";b.onclick=()=>{document.querySelectorAll(".job").forEach(x=>x.classList.remove("active"));b.classList.add("active");selected=name;const agentStatus=document.querySelector("#agentStatus");if(agentStatus){agentStatus.textContent="✅ "+name+" ఎంపికైంది — ఇప్పుడు మీ ప్రశ్న టైప్ చేయండి.";agentStatus.classList.add("ready");}document.querySelector("#agentQuestion")?.focus();document.querySelector("#role").textContent=(document.querySelector("#personName")?.value.trim()||"నా కల")+" — "+name};grid.appendChild(b)});document.querySelector("#photo").onchange=e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f);document.querySelector("#preview").innerHTML='<img src="'+url+'" alt="preview">';document.querySelector("#poster").querySelector(".placeholder")?.remove();let img=document.querySelector("#poster img");if(!img){img=document.createElement("img");document.querySelector("#poster").prepend(img)}img.src=url};

function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function getCurrentStage(){return document.querySelector("#currentStage")?.value||"School Student"}
function renderRoadmap(rm){
 currentRoadmap=rm||null;
 const box=document.querySelector("#roadmapVisual");if(!box)return;
 if(!rm){box.innerHTML='<div class="roadmap-empty">🧭 AI Portrait తయారైన తర్వాత మీ visual career roadmap ఇక్కడ కనిపిస్తుంది.</div>';return;}
 const steps=(rm.steps||[]).map((s,i)=>'<div class="roadmap-step"><span class="roadmap-icon">'+esc(s.icon||"➡️")+'</span><b>'+(i+1)+'. '+esc(s.title||"Step")+'</b><p>'+esc(s.description||"")+'</p></div>').join("");
 const tags=[...(rm.education||[]),...(rm.skills||[]),...(rm.exams_or_selection||[])].slice(0,7).map(x=>'<span>'+esc(x)+'</span>').join("");
 box.innerHTML='<div class="roadmap-head"><div class="roadmap-point start"><small>📍 YOU ARE HERE</small><strong>'+esc(rm.current_stage||getCurrentStage())+'</strong></div><div class="roadmap-arrow">➜</div><div class="roadmap-point goal"><small>🏆 DREAM GOAL</small><strong>'+esc(rm.goal||rm.career||selected)+'</strong></div></div>'+
 '<div class="roadmap-motivation">✨ '+esc(rm.short_motivation||"")+'</div>'+
 '<div class="roadmap-steps">'+steps+'</div>'+
 (tags?'<div class="roadmap-tags">'+tags+'</div>':'')+
 '<div class="roadmap-next">🔥 <b>'+(uiLang==="en"?"MY NEXT STEP":"ఇప్పుడు నేను చేయాల్సిన పని")+'</b><br>'+esc(rm.next_action||"")+'</div>';
}
async function loadCareerRoadmap(question){
 if(!selected)return null;
 const payload={name:document.querySelector("#personName")?.value.trim()||"",profession:selected,question:question||"",country:document.querySelector("#country")?.value||"India",state:document.querySelector("#state")?.value||"",currentStage:getCurrentStage(),language:uiLang};
 const rr=await fetch("/api/career-agent",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
 const dd=await rr.json();if(!rr.ok)throw new Error(dd.error||"Career roadmap unavailable");
 if(!dd.roadmap)throw new Error("Career roadmap unavailable");
 renderRoadmap(dd.roadmap);return dd.roadmap;
}

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
     successfulGenerations += 1;
     paidCredit = false;
     document.querySelector("#paymentBox").hidden = false;
     loadCareerRoadmap(uiLang==="en"?"Show my complete career roadmap.":"నా పూర్తి career roadmap చూపించు.").catch(()=>{});
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
 const poster=document.querySelector("#poster"),img=poster.querySelector("img");if(!img?.src)throw new Error("ముందుగా portrait తయారు చేయండి.");
 const rm=currentRoadmap;
 const c=document.createElement("canvas");c.width=1600;c.height=2800;const x=c.getContext("2d");
 const grad=x.createLinearGradient(0,0,c.width,c.height);grad.addColorStop(0,"#312e81");grad.addColorStop(.28,"#7c3aed");grad.addColorStop(.62,"#0ea5e9");grad.addColorStop(1,"#16a34a");x.fillStyle=grad;x.fillRect(0,0,c.width,c.height);
 function roundRect(px,py,pw,ph,r,fill){x.beginPath();x.roundRect(px,py,pw,ph,r);x.fillStyle=fill;x.fill()}
 function wrap(text,maxWidth,font,lineHeight,maxLines=4){x.font=font;const words=String(text||"").split(/\s+/);const lines=[];let line="";for(const w of words){const test=line?line+" "+w:w;if(x.measureText(test).width>maxWidth&&line){lines.push(line);line=w;if(lines.length>=maxLines-1)break}else line=test}if(line&&lines.length<maxLines)lines.push(line);return lines}
 roundRect(55,55,1490,2690,44,"rgba(255,255,255,.97)");
 x.textAlign="center";x.fillStyle="#5b21b6";x.font="900 52px sans-serif";x.fillText("NAA BHAVISHYATHU AI",800,125);
 x.fillStyle="#6b7280";x.font="700 26px sans-serif";x.fillText("మీ ఫోటో • మీ కల • మీ భవిష్యత్తు",800,168);
 const im=new Image();im.crossOrigin="anonymous";await new Promise((ok,no)=>{im.onload=ok;im.onerror=no;im.src=img.src});
 const ix=130,iy=215,iw=1340,ih=980,scale=Math.max(iw/im.width,ih/im.height),sw=iw/scale,sh=ih/scale,sx=(im.width-sw)/2,sy=(im.height-sh)/2;
 x.save();x.beginPath();x.roundRect(ix,iy,iw,ih,34);x.clip();x.drawImage(im,sx,sy,sw,sh,ix,iy,iw,ih);x.restore();
 x.fillStyle="#312e81";x.font="900 50px sans-serif";x.fillText(document.querySelector("#role").textContent,800,1275);
 x.fillStyle="#374151";x.font="600 28px sans-serif";let y=1325;for(const line of wrap(document.querySelector("#story").textContent,1260,"600 28px sans-serif",42,3)){x.fillText(line,800,y);y+=42}
 y+=18;roundRect(110,y,1380,92,24,"#ede9fe");x.fillStyle="#5b21b6";x.font="900 30px sans-serif";x.fillText("🛣️  YOUR VISUAL CAREER ROADMAP",800,y+58);y+=125;
 if(rm){
   roundRect(115,y,630,120,24,"#dbeafe");roundRect(855,y,630,120,24,"#fef3c7");
   x.fillStyle="#1d4ed8";x.font="900 24px sans-serif";x.fillText("📍 YOU ARE HERE",430,y+38);x.fillStyle="#111827";x.font="800 30px sans-serif";x.fillText(rm.current_stage||getCurrentStage(),430,y+82);
   x.fillStyle="#b45309";x.font="900 24px sans-serif";x.fillText("🏆 DREAM GOAL",1170,y+38);x.fillStyle="#111827";x.font="800 30px sans-serif";x.fillText(rm.goal||selected,1170,y+82);y+=150;
   const cards=(rm.steps||[]).slice(0,6);const cardH=155;
   const fills=["#eff6ff","#ecfdf5","#f5f3ff","#fff7ed","#fefce8","#fdf2f8"];
   for(let i=0;i<cards.length;i++){const s=cards[i];roundRect(145,y,1310,cardH,26,fills[i%fills.length]);x.textAlign="left";x.fillStyle="#312e81";x.font="900 30px sans-serif";x.fillText((s.icon||"➡️")+"  "+(i+1)+". "+(s.title||"Step"),185,y+48);x.fillStyle="#374151";x.font="600 25px sans-serif";let ly=y+88;for(const line of wrap(s.description||"",1180,"600 25px sans-serif",36,2)){x.fillText(line,185,ly);ly+=36}x.textAlign="center";y+=cardH+18}
   roundRect(145,y,1310,145,28,"#dcfce7");x.fillStyle="#166534";x.font="900 28px sans-serif";x.fillText("🔥 "+(uiLang==="en"?"MY NEXT STEP":"ఇప్పుడు నేను చేయాల్సిన పని"),800,y+45);x.font="700 25px sans-serif";let ny=y+86;for(const line of wrap(rm.next_action||"",1180,"700 25px sans-serif",36,2)){x.fillText(line,800,ny);ny+=36}y+=175;
 }else{
   x.fillStyle="#6b7280";x.font="700 28px sans-serif";x.fillText("Career roadmap కోసం Agentని అడగండి.",800,y+40);y+=80;
 }
 x.fillStyle="#5b21b6";x.font="900 28px sans-serif";x.fillText("🌐 naa-bhavishyathu-ai.vercel.app",800,2660);x.fillStyle="#6b7280";x.font="600 22px sans-serif";x.fillText("Created by Devarakonda Srinivasa Rao",800,2702);
 return await new Promise(r=>c.toBlob(r,"image/jpeg",.96));
}
document.querySelector("#download").onclick=async()=>{try{const b=await posterBlob(),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=(document.querySelector("#personName").value.trim()||"portrait")+"-"+(selected||"career")+".jpg";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}catch(e){alert(e.message)}};
document.querySelector("#print").onclick=async()=>{try{const b=await posterBlob(),u=URL.createObjectURL(b),w=window.open("","_blank");w.document.write('<html><head><title>A4 Print</title><style>@page{size:A4 portrait;margin:0}body{margin:0}img{width:210mm;height:297mm;object-fit:contain;display:block}</style></head><body><img src="'+u+'" onload="window.print()"></body></html>');w.document.close()}catch(e){alert(e.message)}};
document.querySelector("#share").onclick=async()=>{try{
 const b=await posterBlob();
 const file=new File([b],"naa-bhavishyathu-ai-career-roadmap.jpg",{type:"image/jpeg"});
 const siteUrl="https://naa-bhavishyathu-ai.vercel.app/";
 const role=document.querySelector("#role").textContent;
 const shareText=role+"\n\n✨ Naa Bhavishyathu AI\nమీ ఫోటోను మీ Dream Profession రూపంలో AI Portraitగా మార్చుకోండి.\n🌐 "+siteUrl;
 if(navigator.share&&navigator.canShare?.({files:[file]})){
   await navigator.share({title:"Naa Bhavishyathu AI",text:shareText,url:siteUrl,files:[file]});
 }else{
   const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="naa-bhavishyathu-ai-career-roadmap.jpg";a.click();
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
 document.querySelector('#stateLabel').textContent=t.state;const stageLabel=document.querySelector('#stageLabel');if(stageLabel)stageLabel.textContent=uiLang==='te'?'ప్రస్తుతం మీరు':'Current Stage';document.querySelector('#professionTitle').textContent=t.profession;
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
 const box=document.querySelector("#agentMessages");if(!box)return;
 const d=document.createElement("div");d.className="agent-bubble"+(isUser?" user":"");d.textContent=text;box.appendChild(d);box.scrollTop=box.scrollHeight;
}
document.querySelector("#askAgent")?.addEventListener("click",async()=>{
 const input=document.querySelector("#agentQuestion"),btn=document.querySelector("#askAgent");
 const question=input.value.trim();
 if(!selected)return alert(uiLang==="en"?"Choose your Dream Profession first.":"ముందుగా మీ Dream Profession ఎంచుకోండి.");
 if(!question)return alert(uiLang==="en"?"Ask one career question.":"Career Agentకి ఒక ప్రశ్న అడగండి.");
 addAgentBubble(question,true);input.value="";btn.disabled=true;btn.textContent=uiLang==="en"?"Creating roadmap…":"Roadmap తయారవుతోంది…";
 try{
   const rm=await loadCareerRoadmap(question);
   document.querySelector("#roadmapVisual")?.scrollIntoView({behavior:"smooth",block:"start"});
   const box=document.querySelector("#agentMessages");if(box)box.innerHTML='<div class="agent-bubble">'+(uiLang==="en"?"✅ Visual roadmap updated above.":"✅ Visual roadmap పైన update అయింది.")+'</div>';
 }catch(e){addAgentBubble((uiLang==="en"?"Career Agent error: ":"Career Agent error: ")+(e.message||"Please try again."));}
 finally{btn.disabled=false;btn.textContent=uiLang==="en"?"🤖 Ask":"🤖 అడగండి";}
});
document.querySelector("#agentQuestion")?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();document.querySelector("#askAgent")?.click();}});
