# Optional basic traffic analytics — prepared, NOT activated

**Status (2026-10-30):** `js/analytics-config.mjs` intentionally has `enabled: false` and the verified public measurement ID `G-GYF79S5CW7`. This branch must not be merged/activated as part of the preparation task. The production site has not been changed by this work.

## Account/stream handoff (2026-10-30)

The owner-account setup agent verified the **Casa de SAM website** stream for `https://casadesam.org`, stream ID `16239335133`, measurement ID `G-GYF79S5CW7`. Approved regional terms were accepted, all optional account sharing is off, and Enhanced Measurement is off with the setting persisted. Google Signals/advertising settings are still being checked. This source is the setup agent's verified Google UI handoff; the repository agent did not independently access the account.

The real ID is staged only. `enabled: false` still makes the module inert. Wait for the setup agent's remaining settings confirmation and release handoff before enabling or merging. The user's original installation authorization remains the basis; no redundant generic installation approval is needed.

## What this adds

An independent first-party loader at the end of `js/reveal.js` imports the consent module. The existing image corrections and scroll reveal behavior are unchanged. No HTML pages, Gustavo scripts, forms, Netlify configuration, dependencies, or payment/delivery code are changed.

When disabled, the module renders no analytics UI, writes no consent record and loads no Google resource. If explicitly activated later, it runs only on HTTPS `casadesam.org`, on 8 fixed informational pages and the 48 published blog articles present at preparation time. Known clean paths map to the same static canonical metadata as `.html` paths. The blog template, store, payment/guide pages, unknown paths, preview deployments, localhost, other hosts and HTTP are excluded. New pages require an explicit allowlist update.

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

## Required before any later activation

1. Real stream/measurement IDs are staged from the verified account handoff above. Recheck the destination before release; never substitute a test/placeholder ID.
2. Verify the stream's **entire Enhanced Measurement setting is off**, Google Signals/advertising/user-provided-data collection are off, optional account data sharing is off, and no connected advertising destinations/tags are enabled. Do not assume client flags substitute for the account choices.
3. Inspect current public/privacy wording and the enabled notice for accuracy against the actual property settings. This file is implementation guidance, not a new broad legal policy.
4. Wait for the setup agent to confirm the remaining settings and authorize the release handoff under the existing installation request. Only then set `enabled: true`; keep host/path guards and all restrictions. This staging task does not activate or merge.
5. Use a permitted browser and actual network inspector (no local Chromium policy bypass):
   - Fresh/no choice and rejected: zero Google tag/collect requests and no GA cookies.
   - Explicit acceptance: one loader, one manual canonical page view; no raw query/hash/referrer/dynamic title/PII in the **actual requests**, including standard automatic events.
   - Exercise Gustavo and forms with harmless synthetic text; no form/chat/interaction content/events sent. Do not submit real contact forms merely for QA.
   - Revoke both while loading and after loaded: no new collection/cookies thereafter, apart from an already in-flight request; no reload or lost input. Reaccept does not duplicate the manual view.
   - Check saved choices, expiry, cross-tab rejection, blocked storage, keyboard focus, mobile layout, and excluded routes.
6. Verify production after an authorized merge. This preparation is branch-only: no PR or preview deployment is created. A disabled build would not prove real Google-network behavior. If a separate staging stream is needed for network QA, obtain approval for that additional destination rather than bypassing the production-host guard.

## Verification in this branch

Run `node --test` after installing the existing package dependency. No new dependency is required. Analytics tests execute the real controller against a small fake browser boundary and inspect the exact Google loader/command payload. They cover disabled/invalid configuration, host/path guards, rejection, saved consent, expiry, storage failure, async revoke/reaccept, failed load, cross-tab/bfcache handling, UI controls and unchanged reveal/image behavior.

**Limit:** These tests do not load Google and do not prove Google's remote library, server settings, HTTP behavior or real layout/accessibility. Actual-network and desktop/mobile visual QA remain outstanding before activation. Existing repository tests are also run; there is no existing npm test script.

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
