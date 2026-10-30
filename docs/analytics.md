# Optional basic traffic analytics

**Release configuration (2026-10-30):** `js/analytics-config.mjs` has `enabled: true` and verified public measurement ID `G-GYF79S5CW7`. Google still remains unloaded until valid opt-in. Release is authorized through the reviewed branch, normal PR checks/merge and Netlify deployment under the original installation request. No advertising or chat/form collection is authorized.

## Confirmed account/stream handoff (2026-10-30)

The owner-account setup agent verified account `414218332`, property `561684841`, **Casa de SAM website** stream `16239335133`, for `https://casadesam.org`, measurement ID `G-GYF79S5CW7`. Approved regional terms were accepted. Confirmed settings:

- All optional account sharing **off**.
- Entire Enhanced Measurement **off**, persisted.
- Google Signals **off** (the UI offers turning it on).
- User-provided data collection **off**.
- Ads personalization saved for **0 of 307 regions**.
- Granular location/device data **off**.

These facts come from the setup agent's actual Google UI verification; the repository agent did not independently access the account. The setup agent authorized the release handoff. No redundant generic installation approval is required. Client consent guards and privacy restrictions remain unchanged.

## What this adds

An independent first-party loader at the end of `js/reveal.js` imports the consent module. The existing image corrections and scroll reveal behavior are unchanged. No HTML pages, Gustavo scripts, forms, Netlify configuration, dependencies, or payment/delivery code are changed.

When disabled, the module renders no analytics UI, writes no consent record and loads no Google resource. When enabled, it runs only on HTTPS `casadesam.org`, on 8 fixed informational pages and the 48 published blog articles present at preparation time. Known clean paths map to the same static canonical metadata as `.html` paths. The blog template, store, payment/guide pages, unknown paths, preview deployments, localhost, other hosts and HTTP are excluded. New pages require an explicit allowlist update.

## Consent and collection

- Basic consent mode: no Google tag, analytics request, denial ping, preconnect or DNS-prefetch before opt-in. Rejecting without accepting does not load Google.
- A small in-flow notice offers equally styled accept/reject buttons. A footer **Analytics settings** control can reopen it and turn analytics off. Closing settings is not consent. No modal/overlay blocks reading or Gustavo.
- The version-1 `casa-analytics-consent-v1` localStorage record contains only a choice and expiry, for up to 90 days. Invalid/expired records are not consent. Storage read failures require explicit current-page consent. If saving a rejection fails, we also try removing any old grant. If writes and removal are both blocked, this page stays off, but an earlier saved choice can return on another page. The notice remains visible with that warning and recommends clearing saved site data; persistence cannot be guaranteed against browser storage restrictions.
- After consent, the module uses its own `casaAnalyticsLayer`, not a generic shared event layer. It manually sends one sanitized `page_view` per page load. `send_page_view: false` suppresses the configuration page view. Google may still send its standard basic `first_visit`, `session_start`, `user_engagement`, browser/device and approximate-location statistics; this is not an assertion of anonymity or literally one network event.
- Page location and title come only from the checked-in public-page allowlist. Referrer is explicitly blank, campaign fields are blank, URL passthrough is off, and the script request uses `referrerPolicy: no-referrer`. Query strings, fragments, dynamic document titles, contact details, chat messages and form entries are never added to our commands. No input/submit/chat listeners or user-ID/event API is installed.
- Google Signals and ad-personalization flags are false. Advertising storage, user-data and personalization consent remain denied. Account/stream settings still matter: **Enhanced Measurement must be entirely off**, not merely assumed off from the script. Otherwise Google can automatically observe form interactions and other unwanted events.
- GA cookies are host-only, path `/`, secure/SameSite=Lax, with a 90-day lifetime and no sliding page-load renewal. The site's `_ga` and stream-specific `_ga_<ID suffix>` cookies are cleared when off; unrelated cookies/storage are untouched.

## Revocation and async behavior

Turning analytics off sets Google's documented `ga-disable-<ID>` flag before clearing the owned queue/cookies. It sends no consent-denial command and does not reload, preserving unfinished form/chat text. A late script response cannot configure or send a page view after rejection. Reaccepting reuses the one loader and does not duplicate the same page's manual page view. Storage rejection/deletion in another tab, bfcache restore checks and a consent-expiry timer also disable collection.

Removing a script element would not unload already executed code, so the implementation relies on Google's documented disable flag instead. Data already sent, or requests already in flight before revocation, cannot be recalled. Revocation is not a request to delete historical Analytics data. If the library fails to load, analytics stays off with no retry loop; another page provides a fresh attempt if explicitly accepted.

## Release and verification checklist

1. Preserve the verified destination and all client consent/host/path restrictions. Recheck account settings if the destination or Google configuration changes. Do not assume client flags substitute for account choices.
2. Use the reviewed branch, normal PR/Netlify preview checks and normal merge. A preview host intentionally cannot initialize analytics; it tests delivery, not Google collection. No PR approval review action is implied by release authorization.
3. After production deployment, use a permitted browser for notice/accept/reject/settings and page checks. The account setup agent will check Realtime after a deliberately consented visit. Record the exact consented page/time; do not enter private test data or submit contact forms.
4. Where a network inspector is permitted, verify the actual requests:
   - Fresh/no choice and rejected: zero Google tag/collect requests and no GA cookies.
   - Explicit acceptance: one loader, one manual canonical page view; no raw query/hash/referrer/dynamic title/PII in actual requests, including standard automatic events.
   - Harmless synthetic Gustavo/form interaction: no form/chat content or interaction events. No real contact submission is needed.
   - Revoke while loading and after loaded: no new collection/cookies thereafter, apart from an already in-flight request; no reload or lost input. Reaccept does not duplicate the manual view.
   - Saved choices, expiry, cross-tab rejection, blocked storage, keyboard focus, mobile layout, and excluded routes.
5. **QA limitation:** Network-inspector access is currently policy-blocked in the available browser route; do not bypass it or claim packet-level verification. Real Google-wire, enabled mobile layout, and other browser checks not actually performed must remain explicitly unverified. Automated tests and Realtime are different evidence, not substitutes. The release handoff permits proceeding with these limits reported honestly.
6. Verify the published commit/config and unchanged unrelated content after normal deployment. Do not create a staging destination or bypass the production-host guard without separate authorization.

## Verification in this branch

Run `node --test` after installing the existing package dependency. No new dependency is required. Analytics tests execute the real controller against a small fake browser boundary and inspect the exact Google loader/command payload. They cover disabled/invalid configuration, host/path guards, rejection, saved consent, expiry, storage failure, async revoke/reaccept, failed load, cross-tab/bfcache handling, UI controls and unchanged reveal/image behavior.

**Limit:** These tests do not load Google and do not prove Google's remote library, server settings, HTTP behavior or real layout/accessibility. Actual-network and any unperformed desktop/mobile visual QA remain outstanding; see the release limitations above. Existing repository tests are also run; there is no existing npm test script.

## Primary references checked 2026-10-30

- [Basic vs advanced consent mode](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Consent implementation and consent types](https://developers.google.com/tag-platform/security/guides/consent)
- [Privacy settings and the ga-disable flag](https://developers.google.com/tag-platform/security/guides/privacy)
- [GA4 configuration fields](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Manual page views](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [Enhanced Measurement and automatic form events](https://support.google.com/analytics/answer/9216061?hl=en)
- [Named data layer](https://developers.google.com/tag-platform/tag-manager/datalayer)

- [Google partner-site privacy information](https://policies.google.com/technologies/partner-sites)
- [GA4 cookie usage](https://support.google.com/analytics/answer/11397207)
