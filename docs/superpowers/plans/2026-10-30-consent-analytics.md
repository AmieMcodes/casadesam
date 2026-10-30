# Casa Consent Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Prepare disabled-by-default, explicit opt-in basic traffic analytics without collecting Gustavo/form content.

**Architecture:** A first-party module is loaded independently by the existing shared reveal script. It uses fixed public-page metadata, an opt-in controller and small footer settings UI. Google remains unloaded until consent. The verified account handoff provides real ID `G-GYF79S5CW7` and authorizes normal PR/merge/deployment with consent enforcement enabled.

**Tech Stack:** Existing static HTML/vanilla JS, ES modules, Node built-in test runner; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-30-consent-analytics.md`

## Global Constraints
- Preparation was branch-only. Release addendum authorizes normal PR/merge/deploy after settings verification; no PR approval review action.
- Release: `enabled: true`, measurement ID `G-GYF79S5CW7` (verified staging handoff); exact HTTPS `casadesam.org` guard.
- Never send form/chat content, raw URLs/referrers/titles, advertising consent or optional sharing.
- Preserve existing reveal behavior; no hosting or Gustavo changes.
- Consent lifetime 90 days, version 1; unavailable persistence is current-page-only consent.
- Revoke without reload or denial ping. No local Chromium workaround.

## Review Focus
- Async library response after revoke must not configure or measure.
- Storage denial/corruption/expiry must not imply consent.
- Repeated accept/revoke/reaccept must not double-load or double-count.
- Unknown/encoded routes and dynamic input must not enter metadata.
- Restored tabs and cross-tab rejection must stop collection without losing unsent content.

### Task 1: Consent controller and metadata
**Files:** Create `js/analytics-config.mjs`, `js/analytics-consent.mjs`, `test/analytics-consent.test.mjs`.
**Interfaces:** `startAnalytics(window, config)` returns null for disabled/ineligible pages, otherwise `{accept(), reject(), choice()}`. Config provides enabled, measurementId and static page metadata. Tests use a browser-boundary fixture; production code owns all gating and queue/state logic.
- [x] Write tests for disabled/empty/invalid ID, hostname/path guards, no pre-consent request, accept safe commands, reject, revoke, pending-load races, reaccept, expiry/storage failure and lifecycle revocation.
- [x] Run `node --test test/analytics-consent.test.mjs`; verify expected missing-feature failures.
- [x] Implement minimal controller and generated static metadata for current published pages. Never derive transmitted values from page/user input.
- [x] Run the same test command; expect all pass, then run `node --test`.
- [x] Commit task files locally after green.

### Task 2: Minimal integration and notice
**Files:** Modify `js/reveal.js`; create `css/analytics-consent.css`; extend `test/analytics-consent.test.mjs`.
**Interfaces:** The module auto-starts in browsers using disabled config; `startAnalytics` creates accessible notice/settings only for eligible active configuration. Loader does not depend on successful reveal initialization.
- [x] Add failing DOM-boundary tests for notice controls and settings reopening, no UI when disabled, and reveal observer/image behavior remaining functional.
- [x] Run tests, observe failure, then implement own-control listeners, scoped CSS, and appended module loader.
- [x] Run `node --test`; expect all pass. Commit locally.

### Task 3: Review and branch delivery
**Files:** Create `docs/analytics.md`; update this checklist with evidence.
**Interfaces:** Operational checklist records the real ID, confirmed account-side restrictions, and honest browser/network QA limits.
- [x] Document source-backed behavior, excluded pages/data, consent cookies, revocation limitations, and real-browser network QA still required.
- [x] Run fresh `node --test`, syntax/diff checks and independent whole-branch review; resolve important findings with failing regression tests first.
- [x] Verify fresh remote main, write an isolated branch through supported GitHub tools. Keep disabled configuration; no PR, preview, or merge (scope clarified by parent). Report exact commit, tests, review and activation blockers.

## Authorized release addendum (2026-10-30)
- [x] Verify setup-agent confirmation of account/property/stream, all requested privacy settings, and release authority.
- [x] Write default release-config regression, observe failure while disabled, enable consent module, then run full suite.
- [ ] Push release commit, create draft PR, verify exact head and Netlify preview, then normal merge/deploy.
- [ ] Verify live delivery; coordinate consented browser test and account-side Realtime check, reporting network-inspector/mobile limits.
