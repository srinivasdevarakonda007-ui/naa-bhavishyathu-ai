const jobs=[["👮","Police Officer"],["🏛️","IAS Officer"],["⚖️","Lawyer"],["🏅","Sports Teacher"],["🏃","Athlete"],["🩺","Doctor"],["👩‍🏫","Teacher"],["🔬","Scientist"],["✈️","Pilot"],["🪖","Army Officer"],["👨‍🍳","Chef"],["💼","Entrepreneur"],["💻","Engineer"]];let selected="";const grid=document.querySelector("#jobs");jobs.forEach(([icon,name])=>{const b=document.createElement("button");b.className="job";b.innerHTML="<span>"+icon+"</span><b>"+name+"</b>";b.onclick=()=>{document.querySelectorAll(".job").forEach(x=>x.classList.remove("active"));b.classList.add("active");selected=name;document.querySelector("#role").textContent=(document.querySelector("#personName")?.value.trim()||"నా కల")+" — "+name};grid.appendChild(b)});document.querySelector("#photo").onchange=e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f);document.querySelector("#preview").innerHTML='<img src="'+url+'" alt="preview">';document.querySelector("#poster").querySelector(".placeholder")?.remove();let img=document.querySelector("#poster img");if(!img){img=document.createElement("img");document.querySelector("#poster").prepend(img)}img.src=url};
document.querySelector("#generate").onclick=async()=>{
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
   }else{
     const rawMsg=String(imageResult.reason?.message||"");
     const safeMsg=/safety|rejected|policy/i.test(rawMsg)
       ?"ఈ ఫోటోతో AI portrait తయారు చేయలేకపోయింది. ఇది మీ తప్పు కాదు; AI image safety check వల్ల ఈ ఫోటో process కాలేదు. మరో clear front-facing photoతో ప్రయత్నించండి."
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
document.querySelector("#share").onclick=async()=>{try{const b=await posterBlob(),file=new File([b],"naa-bhavishyathu-ai.jpg",{type:"image/jpeg"});if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({title:document.querySelector("#role").textContent,text:"Naa Bhavishyathu AI — నా Dream Career Portrait",files:[file]})}else{window.open("https://wa.me/?text="+encodeURIComponent(document.querySelector("#role").textContent+" — Naa Bhavishyathu AI"),"_blank")}}catch(e){if(e.name!=="AbortError")alert(e.message)}};



const uiText={
 te:{heroTitle:'మీ ఫోటో. మీ కల.<br><em>మీ భవిష్యత్తు.</em>',heroText:'మీ ఫోటోను మీ Dream Profession రూపంలో AI portraitగా మార్చండి. మీ పేరుతో చిన్న తెలుగు inspirational message కూడా పొందండి.',upload:'📷 ఫోటో ఎంచుకోండి',details:'మీ వివరాలు',name:'మీ పేరు',country:'దేశం',state:'రాష్ట్రం',profession:'మీ Dream Profession ఎంచుకోండి',create:'మీ Future Portrait తయారు చేయండి',createText:'Photo + Name + Profession సిద్ధంగా ఉంటే Generate నొక్కండి.',generate:'✨ AI Portrait తయారు చేయండి',result:'మీ Dream Portrait'},
 en:{heroTitle:'Your Photo. Your Dream.<br><em>Your Future.</em>',heroText:'Turn your photo into a premium AI dream-career portrait and get a short inspirational message with your name.',upload:'📷 Choose Photo',details:'Your Details',name:'Your Name',country:'Country',state:'State',profession:'Choose Your Dream Profession',create:'Create Your Future Portrait',createText:'When your photo, name and profession are ready, press Generate.',generate:'✨ Create AI Portrait',result:'Your Dream Portrait'}
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
});
async function startRazorpayPayment(){
 const btn=document.querySelector("#payBtn"); if(btn)btn.disabled=true;
 try{
  const r=await fetch("/api/create-order",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
  const o=await r.json(); if(!r.ok)throw new Error(o.error||"Payment unavailable");
  if(!window.Razorpay)throw new Error("Checkout unavailable");
  new Razorpay({key:o.key,amount:o.amount,currency:o.currency,name:"Naa Bhavishyathu AI",description:"Extra AI Portrait Access",order_id:o.orderId,
   handler:async function(p){
    const vr=await fetch("/api/verify-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
    const v=await vr.json();
    if(vr.ok&&v.verified){alert("Payment successful ✅");document.querySelector("#paymentBox").hidden=true;}
    else alert("Payment verification failed. Please contact support.");
   },theme:{color:"#6d28d9"}}).open();
 }catch(e){alert(e.message||"Payment service unavailable.");}
 finally{if(btn)btn.disabled=false;}
}
document.querySelector("#payBtn")?.addEventListener("click",startRazorpayPayment);
