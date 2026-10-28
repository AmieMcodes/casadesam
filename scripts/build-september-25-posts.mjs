import fs from 'node:fs';
import path from 'node:path';
import { posts } from './september-25-content.mjs';
const root = path.resolve(import.meta.dirname, '..');
const datePath = 'september-25-2026';

const about = `<h2>About Casa de SAM</h2><p>Casa de SAM is a developing vision for a lifelong residential community in Paraguay for adults with autism and other developmental disabilities who need substantial daily support. The project is being designed around safety, flexible daily rhythms, meaningful choice, relationships, and belonging that does not have to be earned through productivity or independence.</p><p>Casa de SAM is not yet an operating nonprofit or residential provider. We are currently researching, documenting the vision, and looking for people who may eventually help build it responsibly.</p><p class="blog-disclaimer"><em>Information reviewed October 16, 2026. This article provides general educational information and describes Casa de SAM’s developing philosophy. Laws, eligibility rules, and services vary by country and jurisdiction. This is not individualized medical, therapeutic, educational, legal, or program-placement advice.</em></p>`;

for (const p of posts) {
  const url = `https://casadesam.org/blog/${p.slug}.html`;
  const image = `https://casadesam.org/assets/blog/${datePath}/${p.slug}/social.jpg`;
  const schema = JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:p.title,description:p.desc,image,datePublished:'2026-10-16',dateModified:'2026-10-16',author:{'@type':'Person',name:'Amie Marse'},publisher:{'@type':'Organization',name:'Casa de SAM',url:'https://casadesam.org'},mainEntityOfPage:{'@type':'WebPage','@id':url}});
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${p.title} | Casa de SAM Blog</title><meta name="description" content="${p.desc}"><meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="canonical" href="${url}"><meta property="og:title" content="${p.title}"><meta property="og:description" content="${p.subtitle}"><meta property="og:type" content="article"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}"><meta property="article:published_time" content="2026-10-16"><meta property="article:modified_time" content="2026-10-16"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="../css/main.css"><script type="application/ld+json">${schema}</script></head><body><header class="sam-nav"><div class="sam-nav-inner"><a class="sam-brand" href="../index.html">Casa de SAM</a><nav class="sam-nav-links" aria-label="Primary navigation"><a href="../mission.html">Mission</a><a href="../why-paraguay.html">Why Paraguay</a><a href="../sustainability.html">Sustainability</a><a href="../philosophy.html">Philosophy</a><a href="../timeline.html">The Long View</a><a class="is-current" href="../blog.html" aria-current="page">Blog</a></nav></div></header><main class="blog-article"><article><header class="blog-header"><p class="blog-meta">${p.category} &middot; SEPTEMBER 25, 2026</p><h1>${p.title}</h1><p class="blog-subtitle">${p.subtitle}</p></header><figure><img class="blog-feature-image" src="../assets/blog/${datePath}/${p.slug}/hero.jpg" alt="${p.alt}"><figcaption>${p.caption}</figcaption></figure>${p.body}<h2>Sources and Further Reading</h2><ul>${p.sources.map(([org,title,href]) => `<li><a href="${href}" rel="noopener noreferrer">${org}: ${title}</a></li>`).join('')}</ul>${about}<div data-blog-cta="bottom"></div><section class="blog-keep-reading"><h2>Keep reading</h2><ul>${p.reading.map(([href,title]) => `<li><a href="${href}">${title}</a></li>`).join('')}</ul></section></article></main><footer class="sam-footer reveal"><p>Casa de SAM &middot; A home for lifetimes.</p></footer><script src="../js/reveal.js"></script><script src="../js/blog-ctas.js"></script><script src="/js/gustavo.js"></script></body></html>`;
  fs.writeFileSync(path.join(root, 'blog', `${p.slug}.html`), html);
}

const cards = posts.map(p => `<article class="blog-card reveal"><a href="blog/${p.slug}.html" aria-label="Read ${p.title}"><img src="assets/blog/${datePath}/${p.slug}/hero.jpg" alt="${p.alt}"></a><div class="blog-card-content"><p class="blog-meta">${p.category} · September 25, 2026</p><h2><a href="blog/${p.slug}.html">${p.title}</a></h2><p>${p.subtitle}</p><a class="blog-card-link" href="blog/${p.slug}.html">Read the full article</a></div></article>`).join('\n');
let index = fs.readFileSync(path.join(root, 'blog.html'), 'utf8');
if (!index.includes(`blog/${posts[0].slug}.html`)) {
  index = index.replace('<section class="blog-list" aria-label="Casa de SAM articles">', `<section class="blog-list" aria-label="Casa de SAM articles">\n${cards}`);
}
fs.writeFileSync(path.join(root, 'blog.html'), index);

let sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').replace(/(<loc>https:\/\/casadesam\.org\/blog\.html<\/loc>\s*<lastmod>)[^<]+/, '$12026-10-16');
if (!sitemap.includes(`${posts[0].slug}.html</loc>`)) {
  const urls = posts.map(p => `  <url>\n    <loc>https://casadesam.org/blog/${p.slug}.html</loc>\n    <lastmod>2026-10-16</lastmod>\n    <priority>0.8</priority>\n  </url>`).join('\n\n');
  sitemap = sitemap.replace('</urlset>', `${urls}\n</urlset>`);
}
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
