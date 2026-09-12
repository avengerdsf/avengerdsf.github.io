import test from 'node:test';
import assert from 'node:assert/strict';
import { notebookData } from '../src/data.mjs';
const note = (slug, extra = {}) => ({slug, filePath: `content/${slug}.md`, relativePath: `${slug}.md`, frontmatter: {title: slug}, ...extra});
const files = [note('index'), note('leetcode/index'), note('leetcode/hash-table/index'), note('leetcode/hash-table/two-sum'), note('leetcode/binary-search'), note('machine-learning/regression'), note('leetcode-archive/old'), note('loose-note')];

test('a selected directory lists its notes directly, including nested notes', () => {
  assert.deepEqual(notebookData(files, 'leetcode').notes.map(item => item.slug).sort(), ['leetcode/binary-search', 'leetcode/hash-table/two-sum']);
});
test('a child directory never falls back to every note', () => {
  assert.deepEqual(notebookData(files, 'leetcode/hash-table').notes.map(item => item.slug), ['leetcode/hash-table/two-sum']);
});
test('an empty directory stays empty', () => {
  assert.equal(notebookData(files, 'empty').notes.length, 0);
});
test('root lists each article once and never promotes directory indexes to notes', () => {
  const notes = notebookData(files).notes;
  assert.equal(notes.length, 5);
  assert.equal(new Set(notes.map(item => item.slug)).size, 5);
  assert.ok(notes.every(item => !/(^|\/)index$/.test(item.slug)));
});
test('scoped listings still exclude draft, unlisted and virtual files', () => {
  const scoped = [...files, note('leetcode/draft', {frontmatter: {draft: true}}), note('leetcode/hidden', {unlisted: true}), {slug: 'leetcode/virtual', relativePath: 'leetcode/virtual.md'}];
  assert.equal(notebookData(scoped, 'leetcode').notes.length, 2);
});
