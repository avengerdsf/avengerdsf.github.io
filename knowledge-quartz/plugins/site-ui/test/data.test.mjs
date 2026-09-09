import test from 'node:test';
import assert from 'node:assert/strict';
import { notebookData, sourceFor, newNoteUrl, noteHref } from '../src/data.mjs';

const file = (slug, title, extra = {}) => ({ slug, relativePath: `${slug}.md`, frontmatter: { title }, ...extra });
test('new Markdown notes and notebooks appear without a maintained card registry', () => {
  const files = [file('index', '知识库'), file('leetcode/index', '力扣算法笔记'), file('leetcode/two-sum', '两数之和'), file('systems/cache', '缓存')];
  const data = notebookData(files);
  assert.equal(data.notes.length, 2);
  assert.deepEqual(data.groups.map(g => [g.title, g.notes.length]), [['力扣算法笔记', 1], ['systems', 1]]);
});
test('drafts, unlisted files, folder index pages and non-Markdown files are not notes', () => {
  const data = notebookData([file('index', '知识库'), file('topic/index', '目录'), file('topic/private', '草稿', { frontmatter: { draft: true } }), file('topic/hidden', '隐藏', { frontmatter: { unlisted: true } }), file('topic/img', '图片', { relativePath: 'topic/img.png' }), file('topic/published', '正文')]);
  assert.deepEqual(data.notes.map(n => n.slug), ['topic/published']);
});
test('a top-level Markdown note is available without inventing a subject category', () => {
  const data = notebookData([file('my-note', '我的笔记')]);
  assert.equal(data.groups[0].title, '未分组');
  assert.equal(data.notes[0].title, '我的笔记');
});
test('authored update dates sort notes, not build-time filesystem timestamps', () => {
  const data = notebookData([file('n/old', '旧笔记', {frontmatter:{title:'旧笔记',updated:'2026-08-01'}}), file('n/new', '新笔记', {frontmatter:{title:'新笔记',updated:'2026-09-09'}})]);
  assert.equal(data.notes[0].title, '新笔记');
});
test('edit links preserve original filenames rather than reverse-engineering slugs', () => {
  const source = sourceFor(file('leetcode/A-&-B', 'A', {relativePath: 'leetcode/A & B.md'}));
  assert.equal(source.path, 'knowledge/leetcode/A & B.md');
  assert.match(source.editUrl, /A%20%26%20B\.md$/);
});
test('machine-learning edits point to the source repo, including its renamed README', () => {
  const root = sourceFor(file('machine-learning/index', '机器学习'));
  assert.equal(root.repository, 'avengerdsf/machine-learning-notes');
  assert.equal(root.path, 'README.md');
  const note = sourceFor(file('machine-learning/a-b', 'A', {relativePath: 'machine-learning/A B.md'}));
  assert.equal(note.path, 'A B.md');
});
test('synthetic pages never get guessed edit URLs', () => {
  assert.equal(sourceFor({slug:'tags/test'}), null);
  assert.equal(sourceFor({slug:'folder/index'}), null);
});
test('new note action pre-fills a Markdown template in the current source folder', () => {
  const url = new URL(newNoteUrl(file('leetcode/hash-table/two-sum', '两数之和')));
  assert.equal(url.pathname, '/avengerdsf/avengerdsf.github.io/new/main');
  assert.equal(url.searchParams.get('filename'), 'knowledge/leetcode/hash-table/新笔记.md');
  assert.match(url.searchParams.get('value'), /^---\ntitle: 新笔记\ntags: \[\]\n---/);
  assert.doesNotMatch(url.searchParams.get('value'), /draft: true/);
});
test('new synced notes are created in the upstream folder', () => {
  const url = new URL(newNoteUrl(file('machine-learning/chapter/a', 'A')));
  assert.equal(url.pathname, '/avengerdsf/machine-learning-notes/new/main');
  assert.equal(url.searchParams.get('filename'), 'chapter/新笔记.md');
});
test('knowledge links stay under the deployment base and encode special characters', () => {
  assert.equal(noteHref('leetcode/两数之和'), '/knowledge/leetcode/%E4%B8%A4%E6%95%B0%E4%B9%8B%E5%92%8C');
  assert.equal(noteHref('leetcode/index'), '/knowledge/leetcode/');
});
