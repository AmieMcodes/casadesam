import test from "node:test";
import assert from "node:assert/strict";

import { CASA_KNOWLEDGE, PUBLIC_INSTRUCTIONS } from "../netlify/functions/_shared/gustavo-knowledge.mjs";

test("Gustavo knows the canonical public vision-document URL", () => {
  assert.match(CASA_KNOWLEDGE, /https:\/\/casadesam\.org\/casa-de-sam-vision\.pdf/);
});

test("Gustavo gives direct links when a known public resource answers the visitor", () => {
  assert.match(PUBLIC_INSTRUCTIONS, /give the direct public URL/i);
});
