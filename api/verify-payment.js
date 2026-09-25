import crypto from "crypto";
import {readEntitlement,writeEntitlement,publicEntitlement} from "./_entitlement.js";

const APPROVED_HOST="naa-bhavishyathu-ai.vercel.app";
const usedPayments = globalThis.__nbaiUsedPayments || (globalThis.__nbaiUsedPayments = new Set());
function validHost(req){return String(req.headers["x-forwarded-host"]||req.headers.host||"").split(",")[0].trim()===APPROVED_HOST;}
async function razorpayGet(path,key,secret){
  const auth=Buffer.from(key+":"+secret).toString("base64");
  const r=await fetch("https://api.razorpay.com/v1/"+path,{headers:{Authorization:"Basic "+auth}});
  const data=await r.json().catch(()=>({}));
  return {r,data};
}

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  if(!validHost(req)) return res.status(403).json({error:"Payment verification is available only on the official website."});
  const key=String(process.env.RAZORPAY_KEY_ID||"").trim();
  const secret=String(process.env.RAZORPAY_KEY_SECRET||"").trim();
  if(!key||!secret) return res.status(503).json({error:"Payments are not configured yet."});

  const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body||{};
  if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature) return res.status(400).json({error:"Incomplete payment response."});

  const expected=crypto.createHmac("sha256",secret).update(razorpay_order_id+"|"+razorpay_payment_id).digest("hex");
  const a=Buffer.from(expected), b=Buffer.from(String(razorpay_signature));
  const valid=a.length===b.length&&crypto.timingSafeEqual(a,b);
  if(!valid) return res.status(400).json({error:"Payment verification failed."});

  try{
    const [{r:pr,data:payment},{r:or,data:order}]=await Promise.all([
      razorpayGet("payments/"+encodeURIComponent(razorpay_payment_id),key,secret),
      razorpayGet("orders/"+encodeURIComponent(razorpay_order_id),key,secret)
    ]);
    if(!pr.ok||!or.ok) return res.status(502).json({error:"Could not confirm payment with Razorpay."});
    const correct=payment?.order_id===razorpay_order_id && payment?.amount===2000 && order?.amount===2000 && payment?.currency==="INR" && order?.currency==="INR";
    const successful=payment?.status==="captured" || payment?.status==="authorized";
    if(!correct||!successful) return res.status(400).json({error:"Payment details could not be validated."});

    const state=readEntitlement(req);
    const already=state.paymentIds.includes(razorpay_payment_id) || usedPayments.has(razorpay_payment_id);
    if(!already){
      state.credits=Math.min(20,state.credits+1);
      state.paymentIds=[...state.paymentIds,razorpay_payment_id].slice(-12);
      usedPayments.add(razorpay_payment_id);
    }
    writeEntitlement(res,state);
    res.setHeader("Cache-Control","no-store");
    return res.status(200).json({verified:true,credited:!already,paymentId:razorpay_payment_id,...publicEntitlement(state)});
  }catch(e){
    return res.status(500).json({error:"Payment verification service temporarily unavailable."});
  }
}
