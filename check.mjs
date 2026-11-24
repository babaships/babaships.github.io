// Crawl from sitemap + all internal links; verify 200s, asset links, sitemap XML, JSON-LD parses.
// Usage: BASE=/kids-ai-build SITE=https://lambertbin.github.io node check.mjs   (server on 127.0.0.1:8080 serving dist under BASE)
const O='http://127.0.0.1:8080';const BASE=(process.env.BASE||'').replace(/\/$/,'');
const SITE=(process.env.SITE||'').replace(/\/$/,'');const seen=new Set();const bad=[];
const q=['/','/sitemap.xml','/robots.txt','/favicon.ico','/about/','/zh/about/','/zh/privacy/','/zh/lessons/'].map(u=>BASE+u);
const inScope=u=>u===BASE||u.startsWith(BASE+'/');
while(q.length){const u=q.pop();if(seen.has(u))continue;seen.add(u);
 const r=await fetch(O+u);if(r.status!==200){bad.push(u+' '+r.status);continue}
 const t=await r.text();
 if(u.endsWith('.xml')||u.endsWith('robots.txt')){
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
 for(const k of ['<title>','rel="canonical"','og:title','name="description"','<h1>'])if(!t.includes(k))bad.push(u+' missing '+k)}
console.log('checked',seen.size,'urls; problems:',bad.length?bad:'none')
