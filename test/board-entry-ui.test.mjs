import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../js/gustavo.js',import.meta.url),'utf8');
test('board page gets explicit public topic and direct FAQ launch without a synthetic user message',()=>{
  assert.match(source,/dataset.gustavoContext === "board"/);
  assert.match(source,/entryContext: boardPage \? "board" : undefined/);
  assert.match(source,/data-gustavo-board-chat/);
  assert.match(source,/casa:languagechange/);
  assert.match(source,/if \(!boardPage && data.boardInterest\)/);
});
test('chat guards concurrent requests and restores focus on dismiss',()=>{
  assert.match(source,/if \(asking\) return/);
  assert.match(source,/event.key === "Escape"/);
  assert.match(source,/returnFocus\?\.focus\(\)/);
});
test('floating launcher retains an accessible name when mobile CSS hides its label',()=>{
  assert.match(source,/class="gustavo-launch"[^>]*aria-label="Ask Gustavo"/);
  assert.match(source,/launch.setAttribute\("aria-label", es \? "Preguntale a Gus" : "Ask Gus"\)/);
});
