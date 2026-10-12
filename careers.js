const extraCareers=[
  ["🗳️","Public Representative"],["⚓","Navy Officer"],["🛩️","Air Force Officer"],["👩‍⚕️","Nurse"],
  ["💊","Pharmacist"],["🧑‍💻","Software Developer"],["🏗️","Civil Engineer"],["📊","Chartered Accountant"],
  ["🏦","Banker"],["📰","Journalist"],["🌾","Farmer / Agri Entrepreneur"],["🌳","Forest Officer"],
  ["🚒","Fire & Rescue Officer"],["🤝","Social Worker"],["🎨","Artist / Designer"],["🎥","Content Creator"]
];

(function(){
  const grid=document.querySelector("#jobs");
  if(!grid)return;
  const buttons=[];
  extraCareers.forEach(([icon,name])=>{
    const b=document.createElement("button");
    b.className="job extra-career";
    b.hidden=true;
    b.innerHTML="<span>"+icon+"</span><b>"+name+"</b>";
    b.onclick=()=>{
      document.querySelectorAll(".job").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      selected=name;
      const agentStatus=document.querySelector("#agentStatus");
      if(agentStatus){
        agentStatus.textContent="✅ "+name+" ఎంపికైంది — ఇప్పుడు మీ ప్రశ్న టైప్ చేయండి.";
        agentStatus.classList.add("ready");
      }
      document.querySelector("#agentQuestion")?.focus();
      document.querySelector("#role").textContent=(document.querySelector("#personName")?.value.trim()||"నా కల")+" — "+name;
    };
    grid.appendChild(b);
    buttons.push(b);
  });

  const toggle=document.createElement("button");
  toggle.type="button";
  toggle.className="secondary";
  toggle.style.marginTop="14px";
  toggle.style.width="100%";
  toggle.dataset.open="0";

  function isEnglish(){return document.querySelector("#lang")?.textContent.startsWith("EN");}
  function updateLabel(){
    const open=toggle.dataset.open==="1";
    toggle.textContent=isEnglish()?(open?"− Show Fewer Careers":"＋ More Careers"):(open?"− తక్కువ Careers చూపించండి":"＋ మరిన్ని Careers చూడండి");
  }
  toggle.onclick=()=>{
    const open=toggle.dataset.open!=="1";
    toggle.dataset.open=open?"1":"0";
    buttons.forEach(b=>b.hidden=!open);
    updateLabel();
  };
  grid.insertAdjacentElement("afterend",toggle);
  document.querySelector("#lang")?.addEventListener("click",updateLabel);
  updateLabel();
})();
