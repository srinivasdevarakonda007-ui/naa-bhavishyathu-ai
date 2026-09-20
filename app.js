const jobs=[["👮","Police Officer"],["🇮🇳","IAS Officer"],["⚖️","Lawyer"],["🏅","Sports Teacher"],["🏃","Athlete"],["🩺","Doctor"],["👩‍🏫","Teacher"],["🔬","Scientist"],["✈️","Pilot"],["🪖","Army Officer"],["👨‍🍳","Chef"],["💼","Entrepreneur"],["💻","Engineer"]];let selected="";const grid=document.querySelector("#jobs");jobs.forEach(([icon,name])=>{const b=document.createElement("button");b.className="job";b.innerHTML="<span>"+icon+"</span><b>"+name+"</b>";b.onclick=()=>{document.querySelectorAll(".job").forEach(x=>x.classList.remove("active"));b.classList.add("active");selected=name;document.querySelector("#role").textContent=(document.querySelector("#personName")?.value.trim()||"నా కల")+" — "+name};grid.appendChild(b)});document.querySelector("#photo").onchange=e=>{const f=e.target.files[0];if(!f)return;const url=URL.createObjectURL(f);document.querySelector("#preview").innerHTML='<img src="'+url+'" alt="preview">';document.querySelector("#poster").querySelector(".placeholder")?.remove();let img=document.querySelector("#poster img");if(!img){img=document.createElement("img");document.querySelector("#poster").prepend(img)}img.src=url};
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
     alert("Story వచ్చింది, కానీ portrait generationలో సమస్య: "+imageResult.reason.message);
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
