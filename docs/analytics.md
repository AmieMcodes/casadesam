# Regional traffic analytics

## Owner-approved policy — November 1, 2026

This supersedes the October 30 worldwide opt-in design. Google Analytics is an optional site feature, not required for reading or using Gustavo. The owner requested a compact bottom-floating notice only for visitors classified in the EEA, UK or Switzerland. Other countries use automatic analytics. **Unknown country, malformed response, lookup failure or a 1.5-second timeout also default to automatic ON, as expressly requested after the risk was explained.** A consent-required visitor can therefore be measured when location detection fails or is inaccurate. This is not a fail-safe compliance configuration or a finding that all other jurisdictions permit collection.

A saved valid rejection overrides every region and every lookup outcome. A valid explicit acceptance is remembered for up to 90 days. Automatic collection is a separate in-memory state and is never saved as an explicit acceptance. A later visit from a consent region without an actual saved acceptance will ask first.

## Destination and retained collection limits

`js/analytics-config.mjs` enables verified stream `G-GYF79S5CW7` on HTTPS `casadesam.org`, only on its explicit informational-page/blog allowlist. Store, payment/guide pages, unknown paths, preview deployments, localhost and HTTP remain excluded. Clean aliases use fixed canonical metadata. When disabled there is no analytics UI, policy lookup or Google load.

Account setup evidence from October 30 records account `414218332`, property `561684841`, stream `16239335133`: optional sharing off; Enhanced Measurement entirely off; Google Signals off; user-provided data off; ad personalization off in all regions; granular location/device data off. These are prior setup-agent observations, not a new independent account audit.

After explicit acceptance or automatic-region initialization, the controller loads one Google tag and sends one manual sanitized page view. Google's normal basic session/engagement events may also occur. No claim of anonymity or literally one network event is made. Query strings, fragments, referrers, dynamic titles, chat messages, form entries, user IDs and advertising events are not added to our commands. Google may receive normal browser/device/network information. Advertising consent remains denied, personalization/signals flags false, and Enhanced Measurement must stay off at account level.

## Trusted country decision and caching

`netlify/edge-functions/analytics-region.js`, bound only to `/analytics-region`, reads Netlify's `context.geo.country.code`. It ignores query strings and client headers. It returns only `{mode: 'consent'}` or `{mode: 'automatic'}`; application code stores/logs neither IP address nor country and calls no third-party location provider. Netlify still processes requests in its ordinary hosting role. IP-based location is approximate and can reflect VPN/proxy location.

The endpoint sends `Cache-Control: private, no-store`, `CDN-Cache-Control: no-store` and `Netlify-CDN-Cache-Control: no-store`; edge response caching is not enabled. The browser fetches with `cache: no-store`, same-origin credentials and redirects disallowed. Static page caching is unchanged. Never cache a country decision across visitors or use a GA reporting filter as a substitute for deciding before tag load.

`startRegionalAnalytics` waits for the endpoint (including JSON parsing) or the bounded timeout before starting the controller. A late result is ignored after the first decision. Repeated initialization reuses the same promise. There is no preconnect, DNS-prefetch or Google tag before that decision. Known consent-region visitors without acceptance send no Google requests, including no cookieless denial pings. Automatic-region and unknown-location visitors are intentionally different: they do send analytics without an affirmative click unless a saved rejection applies.

## Choices, storage and revocation

The version-1 `casa-analytics-consent-v1` localStorage record holds only explicit choice and expiry for up to 90 days. Invalid or expired records are not explicit consent. In consent regions they require a new choice; in automatic/unknown regions the regional default applies. If storage cannot be read, a previously saved rejection cannot be recovered: consent regions remain off, while automatic/unknown regions follow the owner's ON default. This limitation is disclosed in the interface; no browser implementation can promise to honor unreadable state.

If a rejection cannot be saved, the controller tries removing an older grant, stays off on the current page, and shows a persistence warning. If both operations fail, a previous grant can return on a later page. Automatic collection is never persisted as a grant. Rejecting in an automatically measured region creates the same 90-day rejection as elsewhere.

Turning analytics off sets Google's documented disable flag first, clears the owned queue and GA cookies, and sends no denial ping. Pending script completion rechecks storage before initialization. No page reload loses chat/form input. Cross-tab rejection, bfcache checks and explicit-consent expiry stop collection. Already transmitted data or in-flight requests cannot be recalled. A failed Google load stays off for that page and records rejection; no retry loop. Reaccepting reuses the loader and does not duplicate that page's manual view.

## Interface

A compact bottom-floating line has equally styled Accept/Reject controls and native expandable Details with the full data explanation, region/unknown policy, persistence status and links. A footer Analytics settings control remains available in every measured region. Automatic visitors see no initial banner. Settings opens Details and supports turning analytics off. Closing is not acceptance. Explicit choices remain optional.

At narrower widths, the line wraps rather than shrinking text or overflowing horizontally. A ResizeObserver reserves vertical room for the notice and shifts Gustavo above it; expanded details are scrollable and the chat panel is height-limited to the remaining viewport. This requires real viewport verification in a permitted browser; static assertions are not a substitute.

## Verification and deployment

Run `node --test` with the existing dependency installed. Tests cover the 32 consent countries, automatic/unknown outcomes, forged request geography ignored, all no-store headers, lookup ordering, malformed/network/HTTP/JSON/timeout fallback, deep blog aliases, saved denial, automatic-state non-persistence, revocation, late loads, cross-tab and bfcache, sanitized commands and existing site behavior. No new dependency is required.

Local browser screenshot attempt on November 1 was blocked: sandbox Chromium failed `socket() ... Operation not permitted`; escalation failed sandbox setup with a read-only protected runtime path. No bypass was attempted. **Desktop/mobile screenshots, live Netlify edge deployment and actual Google-wire behavior are not yet verified.** Existing fake-browser tests do not establish those results. A local CSP-blocked preview script is prepared outside the repo for visual-only QA. The `/analytics-preview` edge route is available only when trusted Netlify deploy context equals `deploy-preview`; production and other contexts return 404. Its CSP blocks external scripts/connections and forms. It is a layout fixture, not real regional or Google-wire verification.

Before release, rebase on current main to retain independently published blog updates, run the complete suite, review the exact diff, and obtain release direction. After authorized deployment, verify exact commit, edge endpoint mode and no-store headers, production bundle, known-country/unknown behavior through permitted means, and clear opt-out access. Do not fake production country headers or weaken host restrictions to manufacture passing evidence.

## Primary references

- https://docs.netlify.com/build/edge-functions/api/#geo
- https://docs.netlify.com/build/edge-functions/declarations/
- https://marketingplatform.google.com/about/analytics/terms/us/
- https://developers.google.com/tag-platform/security/guides/privacy
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- https://support.google.com/analytics/answer/9216061
