// Zero-dependency static builder. Usage: SITE_URL=https://user.github.io/repo/ node build.mjs
import { mkdirSync, writeFileSync, copyFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

// One variable drives everything: SITE_URL may be a domain root (org site, default) or include a sub-path (project site).
// Root:     SITE_URL=https://<org>.github.io/            -> BASE=''
// Sub-path: SITE_URL=https://<user>.github.io/<repo>/    -> BASE='/<repo>'
const U = new URL(process.env.SITE_URL || 'https://babaships.github.io/'); // org root site: repo must be named babaships.github.io
const SITE_URL = U.origin;
const BASE = U.pathname.replace(/\/$/, '');
if (process.env.CI && /127\.0\.0\.1|localhost|todo/i.test(SITE_URL)) throw new Error(`SITE_URL is a placeholder in CI: ${SITE_URL}`);
// Brand and byline per language. Handles only; never a real name.
const DATE = '2026-11-24'; // default for pages without their own `date`; TODO: set per article when published
// Analytics: GoatCounter, cookie-free. Set the code (the "x" in x.goatcounter.com) here or in the GOATCOUNTER env var.
const GOATCOUNTER = process.env.GOATCOUNTER || 'TODO-GOATCOUNTER'; // TODO: GoatCounter site code
const ANALYTICS = !/^TODO/.test(GOATCOUNTER); // no script and a "no third-party scripts" privacy line until a real code is set
const GSC_TOKEN = process.env.GSC_TOKEN || ''; // Google Search Console meta-tag verification content
const BING_TOKEN = process.env.BING_TOKEN || ''; // Bing Webmaster Tools meta-tag verification content
const OUT = 'dist';
const FILL = (n, what) => `<aside class="fill"><strong>[FILL FROM SESSION ${n}]</strong> ${what}</aside>`;
// Social profiles: footer links (label per language) and JSON-LD sameAs. To add one, add one line: { en: 'label', zh: '标签', url: 'https://...' }. No query strings or tokens in the URL.
const SOCIALS = [
  { en: 'YouTube', zh: 'YouTube', url: 'https://www.youtube.com/@babaships' },
  { en: 'Xiaohongshu (RED)', zh: '小红书 · 澳爸在造', url: 'https://www.xiaohongshu.com/user/profile/633d616c000000001802e98f' },
];
const T = {
  en: { lang: 'en', site: 'babaships', author: 'Baba · babaships', home: 'Home', about: 'About', lessons: 'Lessons', privacy: 'Privacy', switch: '中文', foot: 'A parent-run project. No child photos, names, school or exact location are published.' },
  zh: { lang: 'zh-Hans', site: '澳爸在造', author: '澳爸 · 澳爸在造', home: '首页', about: '关于', lessons: '课程', privacy: '隐私', switch: 'English', foot: '家长自办项目。不公开孩子的照片、姓名、学校或具体位置。' },
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

const tbl = (n, rows) => `<table class="nums"><tbody>${rows.map((r) => `<tr><th scope="row">${r}</th><td>[FILL FROM SESSION ${n}] real number</td></tr>`).join('')}</tbody></table>`;
// Article template. lead = direct answer, 150 characters or less (check.mjs enforces). qa = [question H2, what to fill] pairs.
const art = (n, lead, qa) => ({ lead, body: `<h2>How long did it take, in numbers?</h2>${tbl(n, ['Minutes from start to a working version', 'Prompts she spoke', 'Tries before it worked', 'Bugs found'])}
<h2>What did she say to the AI, word for word?</h2>${FILL(n, 'Paste her exact prompt from prompts/s' + n + '.md. No tidying.')}
${qa.map(([h, f]) => `<h2>${h}</h2>${FILL(n, f)}`).join('')}
<h2>Can I watch it happen?</h2>${FILL(n, 'Embed the YouTube twin of this lesson, plus a VideoObject JSON-LD block that matches the visible title.')}
<h2>Where can I check the facts?</h2>${FILL(n, 'Links to the official or vendor page (eSafety, each tool\'s age rules). Link them; do not summarise or quote.')}
<h2>What next?</h2><p><a href="${BASE}/lessons/">All lessons</a></p>${waitlist('en')}` });

const pages = [
  { path: '/', lang: 'en', alt: '/zh/', title: 'Vibe coding for kids: a 10-year-old builds a planner app', desc: 'A parent documents how his 10-year-old builds a holiday planner app with AI, one lesson at a time. Free files and a course waitlist.', h1: 'Vibe coding for kids: she talks, AI builds, we learn',
    lead: 'My 10-year-old builds her own holiday planner app with AI. I film each lesson and share the free files here.',
    body: `<p>I keep her prompts word for word. This site is for parents who want their kids to build, not just watch. No faces, no names, no school, nothing finer than "Australia".</p>
<ul><li><a href="${BASE}/lessons/">Read the lessons</a></li><li><a href="${BASE}/about/">Who writes this</a></li></ul>${waitlist('en')}` },
  { path: '/about/', lang: 'en', alt: '/zh/about/', title: 'About: a developer dad and a kid-built planner app', desc: 'Who writes this site, why we build, and what we never publish about our child.', h1: 'About',
    lead: 'I am a software developer in Australia with 11 years at AWS. This site is my side project with my daughter.',
    crumbs: [['About', '/about/']],
    body: `<h2>Why did we start?</h2>${FILL(0, 'Two or three true sentences: why you started, what she wanted the planner to do. No names.')}
<h2>What do we never publish?</h2><p>Her face, full name, school, or any location finer than "Australia". See <a href="${BASE}/privacy/">Privacy</a>.</p>` },
  { path: '/privacy/', lang: 'en', alt: '/zh/privacy/', title: 'Privacy: what this site collects and what we keep off it', desc: 'No cookies. How visits are counted, how the waitlist email is used, and what we never publish about our child.', h1: 'Privacy',
    lead: ANALYTICS ? 'This site sets no cookies. It loads one small visit counter, GoatCounter, which uses no cookies.' : 'This site sets no cookies and loads no third-party scripts.',
    crumbs: [['Privacy', '/privacy/']],
    body: `${ANALYTICS ? `<h2>How are visits counted?</h2><p><a href="https://www.goatcounter.com/">GoatCounter</a> counts page views without cookies and without unique identifiers. It keeps the page, the site you came from, browser, screen size and rough location.</p>` : ''}
<h2>What happens to a waitlist email?</h2><p>Your email is used only to tell you about the course and free files. <em>TODO: name the form provider and how to unsubscribe.</em></p>
<h2>What do we keep off the site?</h2><p>No face, full name, school or exact location is published. Demo data only in screen recordings.</p>
<h2>How do I contact you?</h2><p>TODO: contact email.</p>` },
  { path: '/lessons/', lang: 'en', alt: '/zh/lessons/', title: 'Lessons: building a kid\'s planner app with AI', desc: 'Index of lessons from a 10-year-old\'s holiday planner build, with free files and prompts.', h1: 'Lessons',
    lead: 'Each lesson is one real session, with her prompts and the files we used.',
    crumbs: [['Lessons', '/lessons/']],
    body: `<p>Pages marked <em>draft</em> are waiting for real footage.</p>
<ol><li><a href="${BASE}/lessons/can-a-kid-create-an-app/">Can a kid create an app? Her first app, exactly what she said</a> <em>(draft)</em></li>
<li><a href="${BASE}/lessons/can-kids-use-claude/">Can kids use Claude? She talks, dad types</a> <em>(draft)</em></li>
<li><a href="${BASE}/lessons/how-to-teach-ai-to-kids/">How to teach a child to talk to AI: the CAPY prompt card</a> <em>(draft)</em></li></ol>${waitlist('en')}` },
  { path: '/lessons/can-a-kid-create-an-app/', lang: 'en', article: true, title: 'Can a kid create an app? Her first one, word for word', desc: 'How a 10-year-old made a first working app with AI: her exact prompt, three tries, and the time it took.', h1: 'Can a kid create an app? Her first one, exactly what she said',
    crumbs: [['Lessons', '/lessons/'], ['Can a kid create an app?', '/lessons/can-a-kid-create-an-app/']],
    // TODO: confirm the lead against the real session 1 result and minutes after filming.
    ...art(1, 'Yes, with help. She described a planner out loud and AI built a first working version. Here is exactly what she said.', [
      ['What did the first result look like?', 'Screenshot (no face, demo data only).'], ['What changed between the tries?', 'What changed between tries. Real count.']]) },
  { path: '/lessons/can-kids-use-claude/', lang: 'en', article: true, title: 'Can kids use Claude? She talks, dad types', desc: 'How our family uses an AI assistant with a 10-year-old: she speaks, a parent types, and we link each tool\'s own age rules.', h1: 'Can kids use Claude? How we do it',
    crumbs: [['Lessons', '/lessons/'], ['Can kids use Claude?', '/lessons/can-kids-use-claude/']],
    // TODO: confirm the lead wording against each vendor's own age page.
    ...art(1, 'Check the tool\'s own age rules first. In our house she says what she wants and I type it on my account.', [
      ['What does each tool say about age?', 'Link each vendor\'s age page. Do not summarise it.'], ['What does a session look like at our house?', 'Screen recording of dad typing her words; photo of the CAPY card by the desk (no face).'], ['What do we keep out of the chat?', 'Real rules you follow, from your own practice.']]) },
  { path: '/lessons/how-to-teach-ai-to-kids/', lang: 'en', article: true, title: 'How to teach a child to talk to AI: the CAPY prompt card', desc: 'A vague prompt versus a structured one, from real sessions with a 10-year-old. Includes a free printable card.', h1: 'How to teach a child to talk to AI (free prompt card)',
    crumbs: [['Lessons', '/lessons/'], ['Teach a child to talk to AI', '/lessons/how-to-teach-ai-to-kids/']],
    // TODO: confirm what CAPY stands for (course-plan.md) and rewrite the lead.
    ...art(2, 'Teach the child to say who it is for, what it does, and what it must not do. A card on the desk helps.', [
      ['What is the difference between a vague and a CAPY prompt?', 'Real before and after from prompts/s1.md and s2.md.'], ['Where do I get the card?', 'Link the printable file and put its real file name here.'], ['What went wrong?', 'Did, Wanted, Got from a real moment.']]) },
  { path: '/zh/', lang: 'zh', alt: '/', title: '孩子也能做App：10岁女儿用AI做假期计划', desc: '一位爸爸记录10岁女儿用AI一节课一节课做出假期计划App。免费文件和课程候补名单。', h1: '让孩子用AI做自己的App',
    lead: '我的10岁女儿正在用AI做自己的假期计划App。每节课我都录下来，免费文件放在这里。',
    body: `<p>提示词一字不改。这个网站给希望孩子动手创造的家长。不露脸，不写姓名、学校，位置只到“澳洲”。</p>
<ul><li><a href="${BASE}/zh/lessons/">看课程</a></li><li><a href="${BASE}/zh/about/">关于作者</a></li></ul>${waitlist('zh')}` },
  { path: '/zh/about/', lang: 'zh', alt: '/about/', title: '关于：程序员爸爸和孩子做的计划App', desc: '谁在写这个网站，为什么做，以及我们永远不公开的孩子信息。', h1: '关于', crumbs: [['关于', '/zh/about/']],
    lead: '我是澳洲的软件开发者，在AWS工作11年。这是我和女儿的业余项目。',
    body: `<h2>我们为什么开始做？</h2>${FILL(0, '两三句真实的话：为什么开始，她想让计划App做什么。不写名字。')}<h2>我们不公开什么？</h2><p>她的脸、全名、学校、比“澳洲”更细的位置。见<a href="${BASE}/zh/privacy/">隐私</a>。</p>` },
  { path: '/zh/privacy/', lang: 'zh', alt: '/privacy/', title: '隐私：本站收集什么，不公开什么', desc: '本站不设Cookie。访问怎么统计，候补名单邮箱的用途。', h1: '隐私', crumbs: [['隐私', '/zh/privacy/']],
    lead: ANALYTICS ? '本站不设Cookie，只加载一个不用Cookie的访问计数脚本（GoatCounter）。' : '本站不设Cookie，不加载第三方脚本。',
    body: `${ANALYTICS ? `<h2>访问怎么统计？</h2><p><a href="https://www.goatcounter.com/">GoatCounter</a>不用Cookie，也不给访客编号。它记录页面、来源网站、浏览器、屏幕大小和大致位置。</p>` : ''}<h2>候补名单的邮箱怎么用？</h2><p>邮箱只用于通知课程和免费文件。<em>TODO：写明表单服务商和退订方式。</em></p><h2>我们的孩子呢？</h2><p>不公开脸、全名、学校或具体位置。屏幕录像只用演示数据。</p>` },
  { path: '/zh/lessons/', lang: 'zh', alt: '/lessons/', title: '课程：用AI做孩子的计划App', desc: '10岁女儿做假期计划App的课程索引，附免费文件和提示词。', h1: '课程', crumbs: [['课程', '/zh/lessons/']],
    lead: '每节课都是一次真实的练习。完整内容目前是英文，中文页会陆续补上。',
    body: `<ul><li><a href="${BASE}/lessons/can-a-kid-create-an-app/">孩子能自己做App吗？（英文）</a></li></ul>${waitlist('zh')}` },
];

rmSync(OUT, { recursive: true, force: true });
const url = (p) => SITE_URL + BASE + p;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const sitemap = [];

for (const p of pages) {
  const t = T[p.lang];
  const draft = p.body.includes('[FILL FROM'); // pages with unfilled blocks stay out of search
  const noindex = draft;
  const d = p.date || DATE;
  const title = [...`${p.title} | ${t.site}`].length <= 60 ? `${p.title} | ${t.site}` : p.title; // brand suffix only while the title stays within 60 characters
  const crumbs = [[t.home, p.lang === 'en' ? '/' : '/zh/'], ...(p.crumbs || [])];
  const ld = [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map(([n, h], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: url(h) })) }];
  if (p.path === '/' || p.path === '/zh/') ld.push({ '@context': 'https://schema.org', '@type': 'Organization', name: 'babaships', alternateName: '澳爸在造', url: url('/'), logo: url('/assets/icon-512.png'), sameAs: SOCIALS.map((x) => x.url) });
  if (p.article) ld.push({ '@context': 'https://schema.org', '@type': 'Article', headline: p.h1, description: p.desc, datePublished: d, dateModified: d, inLanguage: t.lang, author: { '@type': 'Person', name: t.author, sameAs: SOCIALS.map((x) => x.url), url: url(p.lang === 'en' ? '/about/' : '/zh/about/') }, mainEntityOfPage: url(p.path), image: url('/assets/og-image.png') });
  const alts = p.alt ? [[p.lang === 'en' ? 'en' : 'zh-Hans', p.path], [p.lang === 'en' ? 'zh-Hans' : 'en', p.alt]] : [[t.lang, p.path]];
  const hreflang = p.alt ? [...alts, ['x-default', p.lang === 'en' ? p.path : p.alt]].map(([l, h]) => `<link rel="alternate" hreflang="${l}" href="${url(h)}">`).join('\n') : '';
  const home = p.lang === 'en' ? '/' : '/zh/';
  const html = `<!doctype html>
<html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${url(p.path)}">${noindex ? '\n<meta name="robots" content="noindex,follow">' : ''}
${hreflang}
<meta property="og:type" content="${p.article ? 'article' : 'website'}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(p.desc)}"><meta property="og:url" content="${url(p.path)}"><meta property="og:site_name" content="${t.site}"><meta property="og:locale" content="${p.lang === 'en' ? 'en_AU' : 'zh_CN'}"><meta property="og:image" content="${url('/assets/og-image.png')}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="babaships · 澳爸在造: a hand-drawn crayon portrait">
<meta name="twitter:card" content="summary_large_image">${GSC_TOKEN ? `\n<meta name="google-site-verification" content="${esc(GSC_TOKEN)}">` : ''}${BING_TOKEN ? `\n<meta name="msvalidate.01" content="${esc(BING_TOKEN)}">` : ''}
<link rel="icon" href="${BASE}/favicon.ico" sizes="32x32 48x48"><link rel="icon" type="image/png" sizes="32x32" href="${BASE}/assets/favicon-32.png"><link rel="icon" type="image/png" sizes="48x48" href="${BASE}/assets/favicon-48.png"><link rel="apple-touch-icon" href="${BASE}/assets/apple-touch-icon.png">
<link rel="stylesheet" href="${BASE}/style.css">
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
${ANALYTICS ? `<script data-goatcounter="https://${GOATCOUNTER}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>\n` : ''}</head><body><header><a class="brand" href="${BASE}${home}"><img src="${BASE}/assets/logo-96.png" alt="" width="28" height="28">${t.site}</a>
<nav><a href="${BASE}${home}">${t.home}</a><a href="${BASE}${home}lessons/">${t.lessons}</a><a href="${BASE}${home}about/">${t.about}</a>${p.alt ? `<a href="${BASE}${p.alt}" hreflang="${p.lang === 'en' ? 'zh-Hans' : 'en'}" lang="${p.lang === 'en' ? 'zh-Hans' : 'en'}">${t.switch}</a>` : ''}</nav></header>
<main><h1>${p.h1}</h1>
<p class="lead">${p.lead}</p>
${p.crumbs ? `<p class="crumbs">${crumbs.map(([n, h], i) => i < crumbs.length - 1 ? `<a href="${BASE}${h}">${n}</a>` : n).join(' › ')}</p>` : ''}
${p.article ? `<p class="byline">${t.lang === 'en' ? 'By' : '作者：'} ${t.author}. ${t.lang === 'en' ? 'Updated' : '更新于'} ${d}.</p>` : ''}
${p.body}</main><footer><p>${t.foot}</p><p><a href="${BASE}${home}privacy/">${t.privacy}</a>${SOCIALS.map((x) => ` · <a href="${x.url}" rel="me noopener">${x[p.lang]}</a>`).join('')}</p></footer></body></html>`;
  const file = join(OUT, p.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  if (!noindex) sitemap.push(p);
}

copyFileSync('src/style.css', join(OUT, 'style.css'));
mkdirSync(join(OUT, 'assets'), { recursive: true });
for (const f of ['logo-96.png', 'favicon-32.png', 'favicon-48.png', 'apple-touch-icon.png', 'icon-512.png', 'og-image.png']) copyFileSync(join('assets', f), join(OUT, 'assets', f)); // logo-source.webp stays in the repo only
copyFileSync('assets/favicon.ico', join(OUT, 'favicon.ico'));
writeFileSync(join(OUT, '.nojekyll'), '');
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${url('/sitemap.xml')}\n`);
const alt = (p) => (p.alt ? `\n<xhtml:link rel="alternate" hreflang="${p.lang === 'en' ? 'en' : 'zh-Hans'}" href="${url(p.path)}"/>\n<xhtml:link rel="alternate" hreflang="${p.lang === 'en' ? 'zh-Hans' : 'en'}" href="${url(p.alt)}"/>` : '');
writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${sitemap.map((p) => `<url><loc>${url(p.path)}</loc><lastmod>${p.date || DATE}</lastmod>${alt(p)}\n</url>`).join('\n')}\n</urlset>\n`);
console.log(`built ${pages.length} pages, ${sitemap.length} in sitemap -> ${OUT}/`);
