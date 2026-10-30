# Optional basic traffic analytics (branch preparation)

## Approved scope
Prepare and install basic consent-based Google Analytics for Casa de SAM. Basic traffic only; no advertising, optional sharing, Gustavo conversations, or form content. Preparation stayed disabled; the later account handoff verified public ID `G-GYF79S5CW7` (stream `16239335133`) and all requested privacy settings, then authorized normal PR/merge/deployment under the original installation request. Release configuration is enabled but collection still requires valid opt-in. No account changes or PR approval action are part of this repository task.

## Design
- Preserve the existing reveal/image behavior byte-for-byte; append an independent first-party module loader. No broad HTML rewrite, dependencies, server functions, or hosting-config changes.
- A dedicated configuration/module pair exposes optional analytics only on HTTPS `casadesam.org` and an explicit allowlist of 56 existing informational/blog pages (including clean-path aliases). Exclude checkout/store/guide forms, unknown paths, and the blog template. No dynamic title, query string, fragment, or referrer is sent.
- Disabled/empty-ID/preview/unknown-page states show no consent UI and make no Google request. A valid enabled production page shows a small in-flow opt-in region and persistent footer settings button. Reject is as easy as accept. Closing settings is not consent.
- Use basic consent mode: do not load Google, preconnect, or ping before explicit or valid remembered opt-in. Use a private named data layer; manual sanitized page_view; automatic config page view suppressed; Google Signals and ad-personalization disabled, all advertising consent denied, no URL passthrough. Enhanced Measurement must be entirely disabled on the stream before activation; it cannot be safely assumed from client code. Google may still send standard first_visit/session_start/user_engagement and basic device/browser statistics after consent.
- Store only a versioned granted/denied choice with 90-day expiry. Invalid, expired, or unavailable stored choices never imply consent. Storage failure permits explicit consent only for the current page. Revoke sets the documented `ga-disable-ID` flag first, cancels future initialization, clears the site's GA cookies, and does not reload or send a denial command. Previously sent/in-flight requests cannot be recalled. Reaccept reuses a pending/loaded script and emits no duplicate manual page view on the same page. Cross-tab rejection and restored-page/expiry checks also disable collection.
- The Google library is external code. Unit tests verify our loader boundary and commands, not Google's wire behavior. The actual stream ID and account/stream restrictions are verified in the handoff. Permitted-browser/network inspection is still the appropriate verification for reject, opt-in, form/chat activity and revoke; where inspector access is policy-blocked, report that limit rather than bypass it. No local Chromium workaround.

## UI and data boundaries
The notice explains optional traffic statistics, analytics cookies, and that the site's implementation does not send chat messages or form entries. It does not claim anonymity or provide a new broad legal/privacy policy. Buttons listen only to their own controls; lifecycle listeners are limited to storage/pageshow. No input/submit/chat listeners or DOM-content payload extraction.

## Sources (checked 2026-10-30)
- https://developers.google.com/tag-platform/security/concepts/consent-mode — basic vs advanced mode.
- https://developers.google.com/tag-platform/security/guides/consent — consent types/commands.
- https://developers.google.com/tag-platform/security/guides/privacy — ga-disable flag.
- https://developers.google.com/analytics/devguides/collection/ga4/reference/config — metadata, cookie and ad-signal settings.
- https://developers.google.com/analytics/devguides/collection/ga4/views — manual page views.
- https://support.google.com/analytics/answer/9216061?hl=en — enhanced form/interaction measurement.
- https://developers.google.com/tag-platform/tag-manager/datalayer — named data layer.
