// Builds the blog pages, the Our Work project list and the sitemap from the files in /content.
// Run with:  node scripts/build.mjs        (no packages needed)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const D = 'https://ansar.me/';
const BRAND = 'Ansar Marketing Services';
const SAME = ['https://web.facebook.com/profile.php?id=100082032374292', 'https://www.instagram.com/m.ansar971/', 'https://www.linkedin.com/in/mansarofficial'];
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const wr = (f, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, f)), { recursive: true }); fs.writeFileSync(path.join(ROOT, f), s); };
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const SERV = JSON.parse(rd('templates/service-names.json'));
const SNIP = JSON.parse(rd('templates/snippets.json'));

// ------------------------------------------------------------------ posts
const posts = fs.readdirSync(path.join(ROOT, 'content/posts')).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(rd('content/posts/' + f)))
  .filter((p) => !p.draft)
  .sort((a, b) => (b.date + b.slug).localeCompare(a.date + a.slug));
const order = ['google-ads-vs-meta-ads-pakistan', 'how-much-to-spend-on-google-ads-pakistan', 'what-does-a-google-ads-specialist-do', 'conversion-tracking-google-ads-meta-ads', 'website-checklist-before-running-ads', 'lead-generation-for-service-businesses-pakistan'];
posts.sort((a, b) => {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  const ia = order.indexOf(a.slug), ib = order.indexOf(b.slug);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
});

// ------------------------------------------------------------------ page shell (taken from the About page)
const tpl = rd('about/index.html').replaceAll('href="./"', 'href="../about/"').replaceAll(' aria-current="page"', '').replace('<body data-page="about">', '<body data-page="blog">');
const a0 = tpl.indexOf('<main'), b0 = tpl.indexOf('</main>') + 7;
const LDRE = /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g;
const HEAD = tpl.slice(0, a0).replace(LDRE, ''), FOOT = tpl.slice(b0).replace(LDRE, '');

const toDepth2 = (x) => x.replaceAll('href="../', 'href="../../').replaceAll('src="../', 'src="../../').replaceAll('url(../', 'url(../../');
const activate = (x) => x.replace(/(<a href="[./]*blog\/" data-nav="blog")>/g, '$1 aria-current="page">');
const ld = (graph) => '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replaceAll('<', '\\u003c') + '</script>';
const ORG = { '@type': 'Organization', '@id': D + '#organization', name: BRAND, url: D, email: 'mr.genius2474@gmail.com', sameAs: SAME, areaServed: [{ '@type': 'Country', name: 'Pakistan' }, { '@type': 'Country', name: 'United Arab Emirates' }, { '@type': 'Country', name: 'United States' }] };

function makeHead(head, title, desc, url) {
  let h = head.replace(/<title>[\s\S]*?<\/title>/, () => '<title>' + esc(title) + '</title>');
  h = h.replace(/(<meta name="description" content=")[^"]*(")/, (m, a, b) => a + esc(desc) + b);
  for (const k of ['og:title', 'twitter:title']) h = h.replace(new RegExp('(<meta (?:property|name)="' + k + '" content=")[^"]*(")', 'g'), (m, a, b) => a + esc(title) + b);
  for (const k of ['og:description', 'twitter:description']) h = h.replace(new RegExp('(<meta (?:property|name)="' + k + '" content=")[^"]*(")', 'g'), (m, a, b) => a + esc(desc) + b);
  h = h.replace(/(<link rel="canonical" href=")[^"]*(")/, (m, a, b) => a + url + b);
  h = h.replace(/(<meta property="og:url" content=")[^"]*(")/, (m, a, b) => a + url + b);
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '');
  return h;
}
function put(file, main, graph, title, desc, url, depth2) {
  let head = HEAD, foot = FOOT;
  if (depth2) { head = toDepth2(head); foot = toDepth2(foot); }
  head = activate(makeHead(head, title, desc, url)); foot = activate(foot);
  if (file.startsWith('areas/')) { head = head.replaceAll(' aria-current="page"', ''); foot = foot.replaceAll(' aria-current="page"', ''); }
  const l = ld(graph);
  foot = foot.includes('<script>"use strict";') ? foot.replace('<script>"use strict";', () => l + '\n<script>"use strict";') : foot.replace('</body>', () => l + '</body>');
  wr(file, head + main + foot);
}

// ------------------------------------------------------------------ blog index
const card = (p) => `<article class="card spot post-card"><span class="post-tag">${p.mins} min read · ${fmtDate(p.date)}</span><h2><a class="stretch" href="${p.slug}/">${esc(p.title)}</a></h2><p>${esc(p.desc)}</p></article>`;
{
  const main = '<main id="main" tabindex="-1" class="is-in"><section class="page-hero"><div class="wrap"><nav class="crumb" aria-label="Breadcrumb"><a href="../">Home</a><span>/</span><span aria-current="page">Blog</span></nav>'
    + '<p class="eyebrow">Blog</p><h1 class="h1">Practical guides on <em>Google Ads, Meta Ads and growth.</em></h1>'
    + '<p class="lead">Plain-language answers for business owners in Pakistan. No hype, no guaranteed results.</p></div></section>'
    + `<section class="sec"><div class="wrap"><div class="post-grid">${posts.map(card).join('')}</div></div></section></main>`;
  const g = [ORG, { '@type': 'Blog', '@id': D + 'blog/#blog', name: BRAND + ' Blog', url: D + 'blog/', publisher: { '@id': D + '#organization' }, inLanguage: 'en',
    blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: D + 'blog/' + p.slug + '/', datePublished: p.date })) },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: D }, { '@type': 'ListItem', position: 2, name: 'Blog', item: D + 'blog/' }] }];
  put('blog/index.html', main, g, 'Blog | Google Ads, Meta Ads and Digital Marketing in Pakistan',
    'Practical guides on Google Ads, Meta Ads, conversion tracking, websites and lead generation for business owners in Pakistan.', D + 'blog/', false);
}

// ------------------------------------------------------------------ blog posts
const byTitle = Object.fromEntries(posts.map((p) => [p.slug, p.title]));
for (const p of posts) {
  let body = '';
  for (const [kind, val] of p.body) {
    if (kind === 'h2') body += `<h2>${esc(val)}</h2>`;
    else if (kind === 'p') body += `<p>${esc(val)}</p>`;
    else if (kind === 'ol') body += '<ol>' + val.map((x) => `<li>${esc(x)}</li>`).join('') + '</ol>';
    else if (kind === 'src') body += '<h2>Sources</h2><ul class="src">' + val.map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(t)}<span class="vh"> (opens in a new tab)</span></a></li>`).join('') + '</ul>';
    else body += '<ul>' + val.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>';
  }
  const faq = (p.faq || []).map(([q, a]) => `<div><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('');
  const sv = [p.service, ...(p.extra_service ? [p.extra_service] : [])].filter((s) => SERV[s]);
  const svl = sv.map((s) => `<a href="../../services/${s}/">${SERV[s]}</a>`).join('');
  const rel = (p.related || []).filter((r) => byTitle[r]).map((r) => `<a href="../${r}/">${esc(byTitle[r])}</a>`).join('');
  const main = '<main id="main" tabindex="-1" class="is-in"><section class="page-hero"><div class="wrap">'
    + `<nav class="crumb" aria-label="Breadcrumb"><a href="../../">Home</a><span>/</span><a href="../">Blog</a><span>/</span><span aria-current="page">${esc(p.kw || p.title)}</span></nav>`
    + `<p class="eyebrow">${p.mins} min read</p><h1 class="h1">${esc(p.title)}</h1><p class="lead">${esc(p.desc)}</p>`
    + `<p class="post-meta">By ${BRAND} · Published ${fmtDate(p.date)}</p></div></section>`
    + `<section class="sec"><div class="wrap"><article class="post"><div class="answer-box"><b>Short answer</b><p>${esc(p.answer)}</p></div>${body}`
    + (faq ? `<h2>Quick answers</h2><div class="qa">${faq}</div>` : '')
    + `<div class="post-cta"><h2>Want help with this?</h2><p>Tell us about your business and goals. We will suggest a sensible starting point, with no promises of guaranteed results.</p><div class="related">${svl}<a href="../../contact/">Get a free consultation</a></div></div>`
    + (rel ? `<h2>Keep reading</h2><div class="related">${rel}</div>` : '') + '</article></div></section></main>';
  const url = D + 'blog/' + p.slug + '/';
  const mod = p.updated || p.date;
  const g = [ORG,
    { '@type': 'BlogPosting', '@id': url + '#article', headline: p.title, description: p.desc, datePublished: p.date, dateModified: mod, inLanguage: 'en', mainEntityOfPage: url, url, image: D + 'og-image.png', author: { '@id': D + '#organization' }, publisher: { '@id': D + '#organization' }, about: p.kw || p.title, isPartOf: { '@id': D + 'blog/#blog' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: D }, { '@type': 'ListItem', position: 2, name: 'Blog', item: D + 'blog/' }, { '@type': 'ListItem', position: 3, name: p.title, item: url }] }];
  if ((p.faq || []).length) g.push({ '@type': 'FAQPage', mainEntity: p.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  put(`blog/${p.slug}/index.html`, main, g, p.seo || (p.title.length < 44 ? p.title + ' | ' + BRAND : p.title), p.desc, url, true);
}
// remove pages of deleted or draft posts
const keep = new Set(posts.map((p) => p.slug));
for (const d of fs.readdirSync(path.join(ROOT, 'blog'), { withFileTypes: true })) {
  if (d.isDirectory() && !keep.has(d.name)) fs.rmSync(path.join(ROOT, 'blog', d.name), { recursive: true, force: true });
}

// ------------------------------------------------------------------ Our Work project list
{
  const projects = JSON.parse(rd('content/projects.json'));
  const tags = (p) => `<ul class="tags" aria-label="Services provided">${(p.services || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`;
  const logo = (p) => {
    if (!p.brand) return '';
    const inner = p.logoHtml ? p.logoHtml : `<b>${esc(p.brand.trim().charAt(0).toUpperCase())}</b>`;
    return `<div class="proj-logo"><span class="lg">${inner}</span><span class="nm">${esc(p.brand)}</span></div>`;
  };
  const outcome = (p) => p.outcome
    ? `<p class="outcome"><b>Verified outcomes:</b> ${esc(p.outcome)}</p>`
    : (p.status === 'wip' ? '<p class="outcome"><b>Status:</b> in progress. Details and screenshots are added at launch.</p>' : '<p class="outcome"><b>Verified outcomes:</b> not published yet. We add results only when they are confirmed.</p>');
  const badge = { live: ['live', 'Live project'], wip: ['wip', 'In progress'], case: ['case', 'Case study'] };
  const vis = (p) => {
    const [bc, bt] = badge[p.status] || badge.live;
    if (p.image) return `<div class="proj-vis"><img class="shot" src="../${esc(p.image)}" width="560" height="778" loading="lazy" decoding="async" alt="${esc(p.imageAlt || 'Screenshot of the ' + p.name + ' website')}"><span class="badge ${bc}">${bt}</span></div>`;
    return `<div class="proj-vis"><div class="pend-vis" aria-hidden="true">${SNIP.pend}<small>${p.status === 'wip' ? 'Coming soon' : 'Preview coming soon'}</small></div><span class="badge ${bc}">${bt}</span></div>`;
  };
  const links = (p) => p.url
    ? `<div class="proj-links"><a class="link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Visit live site ${SNIP.arrow}<span class="vh"> (opens in a new tab)</span></a><a class="btn btn-ghost btn-sm" href="../contact/"><span class="btn-label">Discuss a similar website</span>${SNIP.btnarrow}</a></div>`
    : '';
  const note = (p) => (p.image && p.url) ? '<p class="form-note">Screenshot of the live website on a phone. Open the live site to see every page.</p>' : '';
  const full = (p, extra = '') => `<article class="card spot proj ${extra}">${vis(p)}<div class="proj-body">${logo(p)}<span class="ind">${esc(p.industry)}</span><h3>${esc(p.name)}</h3>${tags(p)}<p>${esc(p.overview)}</p>${outcome(p)}${links(p)}${note(p)}</div></article>`;
  const plural = (n) => `${n} project${n === 1 ? '' : 's'}`;
  const groups = [['live', 'Live websites we have built', true], ['case', 'Case studies', true], ['wip', 'In progress', false]];
  let html = '';
  for (const [st, title, feature] of groups) {
    const list = projects.filter((p) => p.status === st);
    if (!list.length) continue;
    html += `<div class="work-sub"><h2>${title}</h2><span>${plural(list.length)}</span></div>`;
    if (feature) html += list.map((p) => full(p, 'proj-feature')).join('\n  ');
    else html += `<div class="work-grid${list.length === 1 ? ' one' : ''}">${list.map((p) => full(p, 'pending')).join('')}</div>`;
    html += '\n\n  ';
  }
  let s = rd('our-work/index.html');
  s = s.replace(/<!--PROJECTS:START-->[\s\S]*<!--PROJECTS:END-->/, () => '<!--PROJECTS:START-->' + html.trimEnd() + '<!--PROJECTS:END-->');
  // keep the "live" structured data in step with the project list
  s = s.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (m, j) => {
    try {
      const o = JSON.parse(j);
      const cp = o['@graph'].find((x) => x['@type'] === 'CollectionPage');
      const live = projects.filter((p) => p.status !== 'wip' && p.url);
      cp.mainEntity = { '@type': 'ItemList', itemListElement: live.map((p, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'WebSite', name: p.brand || p.name, url: p.url, description: p.summary || p.overview, creator: { '@id': D + '#organization' } } })) };
      return '<script type="application/ld+json">' + JSON.stringify(o).replaceAll('<', '\\u003c') + '</script>';
    } catch (e) { return m; }
  });
  wr('our-work/index.html', s);
}


// ------------------------------------------------------------------ country pages (UAE, USA, Pakistan)
const areas = JSON.parse(rd('content/areas.json'));
const list = (a) => a.length < 3 ? a.join(' and ') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
for (const c of areas) {
  const others = areas.filter((x) => x.slug !== c.slug);
  const faq = [...c.faq,
    ['Can you guarantee leads or sales?', 'No. Nobody can honestly guarantee leads, rankings or sales. We plan carefully, track what happens, and report clearly so you can make good decisions.'],
    ['What do you need to get started?', 'Tell us what you sell, who your customers are and which areas you want to reach. We will suggest a starting point and explain it in plain language.']];
  const body = `<div class="answer-box"><b>Short answer</b><p>Businesses in ${c.label} can use Google Ads to appear when people search for a service, Meta Ads to reach people on Facebook and Instagram, and a fast mobile website to turn visits into calls and messages. Ansar Marketing Services helps with all three, online, with a plan built around your goals and budget.</p></div>`
    + `<h2>How Google Ads can help ${esc(c.name)} businesses</h2><p>Google Ads shows your business to people who are already searching. For example, someone may search for "${esc(c.queries[0])}" or "${esc(c.queries[1])}". We set up search campaigns around the services and places you really cover, write clear ads and track which searches bring enquiries.</p><p>${esc(c.angle)}</p>`
    + `<h2>How Meta Ads can help</h2><p>Meta Ads reaches people on Facebook and Instagram. You can choose the place, age range and interests, and send people to a form or straight to WhatsApp. It suits visual offers and businesses that want to start conversations, such as ${list(c.types.slice(0, 4))}.</p>`
    + `<h2>What is different in ${esc(c.label)}</h2><ul>${c.local.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
    + `<h2>Why the website matters</h2><p>Ads send people to your website. If it is slow or confusing on a phone, the money spent on clicks is wasted. We build and improve mobile-friendly pages with one clear action, such as calling, messaging on WhatsApp or sending a short form.</p>`
    + `<h2>Places you can target</h2><p>You can aim your ads at specific places, for example ${list(c.places)}. Choosing the places you can actually serve keeps your budget focused on people who can become customers.</p>`
    + `<h2>Businesses we can help in ${esc(c.label)}</h2><ul>${c.types.map((t) => `<li>${esc(cap(t))}</li>`).join('')}</ul>`
    + `<h2>Rules to keep in mind</h2><ul>${c.rules.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
    + `<h2>How we work with you from Pakistan</h2><p>Ansar Marketing Services is based in Pakistan and works online. We do not claim offices, staff or client results in ${esc(c.label)}. We talk through WhatsApp, calls, video meetings or email, agree a plan in writing, and report on what the numbers show.</p>`
    + `<h2>Before you start</h2><ul><li>Decide what an enquiry is worth to you: a call, a form or a WhatsApp message.</li><li>Choose the places and services you want more work for.</li><li>Make sure your website or landing page loads fast on mobile data.</li><li>Set up conversion tracking so results are clear.</li><li>Start with a budget you can test with, then improve step by step.</li></ul>`
    + `<h2>Quick answers</h2><div class="qa">${faq.map(([q, a]) => `<div><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('')}</div>`
    + (c.sources ? `<h2>Sources</h2><ul>${c.sources.map(([t, u]) => `<li><a href="${u}" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>` : '')
    + `<div class="post-cta"><h2>Talk to us about your business in ${esc(c.label)}</h2><p>Tell us what you offer and where your customers are. We will suggest a sensible starting point, with no promises of guaranteed results.</p><div class="related"><a href="../../services/google-ads-management/">Google Ads Management</a><a href="../../services/meta-ads-management/">Meta Ads Management</a><a href="../../services/website-development/">Website Development</a><a href="../../contact/">Get a Free Consultation</a></div></div>`
    + `<h2>Also serving</h2><div class="related">${others.map((o) => `<a href="../${o.slug}/">Digital marketing in ${o.name}</a>`).join('')}<a href="../../blog/how-to-choose-a-google-ads-expert-in-pakistan/">How to choose a Google Ads expert</a></div>`;
  const main = '<main id="main" tabindex="-1" class="is-in"><section class="page-hero"><div class="wrap">'
    + `<nav class="crumb" aria-label="Breadcrumb"><a href="../../">Home</a><span>/</span><a href="../">Areas we serve</a><span>/</span><span aria-current="page">${c.name}</span></nav>`
    + `<p class="eyebrow">${esc(c.full)}</p><h1 class="h1">Digital marketing for <em>businesses in ${esc(c.label)}.</em></h1><p class="lead">Google Ads, Meta Ads and mobile-friendly websites for businesses in ${esc(c.label)} that want more of the right customers.</p></div></section>`
    + `<section class="sec"><div class="wrap"><article class="post">${body}</article></div></section></main>`;
  const url = D + 'areas/' + c.slug + '/';
  const title = `Digital Marketing in ${c.name} | Google Ads & Meta Ads`;
  const desc = `Google Ads, Meta Ads and website development for businesses in ${c.label}. Practical, honest, online help to get more enquiries. Free consultation.`;
  const g = [ORG,
    { '@type': 'WebPage', '@id': url + '#webpage', name: title, description: desc, url, inLanguage: 'en', isPartOf: { '@id': D + '#website' }, dateModified: c.date },
    { '@type': 'Service', '@id': url + '#service', name: `Digital marketing services for businesses in ${c.label}`, serviceType: 'Digital marketing, Google Ads, Meta Ads and website development', provider: { '@id': D + '#organization' }, areaServed: { '@type': 'Country', name: c.full }, url },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: D }, { '@type': 'ListItem', position: 2, name: 'Areas we serve', item: D + 'areas/' }, { '@type': 'ListItem', position: 3, name: c.name, item: url }] },
    { '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }];
  put(`areas/${c.slug}/index.html`, main, g, title, desc, url, true);
}
// old city pages now point to the Pakistan page
for (const old of ['lahore', 'karachi', 'islamabad', 'rawalpindi']) {
  wr(`areas/${old}/index.html`, `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved to Digital Marketing in Pakistan</title><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><link rel="canonical" href="${D}areas/pakistan/"><meta http-equiv="refresh" content="0;url=../pakistan/"></head><body><p>This page has moved to <a href="../pakistan/">Digital marketing in Pakistan</a>.</p></body></html>\n`);
}
{
  const main = '<main id="main" tabindex="-1" class="is-in"><section class="page-hero"><div class="wrap"><nav class="crumb" aria-label="Breadcrumb"><a href="../">Home</a><span>/</span><span aria-current="page">Areas we serve</span></nav>'
    + '<p class="eyebrow">Areas we serve</p><h1 class="h1">Digital marketing for <em>businesses in the UAE, the US and Pakistan.</em></h1><p class="lead">Ansar Marketing Services is based in Pakistan and works online with businesses in these three markets, through WhatsApp, calls, video meetings and email.</p></div></section>'
    + `<section class="sec"><div class="wrap"><div class="post-grid">${areas.map((c) => `<article class="card spot post-card"><span class="post-tag">${esc(list(c.places.slice(0, 3)))}</span><h2><a class="stretch" href="${c.slug}/">Digital marketing in ${c.name}</a></h2><p>Google Ads, Meta Ads and websites for businesses in ${c.label}.</p></article>`).join('')}</div>`
    + '<p style="margin-top:28px" class="lead">Is your business somewhere else? <a href="../contact/">Tell us where you are</a> and we will tell you honestly whether we can help.</p></div></section></main>';
  const url = D + 'areas/';
  const title = 'Areas We Serve: UAE, USA and Pakistan | Ansar Marketing';
  const desc = 'Ansar Marketing Services works online with businesses in the UAE, the United States and Pakistan: Google Ads, Meta Ads and website development.';
  const g = [ORG, { '@type': 'CollectionPage', '@id': url + '#webpage', name: title, description: desc, url, inLanguage: 'en', isPartOf: { '@id': D + '#website' }, mainEntity: { '@type': 'ItemList', itemListElement: areas.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: D + 'areas/' + c.slug + '/', name: `Digital marketing in ${c.name}` })) } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: D }, { '@type': 'ListItem', position: 2, name: 'Areas we serve', item: url }] }];
  put('areas/index.html', main, g, title, desc, url, false);
}

// ------------------------------------------------------------------ sitemap
{
  const old = fs.existsSync(path.join(ROOT, 'sitemap.xml')) ? rd('sitemap.xml') : '';
  const prev = {}; for (const m of old.matchAll(/<loc>([^<]*)<\/loc>(?:<lastmod>([^<]*)<\/lastmod>)?/g)) prev[m[1]] = m[2];
  const stat = ['', 'services/', 'services/google-ads-management/', 'services/meta-ads-management/', 'services/digital-marketing/', 'services/website-development/', 'services/conversion-tracking/', 'about/', 'our-work/', 'contact/', 'blog/', 'areas/', ...areas.map((c) => 'areas/' + c.slug + '/')];
  const latest = posts.reduce((m, p) => ((p.updated || p.date) > m ? (p.updated || p.date) : m), '');
  const rows = stat.map((u) => [D + u, u === 'blog/' ? latest : (u.startsWith('areas/') ? '2026-11-12' : prev[D + u])]);
  for (const p of posts) rows.push([D + 'blog/' + p.slug + '/', p.updated || p.date]);
  rows.push([D + 'privacy/', prev[D + 'privacy/']]);
  wr('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + rows.map(([l, m]) => `  <url><loc>${l}</loc>${m ? `<lastmod>${m}</lastmod>` : ''}</url>`).join('\n') + '\n</urlset>\n');
}
console.log(`Built ${posts.length} posts, projects and sitemap.`);
