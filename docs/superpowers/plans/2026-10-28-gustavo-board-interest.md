# Gustavo Board Interest Implementation Plan

> For agentic workers: implement inline with the executing-plans workflow. The user approved the eight-question conversation, commitment wording, privacy boundaries and email handoff.

**Goal:** Let interested visitors discuss board service with Gus, review their answers, and authorize one email to Amie.
**Architecture:** A signed, expiring interview state preserves all answers independently of general chat history. A dedicated Netlify handler drives eight bilingual questions with at most one model-assisted follow-up per topic. The browser renders an editable review; Resend sends only after explicit consent, with durable duplicate receipts containing no answer text.
**Tech Stack:** Existing vanilla JS, Node, Netlify Functions/Blobs, AI Gateway, Resend.
**Spec:** User-approved board conversation and respectful follow-up examples in this session.

## Global Constraints
- Target founding board by February 2027 for nonprofit paperwork; no promise of appointment.
- Through 2030: approximately 20 hours/year or less, virtual meetings/document review. Around 2030: fresh choice; quarterly meetings and project work, potentially monthly during active periods.
- Intended residents have substantial lifelong support needs and cannot sustain traditional employment; no required classes/work or earning a home.
- One question at a time; normally one follow-up maximum. Skip/decline is respected. No probing for diagnosis, trauma, religion, finances or private family details.
- Preserve actual answers and uncertainties, no scoring or inferred motives.
- Review, editable answers, name/email and explicit consent before sending to a fixed verified recipient.
- No applicant answers in browser persistence, URLs or durable server records by default.

## Review Focus
- Earlier answers survive more than twelve chat turns.
- Tampered/expired state, missing consent and invalid email cannot send.
- Follow-up declines never trigger more probing; unrelated role questions can be clarified without becoming an applicant answer.
- Resend failure is not presented as sent; retry cannot send duplicates.
- HTML in answers stays inert in review and email.

## Tasks
- [ ] Test signed interview state, eight-question progression, skip/follow-up limits, review and email content; implement core.
- [ ] Test handler consent, validation, retries and duplicate suppression; implement handler with injectable model/mail/store.
- [ ] Add explicit board invitation in general Gus chat and a bilingual interview/review UI.
- [ ] Configure fixed Amie recipient and state signing secret without changing existing keys.
- [ ] Run full tests, inspect browser flow, publish the verified complete Git tree, test live and send one clearly labeled synthetic test inquiry to Amie.
