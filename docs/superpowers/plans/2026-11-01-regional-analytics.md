# Regional Analytics Implementation Plan

> **For agentic workers:** Use executing-plans to implement task-by-task.

**Goal:** Regional analytics plus compact bottom consent, including owner-requested unknown-on.
**Architecture:** Uncached trusted Netlify country endpoint; first-party loader waits for policy; existing controller gains an automatic (never persisted as consent) state.
**Tech Stack:** Vanilla JS/CSS, Netlify Edge, Node tests.
**Spec:** docs/superpowers/specs/2026-11-01-regional-analytics-design.md

## Global Constraints
No new paid service, IP logging, client-supplied geography, advertising, chat/form collection, blog edits, or premature publication. Unknown/error/timeout means automatic ON, but saved No wins.

## Review Focus
- Reject during a pending lookup/Google load stays off.
- Country changes never reuse automatic collection as explicit consent.
- Unknown-on after timeout must not race a late consent-required response into duplicate loading.
- Small-screen and open-chat UI must remain usable.
- Country responses must never be reused across visitors by caches.

## Tasks
- [x] Add failing endpoint tests for EEA/UK/CH/other/unknown and spoofed input, no-store headers.
- [x] Implement edge endpoint and run tests.
- [x] Add failing regional initialization/controller tests for ordering, error/timeout, saved No, automatic revocation, deep routes.
- [x] Implement region resolver/bootstrap and automatic state; run full suite.
- [x] Add UI contract tests, compact accessible notice/details CSS and collision handling; verify available browser route.
- [x] Update privacy explanation, documented risk and verification limits; full tests and independent review.
- [ ] Verify exact production deployment after authorized merge.
