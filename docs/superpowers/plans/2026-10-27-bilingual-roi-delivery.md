# Bilingual ROI delivery implementation plan

> For agentic workers: implement inline using the executing-plans workflow. The user has authorized updating checkout delivery.

**Goal:** One purchase sends one email with both finished PDFs, clearly labeled English and Spanish.

**Architecture:** Keep the existing Stripe webhook, Resend sender, consent links and session-based duplicate prevention. Store the two private PDFs together in one versioned Blobs JSON bundle so a release cannot expose a half-updated pair. Validate both PDFs before sending. Preserve the current admin upload credential; use a separate scoped automation credential for this upload.

**Tech stack:** Existing JavaScript Netlify functions, Netlify Blobs, Resend, Node test runner.

**Spec:** User request in this session: update checkout delivery so both items are sent, with a clear English/Spanish email.

## Global constraints

- Existing $4.99 payment link and transaction sender remain unchanged.
- PDF files stay private, outside the public repository.
- Keep optional quarterly updates at exactly four emails per year, with separate consent.
- Keep durable duplicate-delivery protection and the existing Resend idempotency key.
- Never send just one edition when the bundle is missing or invalid; let Stripe retry.

## Review focus

- Missing/corrupt Spanish PDF must fail before sending.
- Labels and filenames must match actual PDF contents.
- Upload validation must occur before replacing the live bundle.
- Existing upload credentials must continue to work.
- No test may fabricate a paid transaction or email an actual buyer.

## Task 1: Bundle and delivery payload

- [ ] Add failing tests for two distinct labeled PDF attachments, corruption rejection and missing bundle rejection.
- [ ] Implement `createRoiBundle`, `readRoiBundle` and `buildRoiDeliveryEmail` in `netlify/functions/lib/roi-workbook.mjs`.
- [ ] Integrate the bundle with `stripe-fulfillment.mjs`, preserving payment verification, state records and consent links.
- [ ] Extend the authenticated uploader to accept both PDFs and report their hashes for verification.
- [ ] Update the purchase page to explain both editions are included.
- [ ] Run the full Node test suite and review the diff.

## Task 2: Release and verification

- [ ] Deploy the uploader, bundle helper and tests first; retain the existing webhook until the private bundle is verified.
- [ ] Upload the exact completed English and Spanish PDFs using the authenticated admin route.
- [ ] Read back bundle metadata and compare both SHA-256 hashes and sizes with the source files.
- [ ] Deploy the bilingual webhook and product-page copy only after the bundle verification passes.
- [ ] Check the live purchase page and unauthenticated webhook rejection. Do not charge a card or trigger customer resends.
