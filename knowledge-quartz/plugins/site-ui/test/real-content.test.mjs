import test from 'node:test';
import assert from 'node:assert/strict';
import {notebookData, sourceFor, newNoteUrl} from '../src/data.mjs';
const real = (slug, extra = {}) => ({slug, filePath: `content/${slug}.md`, relativePath: `${slug}.md`, frontmatter: {title: slug}, ...extra});
// Quartz 5 dispatcher assigns relativePath to virtual pages too, but not filePath.
const virtual = (slug) => ({slug, relativePath: `${slug}.md`, frontmatter: {title: slug}});

test('virtual 404, tags and generated folders never become authored notebooks or notes', () => {
 const result = notebookData([real('index'), real('leetcode/index'), real('leetcode/two-sum'), virtual('404'), virtual('tags/index'), virtual('tags/leetcode'), virtual('leetcode/hash-table/index')]);
 assert.deepEqual(result.notes.map(note => note.slug), ['leetcode/two-sum']);
 assert.deepEqual(result.groups.map(group => group.slug), ['leetcode']);
});
test('virtual Markdown-looking paths never advertise a nonexistent edit target', () => {
 assert.equal(sourceFor(virtual('tags/leetcode')), null);
 assert.equal(sourceFor(virtual('404')), null);
});
test('the parsed unlisted flag is respected, not just raw frontmatter', () => {
 assert.equal(notebookData([real('secret', {unlisted: true})]).notes.length, 0);
});
test('new note on a generated synced folder uses the real source folder', () => {
 const file = real('machine-learning/Chapter-One/a', {relativePath:'machine-learning/Chapter One/a.md'});
 const url = new URL(newNoteUrl(virtual('machine-learning/Chapter-One/index'), [file]));
 assert.equal(url.pathname, '/avengerdsf/machine-learning-notes/new/main');
 assert.equal(url.searchParams.get('filename'), 'Chapter One/新笔记.md');
});
test('edit targets keep authored filenames and protect against traversal', () => {
 assert.match(sourceFor(real('notes/a', {relativePath:'notes/A & B.md'})).editUrl, /A%20%26%20B\.md$/);
 assert.equal(sourceFor(real('notes/a',{relativePath:'../README.md'})), null);
});
