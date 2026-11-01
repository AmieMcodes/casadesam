// Visual-only fixture. Never available on production and never enables real Google requests.
const headers = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'private, no-store',
  'CDN-Cache-Control': 'no-store',
  'Netlify-CDN-Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self'; img-src 'self' data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff'
};
export default function analyticsPreview(_request, context) {
  if (context.deploy?.context !== 'deploy-preview') return new Response('Not found', {status:404,headers});
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Casa analytics layout preview</title><link rel="stylesheet" href="/css/main.css"></head><body>
<header class="sam-nav"><div class="sam-nav-inner"><a class="sam-brand" href="/">Casa de SAM</a></div></header>
<main><section class="sam-section"><div class="sam-kicker">Visual QA only — not live analytics</div><h1>A quiet notice, not a page takeover.</h1><p>This preview uses the actual consent interface and Gustavo layout. All external requests and form submissions are blocked. Do not enter personal information.</p><p>Check the bottom notice, expand Details, open and close Gustavo, reject, then reopen Analytics settings below. Accept may show the expected blocked-loader warning because Google is deliberately disabled here.</p><p>Regional policy and actual production collection require separate verification; this fixture does not simulate Netlify geography.</p></section></main>
<footer class="sam-footer"><p>Casa de SAM · Layout preview</p></footer>
<script src="/js/gustavo.js"></script><script type="module">
import { startAnalytics } from '/js/analytics-consent.mjs';
// Fixture location only: production bootstrap and its host checks are unchanged.
const facade = {document, location:{hostname:'casadesam.org',protocol:'https:',pathname:'/'}, localStorage, Date, setTimeout:window.setTimeout.bind(window), clearTimeout:window.clearTimeout.bind(window), addEventListener:window.addEventListener.bind(window), ResizeObserver};
startAnalytics(facade);
</script></body></html>`,{headers});
}
export const config = {path:'/analytics-preview'};
