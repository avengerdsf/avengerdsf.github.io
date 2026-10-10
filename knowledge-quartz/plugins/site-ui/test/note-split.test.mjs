import test from 'node:test';
import assert from 'node:assert/strict';
import { splitWidths } from '../src/note-split.mjs';

test('wide notes give the solution more room and preserve the divider space', () => {
  const result = splitWidths(3132);
  assert.notEqual(result, null);
  assert.equal(result.left, (3132 - 24) * 0.44);
  assert(result.right > result.left);
  assert.equal(result.left + result.right + 24, 3132);
});

test('dragging either way cannot shrink the problem or solution below its minimum', () => {
  for (const width of [1100, 1389, 2093, 3132]) {
    for (const ratio of [-1, 0, 0.44, 1, 2]) {
      const result = splitWidths(width, ratio);
      assert.notEqual(result, null);
      assert(result.left >= 420);
      assert(result.right >= 520);
      assert(Math.abs(result.left + result.right + 24 - width) < 0.000001);
    }
  }
  assert.equal(splitWidths(1389, -1).left, 420);
  assert.equal(splitWidths(1389, 2).right, 520);
});

test('small windows stack the cards instead of forcing minimum widths offscreen', () => {
  for (const width of [0, 320, 820, 1099]) assert.equal(splitWidths(width), null);
  assert.notEqual(splitWidths(1100), null);
});

test('an invalid saved proportion falls back to the default columns', () => {
  for (const ratio of [NaN, Infinity, -Infinity]) assert.deepEqual(splitWidths(1389, ratio), splitWidths(1389));
});
