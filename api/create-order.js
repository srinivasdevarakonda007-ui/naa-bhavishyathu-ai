const APPROVED_HOST="naa-bhavishyathu-ai.vercel.app";
function validHost(req){return String(req.headers["x-forwarded-host"]||req.headers.host||"").split(",")[0].trim()===APPROVED_HOST;}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  if(!validHost(req)) return res.status(403).json({error:"Payments are available only on the official Naa Bhavishyathu AI website."});
  const key=String(process.env.RAZORPAY_KEY_ID||"").trim(), secret=String(process.env.RAZORPAY_KEY_SECRET||"").trim();
  const amount=2000;
  if(!key||!secret||!Number.isInteger(amount)||amount<100) return res.status(503).json({error:"Payments are not configured yet."});
  try{
    const auth=Buffer.from(key+":"+secret).toString("base64");
    const r=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{"Authorization":"Basic "+auth,"Content-Type":"application/json"},body:JSON.stringify({amount,currency:"INR",receipt:"nbai_"+Date.now(),notes:{product:"Naa Bhavishyathu AI — 1 extra portrait credit",website:"https://naa-bhavishyathu-ai.vercel.app"}})});
    const data=await r.json();
    if(!r.ok){const msg=data?.error?.description||"Could not create payment order.";return res.status(r.status).json({error:/auth/i.test(msg)?"Razorpay authentication failed. Please verify the live Key ID and Key Secret in Vercel Production environment.":msg});}
    return res.status(200).json({orderId:data.id,amount:data.amount,currency:data.currency,key});
  }catch(e){return res.status(500).json({error:"Payment service unavailable."});}
}
