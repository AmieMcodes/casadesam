# Board Landing Implementation Plan

> **For agentic workers:** Use task-by-task implementation and independent whole-branch review.

**Goal:** Publish an English/Spanish founding-board information page with an explicit-consent contact form and separate anonymous Gus questions.

**Architecture:** Reuse the static Casa website and Netlify functions. A distinct signed contact state uses the existing mail configuration and receipts; the public chat receives only a server-allowlisted topic context, never form data.

**Tech Stack:** Static HTML/CSS, vanilla JavaScript, Node test runner, existing Netlify Blobs and mail integration.

**Spec:** User's November 2 approved discussion: information first, Paraguayan and American candidates, modest initial planning contribution, target Paraguay nonprofit plus US Friends organization formation February–March 2027, explicit sharing with Amie and personal follow-up. No appointment or guaranteed formation date. Existing PDFs remain available.

## Global Constraints
- Preserve existing site, analytics and blogs. No new credentials or services.
- Visiting/chatting does not consent to contact sharing. Never submit a transcript with the contact form.
- Do not minimize legal board duties or invent a time commitment.
- Synthetic tests only; do not send real emails or invoke paid model calls for testing.

## Review Focus
- Repeated submission/retry retains identity and receipt protection without duplicate mail.
- Invalid/expired/cross-purpose state cannot authorize mail.
- Board context cannot elevate public chat permissions; unknown contexts are ignored.
- English/Spanish, keyboard focus, mobile, close/reopen, and back navigation remain usable.
- Formation target and longer founding-phase document dates must not be confused.

## Tasks
- [ ] Backend: failing tests for separate signed contact state, validation, explicit consent, field-only email, replay and retry; implement start-contact/submit-contact using existing mail; run tests.
- [ ] Page: failing structural/controller tests; implement board.html, css/board.css and js/board.mjs with translated content and consent form; verify no transcript and retry handling.
- [ ] Context/integration: failing allowlist and API tests; implement server-owned public board instructions and frontend board welcome, direct launch, no duplicate interview/contact funnel; add route, discoverable links and corrected current copy.
- [ ] Run all node tests, syntax checks and independent review; use supported browser preview for desktop/mobile UI if available. Fix issues and retest.
- [ ] Commit/push draft PR, verify checks and merge authorized work; verify Netlify publication and live /board without sending mail/model requests. Report exact evidence and limits.
