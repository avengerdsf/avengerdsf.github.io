import test from 'node:test';
import assert from 'node:assert/strict';
import { directoryContents, parentDirectoryHref } from '../src/navigation.mjs';
const file = (slug, title = slug, extra = {}) => ({slug, filePath:`content/${slug}.md`, relativePath:`${slug}.md`, frontmatter:{title}, ...extra});
const files = [file('index'),file('leetcode/index','力扣算法'),file('leetcode/binary-search/index','二分查找'),file('leetcode/binary-search/overview','边界与模板'),file('leetcode/binary-search/problem-a','题目 A'),file('leetcode/binary-search/problem-b','题目 B'),file('leetcode/hash-table/index','哈希表'),file('leetcode/hash-table/two-sum','两数之和'),file('machine-learning/index','机器学习'),file('machine-learning/chapter/regression'),file('loose')];
test('root lists the actual top-level directories without flattening their articles', () => {
  const result = directoryContents(files);
  assert.deepEqual(result.directories.map(d=>d.slug), ['leetcode','machine-learning']);
  assert.deepEqual(result.notes.map(d=>d.slug), ['loose']);
});
test('algorithm topics are directories, not a single note for each algorithm', () => {
  const result = directoryContents(files, 'leetcode');
  assert.deepEqual(result.directories.map(d=>d.title).sort(), ['二分查找','哈希表'].sort());
  assert.deepEqual(result.notes, []);
});
test('one topic supports multiple independent problem notes and preserves its overview', () => {
  const result = directoryContents(files, 'leetcode/binary-search');
  assert.equal(result.directories.length, 0);
  assert.deepEqual(result.notes.map(n=>n.slug).sort(), ['leetcode/binary-search/overview','leetcode/binary-search/problem-a','leetcode/binary-search/problem-b']);
});
test('an authored empty topic is listed before any problem notes are added', () => {
  const empty = file('leetcode/new-topic/index', '新题型');
  assert.ok(directoryContents([...files,empty],'leetcode').directories.some(d=>d.title==='新题型'));
  assert.deepEqual(directoryContents([...files,empty],'leetcode/new-topic'), {directories:[],notes:[]});
});
test('only direct children appear; mixed folders keep direct notes and child folders distinct', () => {
  const result = directoryContents([...files,file('leetcode/direct','直接笔记'),file('leetcode-archive/old')],'leetcode');
  assert.deepEqual(result.notes.map(n=>n.slug), ['leetcode/direct']);
  assert.equal(result.directories.length, 2);
});
test('draft, unlisted and generated pages never become categories', () => {
  const hidden = [file('private/a','A',{frontmatter:{draft:true}}),file('hidden/a','A',{unlisted:true}),{slug:'tags/algorithms',relativePath:'tags/algorithms.md'}];
  assert.deepEqual(directoryContents(hidden),{directories:[],notes:[]});
});
test('parent navigation is structural, even when arriving without browser history', () => {
  assert.equal(parentDirectoryHref('index'),null);
  assert.equal(parentDirectoryHref('leetcode/index'),'/knowledge/');
  assert.equal(parentDirectoryHref('leetcode/binary-search/index'),'/knowledge/leetcode/');
  assert.equal(parentDirectoryHref('leetcode/binary-search/problem-a'),'/knowledge/leetcode/binary-search/');
  assert.equal(parentDirectoryHref('loose'),'/knowledge/');
});
