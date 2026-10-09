export function acceptedRequestOrigins(req,configuredOrigin){
 const allowed=new Set([configuredOrigin,'https://games.upilinks.in']);
 const forwardedHost=String(req.headers['x-forwarded-host']||'').split(',')[0].trim();
 const host=forwardedHost||String(req.headers.host||'').trim();
 const forwardedProto=String(req.headers['x-forwarded-proto']||'').split(',')[0].trim().toLowerCase();
 const protocol=forwardedProto==='https'||forwardedProto==='http'?forwardedProto:req.socket.encrypted?'https':'http';
 // A forwarded host is controlled by the proxy; never trust it as an arbitrary origin.
 if(host&&!/[\s/@,]/.test(host)){try{const candidate=new URL(`${protocol}://${host}`).origin;if(candidate===configuredOrigin)allowed.add(candidate);}catch{}}
 return allowed;
}
