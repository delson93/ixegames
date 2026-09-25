import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {loadSettings,saveSettings,validate} from './src/settings.js';
import {layout,home,gamePage,adminPage,contentPage,activeGames,esc} from './src/views.js';
const root=path.dirname(fileURLToPath(import.meta.url));
const dataDir=path.resolve(process.env.DATA_DIR||path.join(root,'data'));
const origin=new URL(process.env.SITE_URL||'http://localhost:3000').origin;
const secure=process.env.COOKIE_SECURE==='true';
if(process.env.CMP_SCRIPT_URL && new URL(process.env.CMP_SCRIPT_URL).protocol!=='https:')throw Error('CMP_SCRIPT_URL must use HTTPS.');
if(process.env.NODE_ENV==='production'&&(!secure||!origin.startsWith('https://')||!process.env.ADMIN_PASSWORD_HASH))throw Error('Production requires HTTPS SITE_URL, COOKIE_SECURE=true and ADMIN_PASSWORD_HASH.');
let settings=await loadSettings(dataDir);
const sessions=new Map(), attempts=new Map();
const sessionAge=8*60*60*1000;
const cleanup=setInterval(()=>{const now=Date.now();for(const [k,v]of sessions)if(v.expires<now)sessions.delete(k);for(const[k,v]of attempts)if(v.until<now)attempts.delete(k);},60000);cleanup.unref();
export function verifyPassword(password,hash){try{const [salt,expected]=hash.split(':');if(!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(expected))return false;const actual=scryptSync(password,salt,64);return timingSafeEqual(actual,Buffer.from(expected,'hex'));}catch{return false;}}
async function form(req){let body='';for await(const c of req){body+=c;if(Buffer.byteLength(body)>16384)throw Object.assign(Error('Request too large'),{status:413});}return Object.fromEntries(new URLSearchParams(body));}
const types={'.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png'};
const files=new Set(['style.css','app.js','games.js','engine.js','tank.svg','snake.svg','hero.svg','favicon.svg','social.svg','social.png']);
function cookie(value,maxAge){return `ixe_session=${value}; HttpOnly; SameSite=Strict; Path=/admin; Max-Age=${maxAge}${secure?'; Secure':''}`;}
export const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,origin), p=url.pathname;
 const csp="default-src 'self'; script-src 'self' 'unsafe-inline' https://*.googlesyndication.com https://*.google.com https://*.gstatic.com https://*.googleadservices.com https://*.doubleclick.net"+(process.env.CMP_SCRIPT_URL?' '+new URL(process.env.CMP_SCRIPT_URL).origin:'')+"; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-src https:; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'";
 res.setHeader('Content-Security-Policy',csp);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
 if(secure)res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
 const send=(status,body,type='text/html; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type});res.end(req.method==='HEAD'?'':body);};
 const redirect=to=>{res.writeHead(303,{Location:to});res.end();};
 const page=(title,body,status=200,opts={})=>send(status,layout(settings,{title,description:opts.description||`${title}. Free browser games, useful guides, and information from ixegames.`,path:p,origin,body,...opts}));
 try{
 if(p.startsWith('/admin')){res.setHeader('Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');}
 else res.setHeader('Cache-Control','no-cache');
 if(req.method==='GET'||req.method==='HEAD'){
 if(files.has(p.slice(1))){res.setHeader('Cache-Control','public, max-age=3600');return send(200,await readFile(path.join(root,'public',p.slice(1))),types[path.extname(p)]);}
 if(p==='/healthz')return send(200,'ok','text/plain');
 if(p==='/robots.txt')return send(200,`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`,'text/plain');
 if(p==='/ads.txt')return send(200,settings.publisherId?`google.com, ${settings.publisherId.replace('ca-','')}, DIRECT, f08c47fec0942fa0\n`:'# No authorized Google seller configured.\n','text/plain');
 if(p==='/sitemap.xml'){const paths=['/','/about','/contact','/privacy','/terms','/cookies','/accessibility',...activeGames(settings).map(g=>'/games/'+g.id)];return send(200,`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(x=>`<url><loc>${esc(origin+x)}</loc></url>`).join('')}</urlset>`,'application/xml');}
 if(p==='/api/ad-config')return send(200,JSON.stringify({enabled:settings.adsEnabled,publisherId:settings.publisherId,cmpUrl:settings.adsEnabled?process.env.CMP_SCRIPT_URL||'':''}),'application/json');
 if(p==='/')return page('Free online arcade games',home(settings),200,{ads:true,description:'Play Tank Arena and Neon Snake free on ixegames. Instant browser games with keyboard and touch controls. No downloads or player accounts.'});
 const g=activeGames(settings).find(g=>p==='/games/'+g.id);if(g)return page(`${g.name} - Play free online`,gamePage(g),200,{game:true,ads:true,description:g.description});
 const content=contentPage(settings,p);if(content)return page(content.title,content.body);
 }
 const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('ixe_session='))?.slice(12);
 const session=sessions.get(token);const authenticated=session&&session.expires>Date.now();
 if(p==='/admin'&&(req.method==='GET'||req.method==='HEAD')){
 if(authenticated)return page('Admin dashboard',adminPage(settings,session.csrf,url.searchParams.has('saved')?'Settings saved successfully.':''),200,{noindex:true});
 const configured=!!process.env.ADMIN_PASSWORD_HASH;
 return page('Admin sign in',`<section class="login"><span class="eyebrow purple-text">IXEGAMES / CONTROL ROOM</span><h1>Welcome back.</h1><p>${configured?'Sign in to manage your arcade.':'Administrator access is locked. Set ADMIN_PASSWORD_HASH on the server to enable sign-in.'}</p>${configured?'<form method="post" action="/admin/login"><label>Administrator password<input type="password" name="password" required autocomplete="current-password" maxlength="256"></label><button class="button">Sign in ↗</button></form>':''}</section>`,200,{noindex:true});
 }
 if(req.method==='POST'&&p.startsWith('/admin/')){
 if(req.headers.origin!==origin)return send(403,'Invalid request origin','text/plain');
 if(!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded'))return send(415,'Unsupported content type','text/plain');
 const data=await form(req);
 if(p==='/admin/login'){
 const ip=req.socket.remoteAddress;const a=attempts.get(ip);if(a&&a.until>Date.now()&&a.count>=5)return send(429,'Too many attempts. Try again in 15 minutes.','text/plain');
 if(!process.env.ADMIN_PASSWORD_HASH)return send(503,'Admin not configured','text/plain');
 if(!verifyPassword(String(data.password||'').slice(0,256),process.env.ADMIN_PASSWORD_HASH)){attempts.set(ip,{count:(a?.until>Date.now()?a.count:0)+1,until:Date.now()+900000});return page('Sign in failed','<section class="prose"><h1>Unable to sign in.</h1><p>Check your password and try again.</p><a class="button" href="/admin">Try again</a></section>',401,{noindex:true});}
 attempts.delete(ip);if(token)sessions.delete(token);const id=randomBytes(32).toString('hex');sessions.set(id,{csrf:randomBytes(32).toString('hex'),expires:Date.now()+sessionAge});res.setHeader('Set-Cookie',cookie(id,sessionAge/1000));return redirect('/admin');
 }
 if(!authenticated)return send(401,'Sign in required','text/plain');
 if(data.csrf!==session.csrf)return send(403,'Invalid CSRF token','text/plain');
 if(p==='/admin/logout'){sessions.delete(token);res.setHeader('Set-Cookie',cookie('',0));return redirect('/admin');}
 if(p==='/admin/settings'){try{const next=validate(data);if(next.adsEnabled&&!process.env.CMP_SCRIPT_URL)throw Error('Set CMP_SCRIPT_URL before enabling Google ads.');await saveSettings(dataDir,next);settings=next;return redirect('/admin?saved=1');}catch(e){return page('Admin dashboard',adminPage({...settings,...data},session.csrf,e.message),400,{noindex:true});}}
 }
 if(!['GET','HEAD','POST'].includes(req.method))return send(405,'Method not allowed','text/plain');
 return page('Page not found','<section class="prose"><span class="eyebrow purple-text">404 / OUT OF BOUNDS</span><h1>This level does not exist.</h1><p>Let’s get you back to something playable.</p><a class="button" href="/">Back to the arcade ↗</a></section>',404,{noindex:true});
 }catch(e){console.error(e.message);return send(e.status||500,'Unable to complete request. Please try again.','text/plain');}
});
if(process.argv[1]===fileURLToPath(import.meta.url))server.listen(Number(process.env.PORT||3000),process.env.HOST||'0.0.0.0',()=>console.log(`ixegames running at ${origin}`));
