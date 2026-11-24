// Zero-dependency static builder. Usage: SITE_URL=https://user.github.io/repo/ node build.mjs
import { mkdirSync, writeFileSync, copyFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

// One variable drives everything: SITE_URL may include a sub-path (project site). Origin and BASE are derived from it.
const U = new URL(process.env.SITE_URL || 'https://lambertbin.github.io/kids-ai-build/'); // TODO: swap for a custom domain later
const SITE_URL = U.origin;
const BASE = U.pathname.replace(/\/$/, ''); // '' at a domain root; '/kids-ai-build' for the project site
const SITE_NAME = 'Capy Planner'; // TODO: confirm brand name
const AUTHOR = 'Dad (TODO: name or handle)'; // no child info, ever
const DATE = '2026-11-24'; // TODO: set per article when published
const OUT = 'dist';
const FILL = (n, what) => `<aside class="fill"><strong>[FILL FROM SESSION ${n}]</strong> ${what}</aside>`;
const T = {
  en: { lang: 'en', home: 'Home', about: 'About', lessons: 'Lessons', privacy: 'Privacy', switch: '中文', foot: 'A parent-run project. No child photos, names, school or exact location are published.' },
  zh: { lang: 'zh-Hans', home: '首页', about: '关于', lessons: '课程', privacy: '隐私', switch: 'English', foot: '家长自办项目。不公开孩子的照片、姓名、学校或具体位置。' },
};
const waitlist = (l) => l === 'en' ? `<section id="waitlist" class="box"><h2>Course waitlist</h2>
<p>Free files come first. Join the list to hear when the full course opens. Email only, no spam.</p>
<!-- TODO: replace action with the real form endpoint (Formspree, Buttondown, Google Form). No third-party script is loaded. -->
<form action="TODO-FORM-ACTION" method="post"><label for="e">Email</label><input id="e" name="email" type="email" required>
<label for="w">Where did you find us?</label><select id="w" name="source"><option>YouTube</option><option>小红书</option><option>Google</option><option>AI chat</option></select>
<p><button type="submit">Join the waitlist</button></p></form></section>` : `<section id="waitlist" class="box"><h2>课程候补名单</h2>
<p>免费文件先发。留下邮箱，完整课程开放时通知你。只用邮箱，不发垃圾邮件。</p>
<!-- TODO: 替换 action 为真实表单地址。不加载任何第三方脚本。 -->
<form action="TODO-FORM-ACTION" method="post"><label for="e">邮箱</label><input id="e" name="email" type="email" required>
<label for="w">你从哪里找到我们？</label><select id="w" name="source"><option>YouTube</option><option>小红书</option><option>Google</option><option>AI 对话</option></select>
<p><button type="submit">加入候补名单</button></p></form></section>`;

const art = (n, q, answer, blocks) => `<p>${answer}</p>${blocks.map(([h, f]) => `<h2>${h}</h2>${FILL(n, f)}`).join('')}
<h2>Next</h2><p><a href="${BASE}/lessons/">All lessons</a></p>${waitlist('en')}`;

const pages = [
  { path: '/', lang: 'en', alt: '/zh/', title: 'Vibe coding for kids: a 10-year-old builds her own holiday planner', desc: 'A parent documents how his 10-year-old builds a holiday planner app with AI, one lesson at a time. Free files and a course waitlist.', h1: 'Vibe coding for kids: she talks, AI builds, we learn',
    body: `<p>My 10-year-old is building her own holiday planner app with AI. I film each lesson, keep her prompts word for word, and share the free files here.</p>
<p>This site is for parents who want their kids to build, not just watch. No faces, no names, no school, nothing finer than "Australia".</p>
<ul><li><a href="${BASE}/lessons/">Read the lessons</a></li><li><a href="${BASE}/about/">Who writes this</a></li></ul>${waitlist('en')}` },
  { path: '/about/', lang: 'en', alt: '/zh/about/', title: 'About: a developer dad and a kid-built planner app', desc: 'Who writes this site, why we build, and what we never publish about our child.', h1: 'About',
    crumbs: [['About', '/about/']],
    body: `<p>I am a software developer in Australia with 11 years at AWS, now working as a consultant on banking chatbots. This site is my side project with my daughter.</p>
<h2>The build story</h2>${FILL(0, 'Two or three true sentences: why you started, what she wanted the planner to do. No names.')}
<h2>What we never publish</h2><p>Her face, full name, school, or any location finer than "Australia". See <a href="${BASE}/privacy/">Privacy</a>.</p>` },
  { path: '/privacy/', lang: 'en', alt: '/zh/privacy/', title: 'Privacy: what this site collects and what we keep off it', desc: 'No cookies, no third-party scripts on this site. How the waitlist email is used. What we never publish about our child.', h1: 'Privacy',
    crumbs: [['Privacy', '/privacy/']],
    body: `<p>This site sets no cookies and loads no third-party scripts. <em>TODO: update this line if analytics is added.</em></p>
<h2>Waitlist</h2><p>Your email is used only to tell you about the course and free files. <em>TODO: name the form provider and how to unsubscribe.</em></p>
<h2>Our child</h2><p>No face, full name, school or exact location is published. Demo data only in screen recordings.</p>
<h2>Contact</h2><p>TODO: contact email.</p>` },
  { path: '/lessons/', lang: 'en', alt: '/zh/lessons/', title: 'Lessons: building a kid\'s planner app with AI', desc: 'Index of lessons from a 10-year-old\'s holiday planner build, with free files and prompts.', h1: 'Lessons',
    crumbs: [['Lessons', '/lessons/']],
    body: `<p>Each lesson is one real session, with her prompts and the files we used. Pages marked <em>draft</em> are waiting for real footage.</p>
<ol><li><a href="${BASE}/lessons/can-a-kid-create-an-app/">Can a kid create an app? Her first app, exactly what she said</a> <em>(draft)</em></li>
<li><a href="${BASE}/lessons/can-kids-use-claude/">Can kids use Claude? She talks, dad types</a> <em>(draft)</em></li>
<li><a href="${BASE}/lessons/how-to-teach-ai-to-kids/">How to teach a child to talk to AI: the CAPY prompt card</a> <em>(draft)</em></li></ol>${waitlist('en')}` },
  { path: '/lessons/can-a-kid-create-an-app/', lang: 'en', article: true, title: 'Can a kid create an app? A 10-year-old\'s first app, word for word', desc: 'How a 10-year-old made a first working app with AI: her exact prompt, three tries, and the time it took.', h1: 'Can a kid create an app? Her first one, exactly what she said',
    crumbs: [['Lessons', '/lessons/'], ['Can a kid create an app?', '/lessons/can-a-kid-create-an-app/']],
    body: art(1, '', 'Yes, with help. In session 1 she described a planner out loud and AI built a first version. This page shows what she said and what came back. <em>TODO: replace with the real answer and number of minutes after filming.</em>', [
      ['Her prompt, word for word', 'Paste prompts/s1.md exactly. No tidying.'], ['The first messy result', 'Screenshot (no face, demo data only).'], ['Three tries', 'What changed between tries. Real count.'], ['How long it took', 'Real minutes from start to a working list.'], ['Video', 'Embed the YouTube episode plus a VideoObject JSON-LD block that matches the visible title.']]) },
  { path: '/lessons/can-kids-use-claude/', lang: 'en', article: true, title: 'Can kids use Claude? How we do it: she talks, dad types', desc: 'How our family uses an AI assistant with a 10-year-old: she speaks, a parent types, and we link each tool\'s own age rules.', h1: 'Can kids use Claude? How we do it',
    crumbs: [['Lessons', '/lessons/'], ['Can kids use Claude?', '/lessons/can-kids-use-claude/']],
    body: art(1, '', 'Check the tool\'s own age rules first. In our house she says what she wants and I type it on my account. <em>TODO: confirm wording against each vendor page.</em>', [
      ['What each tool says about age', 'Link each vendor\'s age page. Do not summarise or quote it.'], ['How a session looks', 'Screen recording of dad typing her words; photo of the CAPY card by the desk (no face).'], ['What we do not share with the AI', 'Real rules you follow, from your own practice.']]) },
  { path: '/lessons/how-to-teach-ai-to-kids/', lang: 'en', article: true, title: 'How to teach a child to talk to AI: the CAPY prompt card', desc: 'A vague prompt versus a structured one, from real sessions with a 10-year-old. Includes a free printable card.', h1: 'How to teach a child to talk to AI (free prompt card)',
    crumbs: [['Lessons', '/lessons/'], ['Teach a child to talk to AI', '/lessons/how-to-teach-ai-to-kids/']],
    body: art(2, '', 'Teach the child to say who it is for, what it does, and what it must not do. A card on the desk helps. <em>TODO: confirm CAPY meaning from course-plan.md and rewrite.</em>', [
      ['Vague prompt vs CAPY prompt', 'Real before and after from prompts/s1.md and s2.md.'], ['Download the card', 'Link the printable file and put its real file name here.'], ['What went wrong', 'Did, Wanted, Got from a real moment.']]) },
  { path: '/zh/', lang: 'zh', alt: '/', title: '孩子也能做App：10岁女儿用AI做假期计划', desc: '一位爸爸记录10岁女儿用AI一节课一节课做出假期计划App。免费文件和课程候补名单。', h1: '让孩子用AI做自己的App',
    body: `<p>我的10岁女儿正在用AI做自己的假期计划App。每节课我都录下来，提示词一字不改，免费文件放在这里。</p><p>这个网站给希望孩子动手创造的家长。不露脸，不写姓名、学校，位置只到“澳洲”。</p>
<ul><li><a href="${BASE}/zh/lessons/">看课程</a></li><li><a href="${BASE}/zh/about/">关于作者</a></li></ul>${waitlist('zh')}` },
  { path: '/zh/about/', lang: 'zh', alt: '/about/', title: '关于：程序员爸爸和孩子做的计划App', desc: '谁在写这个网站，为什么做，以及我们永远不公开的孩子信息。', h1: '关于', crumbs: [['关于', '/zh/about/']],
    body: `<p>我是澳洲的软件开发者，在AWS工作11年，现在做银行聊天机器人的顾问。这是我和女儿的业余项目。</p><h2>做App的故事</h2>${FILL(0, '两三句真实的话：为什么开始，她想让计划App做什么。不写名字。')}<h2>我们不公开的内容</h2><p>她的脸、全名、学校、比“澳洲”更细的位置。见<a href="${BASE}/zh/privacy/">隐私</a>。</p>` },
  { path: '/zh/privacy/', lang: 'zh', alt: '/privacy/', title: '隐私：本站收集什么，不公开什么', desc: '本站不设Cookie，不加载第三方脚本。候补名单邮箱的用途。', h1: '隐私', crumbs: [['隐私', '/zh/privacy/']],
    body: `<p>本站不设Cookie，不加载第三方脚本。<em>TODO：如加统计，更新此句。</em></p><h2>候补名单</h2><p>邮箱只用于通知课程和免费文件。<em>TODO：写明表单服务商和退订方式。</em></p><h2>我们的孩子</h2><p>不公开脸、全名、学校或具体位置。屏幕录像只用演示数据。</p>` },
  { path: '/zh/lessons/', lang: 'zh', alt: '/lessons/', title: '课程：用AI做孩子的计划App', desc: '10岁女儿做假期计划App的课程索引，附免费文件和提示词。', h1: '课程', crumbs: [['课程', '/zh/lessons/']],
    body: `<p>每节课都是一次真实的练习。完整内容目前是英文，中文页会陆续补上。</p><ul><li><a href="${BASE}/lessons/can-a-kid-create-an-app/">孩子能自己做App吗？（英文）</a></li></ul>${waitlist('zh')}` },
];

rmSync(OUT, { recursive: true, force: true });
const url = (p) => SITE_URL + BASE + p;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const sitemap = [];

for (const p of pages) {
  const t = T[p.lang];
  const draft = p.body.includes('[FILL FROM'); // pages with unfilled blocks stay out of search
  const noindex = draft;
  const crumbs = [[t.home, p.lang === 'en' ? '/' : '/zh/'], ...(p.crumbs || [])];
  const ld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([n, h], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: url(h) })) }];
  if (p.article) ld.push({ '@context': 'https://schema.org', '@type': 'Article', headline: p.h1, description: p.desc, datePublished: DATE, dateModified: DATE, inLanguage: t.lang, author: { '@type': 'Person', name: AUTHOR }, mainEntityOfPage: url(p.path), image: url('/assets/icon-512.png') });
  const alts = p.alt ? [[p.lang === 'en' ? 'en' : 'zh-Hans', p.path], [p.lang === 'en' ? 'zh-Hans' : 'en', p.alt]] : [[t.lang, p.path]];
  const hreflang = p.alt ? [...alts, ['x-default', p.lang === 'en' ? p.path : p.alt]].map(([l, h]) => `<link rel="alternate" hreflang="${l}" href="${url(h)}">`).join('\n') : '';
  const home = p.lang === 'en' ? '/' : '/zh/';
  const html = `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title><meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url(p.path)}">${noindex ? '\n<meta name="robots" content="noindex,follow">' : ''}
${hreflang}
<meta property="og:type" content="${p.article ? 'article' : 'website'}"><meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.desc)}"><meta property="og:url" content="${url(p.path)}"><meta property="og:site_name" content="${SITE_NAME}"><meta property="og:locale" content="${p.lang === 'en' ? 'en_AU' : 'zh_CN'}"><meta property="og:image" content="${url('/assets/icon-512.png')}">
<meta name="twitter:card" content="summary">
<link rel="icon" type="image/svg+xml" href="${BASE}/assets/capy.svg"><link rel="icon" type="image/png" sizes="192x192" href="${BASE}/assets/icon-192.png"><link rel="apple-touch-icon" href="${BASE}/assets/icon-180.png">
<link rel="stylesheet" href="${BASE}/style.css">
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head><body><header><a class="brand" href="${BASE}${home}"><img src="${BASE}/assets/capy.svg" alt="" width="28" height="28">${SITE_NAME}</a>
<nav><a href="${BASE}${home}">${t.home}</a><a href="${BASE}${home}lessons/">${t.lessons}</a><a href="${BASE}${home}about/">${t.about}</a>${p.alt ? `<a href="${BASE}${p.alt}" hreflang="${p.lang === 'en' ? 'zh-Hans' : 'en'}" lang="${p.lang === 'en' ? 'zh-Hans' : 'en'}">${t.switch}</a>` : ''}</nav></header>
<main>${p.crumbs ? `<p class="crumbs">${crumbs.map(([n, h], i) => i < crumbs.length - 1 ? `<a href="${BASE}${h}">${n}</a>` : n).join(' › ')}</p>` : ''}<h1>${p.h1}</h1>
${p.body}</main><footer><p>${t.foot}</p><p><a href="${BASE}${home}privacy/">${t.privacy}</a></p></footer></body></html>`;
  const file = join(OUT, p.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  if (!noindex) sitemap.push(p);
}

copyFileSync('src/style.css', join(OUT, 'style.css'));
mkdirSync(join(OUT, 'assets'), { recursive: true });
for (const f of ['capy.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png']) copyFileSync(join('assets', f), join(OUT, 'assets', f));
writeFileSync(join(OUT, 'favicon.ico'), readFileSync('assets/icon-192.png')); // shortcut: PNG bytes served as .ico; browsers accept it, replace with a real .ico if needed
writeFileSync(join(OUT, '.nojekyll'), '');
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${url('/sitemap.xml')}\n`);
const alt = (p) => (p.alt ? `\n<xhtml:link rel="alternate" hreflang="${p.lang === 'en' ? 'en' : 'zh-Hans'}" href="${url(p.path)}"/>\n<xhtml:link rel="alternate" hreflang="${p.lang === 'en' ? 'zh-Hans' : 'en'}" href="${url(p.alt)}"/>` : '');
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemap.map((p) => `<url><loc>${url(p.path)}</loc><lastmod>${DATE}</lastmod>${alt(p)}\n</url>`).join('\n')}\n</urlset>\n`);
console.log(`built ${pages.length} pages, ${sitemap.length} in sitemap -> ${OUT}/`);
