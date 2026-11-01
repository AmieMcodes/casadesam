// Site policy, not a statement that these are the only consent-required jurisdictions.
const CONSENT_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL',
  'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH'
]);

export default function analyticsRegion(_request, context) {
  // Only trusted Netlify context. Never query strings, request headers or an IP service.
  // Missing/unrecognized geography intentionally defaults ON at the owner's request.
  const mode = CONSENT_COUNTRIES.has(context.geo?.country?.code) ? 'consent' : 'automatic';
  return Response.json({ mode }, { headers: {
    'Cache-Control': 'private, no-store',
    'CDN-Cache-Control': 'no-store',
    'Netlify-CDN-Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }});
}

export const config = { path: '/analytics-region' };
