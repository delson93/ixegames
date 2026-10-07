export function acceptedRequestOrigins(req,configuredOrigin){
 const allowed=new Set([configuredOrigin]);
 const forwardedHost=String(req.headers['x-forwarded-host']||'').split(',')[0].trim();
 const host=forwardedHost||String(req.headers.host||'').trim();
 const forwardedProto=String(req.headers['x-forwarded-proto']||'').split(',')[0].trim().toLowerCase();
 const protocol=forwardedProto==='https'||forwardedProto==='http'?forwardedProto:req.socket.encrypted?'https':'http';
 if(host&&!/[\s/@,]/.test(host)){try{allowed.add(new URL(`${protocol}://${host}`).origin);}catch{}}
 return allowed;
}
