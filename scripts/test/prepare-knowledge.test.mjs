import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHomeTokens } from '../prepare-knowledge.mjs';
test('knowledge theme reuses both homepage token blocks without homepage layout rules', () => {
  const input = ':root {\n  --bg: #fff;\n  --radius-md: 20px;\n}\n\nhtml[data-theme="dark"] {\n  --bg: #000;\n}\n\nbody { margin: 0; }';
  const css = extractHomeTokens(input);
  assert.match(css, /--radius-md: 20px/);
  assert.match(css, /:root\[saved-theme="dark"\]/);
  assert.doesNotMatch(css, /body|data-theme/);
});
test('missing homepage token definitions fail the build instead of silently drifting', () => {
  assert.throws(() => extractHomeTokens('body { color: red }'), /theme token/);
});
