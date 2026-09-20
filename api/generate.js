export const config = { api: { bodyParser: false } };

const prompts = {
  "Police Officer":"Transform the person into a dignified fictional professional police-officer career portrait. Generic clean uniform, no real department insignia, no official ID, no document. Preserve the person's identity, facial structure, skin tone, hairstyle and age as closely as possible.",
  "Lawyer":"Transform the person into a premium professional lawyer portrait in formal black advocate attire, elegant legal-office background. Preserve identity and natural facial features.",
  "Sports Teacher":"Transform the person into a confident professional physical education teacher portrait on a modern school sports ground, premium sportswear, whistle, tasteful athletic atmosphere. Preserve identity.",
  "Athlete":"Transform the person into an elite inspirational athlete portrait in a stadium, premium sports kit, dynamic but realistic. Preserve identity.",
  "Doctor":"Transform the person into a professional doctor career portrait with clean white coat and modern clinic background, no ID card or credential claims. Preserve identity.",
  "Teacher":"Transform the person into a warm professional teacher portrait in a modern classroom. Preserve identity.",
  "Scientist":"Transform the person into a professional scientist portrait in a modern research laboratory. Preserve identity.",
  "Pilot":"Transform the person into a fictional commercial pilot career portrait in a premium aviation setting, generic uniform with no real airline insignia. Preserve identity.",
  "Army Officer":"Transform the person into a fictional inspirational military career portrait, generic ceremonial uniform with no real unit insignia, no official credential. Preserve identity.",
  "Chef":"Transform the person into a premium professional chef portrait in a modern restaurant kitchen. Preserve identity.",
  "Entrepreneur":"Transform the person into a successful modern entrepreneur portrait in an elegant office. Preserve identity.",
  "Engineer":"Transform the person into a professional engineer portrait in a modern technology workspace. Preserve identity."
};

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"Server API key is not configured."});
  try{
    const chunks=[]; for await(const chunk of req) chunks.push(chunk);
    const raw=Buffer.concat(chunks);
    const ct=req.headers["content-type"]||"";
    const boundary=ct.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.slice(1).find(Boolean);
    if(!boundary) return res.status(400).json({error:"Invalid upload."});
    const bin=raw.toString("binary");
    const parts=bin.split("--"+boundary);
    let image=null, profession="", country="India", state="Andhra Pradesh";
    for(const part of parts){
      const split=part.indexOf("\r\n\r\n"); if(split<0) continue;
      const head=part.slice(0,split), body=part.slice(split+4,-2);
      const name=head.match(/name="([^"]+)"/)?.[1];
      if(name==="profession") profession=Buffer.from(body,"binary").toString("utf8");
      if(name==="country") country=Buffer.from(body,"binary").toString("utf8");
      if(name==="state") state=Buffer.from(body,"binary").toString("utf8");
      if(name==="image"){const filename=head.match(/filename="([^"]*)"/)?.[1]||"portrait.jpg"; const type=head.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]||"image/jpeg"; image={filename,type,data:Buffer.from(body,"binary")};}
    }
    if(!image||!profession) return res.status(400).json({error:"Photo and profession are required."});
    if(image.data.length>8*1024*1024) return res.status(413).json({error:"Photo is too large. Please use an image under 8 MB."});
    const form=new FormData();
    form.append("model","gpt-image-2");
    form.append("prompt",(prompts[profession]||prompts["Entrepreneur"])+" Location context: "+country+(country==="India"?", "+state:"")+". Photorealistic premium studio quality, natural skin texture, realistic proportions, vertical portrait composition. Do not add text to the image.");
    form.append("size","1024x1536");
    form.append("quality","medium");
    form.append("image",new Blob([image.data],{type:image.type}),image.filename);
    const r=await fetch("https://api.openai.com/v1/images/edits",{method:"POST",headers:{Authorization:"Bearer "+process.env.OPENAI_API_KEY},body:form});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data?.error?.message||"AI generation failed."});
    const b64=data?.data?.[0]?.b64_json;
    if(!b64) return res.status(502).json({error:"No image returned."});
    res.status(200).json({image:"data:image/png;base64,"+b64});
  }catch(e){res.status(500).json({error:e?.message||"Unexpected server error."});}
}