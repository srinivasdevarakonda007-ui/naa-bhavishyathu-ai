import crypto from "crypto";

const COOKIE_NAME = "nbai_entitlement";
const MAX_AGE = 60 * 60 * 24 * 365;

function signingSecret(){
  return String(process.env.ENTITLEMENT_SECRET || process.env.RAZORPAY_KEY_SECRET || "").trim();
}
function b64url(input){
  return Buffer.from(input).toString("base64url");
}
function unb64url(input){
  return Buffer.from(input,"base64url").toString("utf8");
}
function sign(payload){
  return crypto.createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}
function safeEqual(a,b){
  const aa=Buffer.from(String(a)), bb=Buffer.from(String(b));
  return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
function freshState(){
  return {v:1,sid:crypto.randomUUID(),freeUsed:false,credits:0,paymentIds:[]};
}
function sanitize(s){
  return {
    v:1,
    sid:typeof s?.sid==="string"&&s.sid.length>10?s.sid:crypto.randomUUID(),
    freeUsed:Boolean(s?.freeUsed),
    credits:Number.isInteger(s?.credits)?Math.max(0,Math.min(20,s.credits)):0,
    paymentIds:Array.isArray(s?.paymentIds)?s.paymentIds.filter(x=>typeof x==="string").slice(-12):[]
  };
}
export function readEntitlement(req){
  const secret=signingSecret();
  if(!secret) return freshState();
  const cookie=String(req.headers.cookie||"").split(";").map(x=>x.trim()).find(x=>x.startsWith(COOKIE_NAME+"="));
  if(!cookie) return freshState();
  try{
    const token=decodeURIComponent(cookie.slice(COOKIE_NAME.length+1));
    const [payload,sig]=token.split(".");
    if(!payload||!sig||!safeEqual(sign(payload),sig)) return freshState();
    return sanitize(JSON.parse(unb64url(payload)));
  }catch{return freshState();}
}
export function writeEntitlement(res,state){
  if(!signingSecret()) return;
  const clean=sanitize(state);
  const payload=b64url(JSON.stringify(clean));
  const token=payload+"."+sign(payload);
  res.setHeader("Set-Cookie",`${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
}
export function publicEntitlement(state){
  const s=sanitize(state);
  return {freeAvailable:!s.freeUsed,credits:s.credits,pricePerPortrait:20};
}
