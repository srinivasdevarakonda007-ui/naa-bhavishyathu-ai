import crypto from "crypto";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST only"});
  const secret=String(process.env.RAZORPAY_KEY_SECRET||"").trim();
  if(!secret) return res.status(503).json({error:"Payments are not configured yet."});
  const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body||{};
  if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature) return res.status(400).json({error:"Incomplete payment response."});
  const expected=crypto.createHmac("sha256",secret).update(razorpay_order_id+"|"+razorpay_payment_id).digest("hex");
  const a=Buffer.from(expected), b=Buffer.from(String(razorpay_signature));
  const valid=a.length===b.length&&crypto.timingSafeEqual(a,b);
  if(!valid) return res.status(400).json({error:"Payment verification failed."});
  return res.status(200).json({verified:true,paymentId:razorpay_payment_id});
}