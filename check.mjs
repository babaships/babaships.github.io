// Crawl from sitemap + all internal links; verify 200s, asset links, sitemap XML, JSON-LD parses.
// Usage: SITE=https://<org>.github.io node check.mjs                          (root: server on 127.0.0.1:8080 serves dist/)
//        BASE=/<repo> SITE=https://<user>.github.io node check.mjs             (sub-path: server serves a folder holding <repo> -> dist)
// Lint: one <h1>; <title> <= 60 chars; the first thing after </h1> is <p class="lead"> of <= 150 chars (breadcrumb comes after it).
const O='http://127.0.0.1:8080';const BASE=(process.env.BASE||'').replace(/\/$/,'');
const SITE=(process.env.SITE||'').replace(/\/$/,'');const seen=new Set();const bad=[];
const q=['/','/sitemap.xml','/robots.txt','/favicon.ico','/about/','/zh/about/','/zh/privacy/','/zh/lessons/','/planner/','/planner/manifest.json','/planner/sw.js','/planner/icons/icon-192.png','/planner/icons/icon-512.png','/planner/icons/icon-180.png'].map(u=>BASE+u);
const inScope=u=>u===BASE||u.startsWith(BASE+'/');
while(q.length){const u=q.pop();if(seen.has(u))continue;seen.add(u);
 const r=await fetch(O+u);if(r.status!==200){bad.push(u+' '+r.status);continue}
 if(u.startsWith(BASE+'/planner/')){ // her app: only check it loads, is noindex, and robots.txt blocks it. No page-template lint.
  if(u===BASE+'/planner/'){const h=await r.text();if(!h.includes('name="robots" content="noindex'))bad.push('planner/index.html: needs noindex meta')}
  continue}
 const t=await r.text();
 if(u.endsWith('.xml')||u.endsWith('robots.txt')){
  if(u.endsWith('robots.txt')&&!t.includes('Disallow: '+BASE+'/planner/'))bad.push('robots.txt: missing Disallow for the planner');
  if(u.endsWith('.xml')&&t.includes('/planner'))bad.push('sitemap lists the planner');
  if(u.endsWith('.xml')&&(!t.startsWith('<?xml')||!t.includes('</urlset>')))bad.push('xml '+u);
  if(SITE)for(const m of t.matchAll(/https?:\/\/[^\s<"]+/g))if(!m[0].startsWith(SITE+BASE+'/')&&!m[0].startsWith('http://www.sitemaps.org')&&!m[0].startsWith('http://www.w3.org'))bad.push('wrong-origin '+u+' '+m[0]);
  // every sitemap <loc> must be fetchable
  for(const m of t.matchAll(/<loc>([^<]+)<\/loc>/g))q.push(new URL(m[1]).pathname);
  continue}
 if(!(r.headers.get('content-type')||'').includes('html'))continue;
 for(const m of t.matchAll(/(?:href|src)="(\/[^"#]*)"/g)){if(!inScope(m[1]))bad.push(u+' link outside base: '+m[1]);q.push(m[1])}
 if(SITE)for(const m of t.matchAll(/(?:href|content)="(https?:\/\/[^"]+)"/g))if(m[1].startsWith('http://127.0.0.1')||m[1].startsWith('http://localhost'))bad.push(u+' local url '+m[1]);
 if(SITE)for(const m of t.matchAll(/rel="(?:canonical|alternate)"[^>]*href="([^"]+)"/g))if(!m[1].startsWith(SITE+BASE+'/'))bad.push(u+' bad canonical/hreflang '+m[1]);
 for(const m of t.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)){try{JSON.parse(m[1])}catch{bad.push('jsonld '+u)}}
 if((t.match(/<h1>/g)||[]).length!==1)bad.push(u+' needs exactly one <h1>');
 const title=(t.match(/<title>(.*?)<\/title>/s)||[])[1];if(title&&[...title.replace(/&amp;|&quot;|&lt;/g,'x')].length>60)bad.push(u+' title over 60: '+title);
 const lead=(t.match(/<\/h1>\s*<p class="lead">(.*?)<\/p>/s)||[])[1];
 if(lead===undefined)bad.push(u+' no <p class="lead"> right after <h1>');else if([...lead.replace(/<[^>]+>/g,'').replace(/&amp;|&quot;|&lt;/g,'x')].length>150)bad.push(u+' lead over 150 chars');
 for(const k of ['<title>','rel="canonical"','og:title','name="description"','<h1>'])if(!t.includes(k))bad.push(u+' missing '+k)}
console.log('checked',seen.size,'urls; problems:',bad.length?bad:'none')
