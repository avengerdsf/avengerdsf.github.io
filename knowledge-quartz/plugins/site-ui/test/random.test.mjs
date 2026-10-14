import test from 'node:test';
import assert from 'node:assert/strict';
import { leetcodeProblemNotes, shuffleNotes, randomNoteNavigation } from '../src/random.mjs';

const file = (slug, title, extra = {}) => ({slug, filePath:`content/${slug}.md`, relativePath:`${slug}.md`, frontmatter:{title}, ...extra});

test('random browsing contains real LeetCode problems without guides or hidden notes', () => {
  const files = [file('leetcode/index','力扣算法'),file('leetcode/dp/index','动态规划'),file('leetcode/dp/overview','状态说明'),file('leetcode/dp/a','A 题目'),file('leetcode/tree/b','B 题目'),file('leetcode/private','隐藏',{draft:true}),file('leetcode/unlisted','隐藏',{unlisted:true}),{slug:'leetcode/generated',relativePath:'leetcode/generated.md'},file('leetcode-archive/a','旧资料'),file('machine-learning/a','机器学习')];
  assert.deepEqual(leetcodeProblemNotes(files), [{slug:'leetcode/dp/a',title:'A 题目'},{slug:'leetcode/tree/b',title:'B 题目'}]);
});

test('shuffling reorders every note without losing or mutating the original list', () => {
  const notes = ['A','B','C','D'];
  assert.deepEqual(shuffleNotes(notes, () => 0), ['B','C','D','A']);
  assert.deepEqual(notes, ['A','B','C','D']);
});

test('shuffling accepts an empty or single-note collection', () => {
  assert.deepEqual(shuffleNotes([], () => 0), []);
  assert.deepEqual(shuffleNotes(['A'], () => 0), ['A']);
});

test('next problem follows the saved shuffle rather than category or problem number', () => {
  const notes = ['leetcode/heap/p4083', 'leetcode/tree/p4062', 'leetcode/array/p4003'];
  const state = {active:true, order:['leetcode/tree/p4062', 'leetcode/array/p4003', 'leetcode/heap/p4083']};
  assert.deepEqual(randomNoteNavigation(state, 'leetcode/tree/p4062', notes), {position:1, total:3, nextSlug:'leetcode/array/p4003'});
  assert.deepEqual(randomNoteNavigation(state, 'leetcode/array/p4003', notes), {position:2, total:3, nextSlug:'leetcode/heap/p4083'});
  assert.deepEqual(state.order, ['leetcode/tree/p4062', 'leetcode/array/p4003', 'leetcode/heap/p4083']);
});

test('the last shuffled problem has no next destination', () => {
  const state = {active:true, order:['leetcode/heap/p4083']};
  assert.deepEqual(randomNoteNavigation(state, 'leetcode/heap/p4083', state.order), {position:1, total:1, nextSlug:null});
});

test('random navigation skips removed notes and ignores inactive or unrelated browsing', () => {
  const notes = ['leetcode/heap/p4083', 'leetcode/tree/p4062'];
  const state = {active:true, order:['leetcode/heap/p4083', 'leetcode/deleted', 'leetcode/tree/p4062']};
  assert.deepEqual(randomNoteNavigation(state, notes[0], notes), {position:1, total:2, nextSlug:'leetcode/tree/p4062'});
  assert.equal(randomNoteNavigation({...state, active:false}, notes[0], notes), null);
  assert.equal(randomNoteNavigation(state, 'machine-learning/a', notes), null);
  assert.equal(randomNoteNavigation({active:true, order:null}, notes[0], notes), null);
});
