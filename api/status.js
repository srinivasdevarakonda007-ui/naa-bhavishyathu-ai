import {readEntitlement,writeEntitlement,publicEntitlement} from "./_entitlement.js";

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"GET only"});
  const state=readEntitlement(req);
  writeEntitlement(res,state);
  res.setHeader("Cache-Control","no-store");
  return res.status(200).json(publicEntitlement(state));
}
