import test from 'node:test';
import assert from 'node:assert/strict';
import { extractHomeTokens, prepareKnowledge } from '../prepare-knowledge.mjs';
import { mkdtempSync, mkdirSync, cpSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
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

test('prepared plugin uses configured repositories, targets and branches without runtime repo files', async t => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'knowledge-prepare-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const write = (relative, body) => {
    const target = path.join(root, relative);
    mkdirSync(path.dirname(target), {recursive: true});
    writeFileSync(target, body);
  };
  write('assets/css/site.css', ':root { --bg: #fff; }\nhtml[data-theme="dark"] { --bg: #000; }');
  write('knowledge-quartz/custom.scss', 'body { color: var(--bg); }');
  write('knowledge-quartz/quartz.config.yaml', 'configuration: {}');
  write('knowledge-sources.json', JSON.stringify({site: {repository: 'example/site', ref: 'preview', path: 'knowledge'}, sources: [{repository: 'example/notes', ref: 'notes-v2', target: 'learning', title: '学习', checkout: '.build/notes'}]}));
  cpSync(fileURLToPath(new URL('../../knowledge-quartz/plugins', import.meta.url)), path.join(root, 'knowledge-quartz/plugins'), {recursive: true});
  prepareKnowledge(root);
  const moduleUrl = pathToFileURL(path.join(root, '.build/quartz/local-plugins/site-ui/dist/data.mjs'));
  let metadata;
  await assert.doesNotReject(async () => { metadata = await import(moduleUrl); });
  const remote = {filePath: 'content/learning/笔记 A.md', relativePath: 'learning/笔记 A.md'};
  assert.equal(metadata.sourceFor(remote).editUrl, 'https://github.com/example/notes/edit/notes-v2/%E7%AC%94%E8%AE%B0%20A.md');
  const local = {filePath: 'content/leetcode/two-sum.md', relativePath: 'leetcode/two-sum.md'};
  assert.equal(metadata.sourceFor(local).editUrl, 'https://github.com/example/site/edit/preview/knowledge/leetcode/two-sum.md');
  const generated = {...remote, relativePath: 'learning/目录 空格/index.md', frontmatter: {knowledgeGeneratedIndex: true}};
  assert.equal(metadata.sourceFor(generated), null);
  const newNote = new URL(metadata.newNoteUrl(generated));
  assert.equal(newNote.pathname, '/example/notes/new/notes-v2');
  assert.equal(newNote.searchParams.get('filename'), '目录 空格/新笔记.md');
  const titlePlugin = path.join(root, '.build/quartz/local-plugins/note-title');
  // Quartz's fixed CLI recognizes a pre-built plugin by dist/, regardless of main.
  assert.equal(existsSync(path.join(titlePlugin, 'dist/index.mjs')), true);
  const manifest = JSON.parse(readFileSync(path.join(titlePlugin, 'package.json'), 'utf8'));
  const {default: NoteTitle} = await import(pathToFileURL(path.join(titlePlugin, manifest.main)));
  const titleFile = {value: '# 真实标题', data: {frontmatter: {title: 'filename'}}};
  const titleTree = {type: 'root', children: [{type: 'heading', depth: 1, children: [{type: 'text', value: '真实标题'}]}]};
  NoteTitle().markdownPlugins({})[0]()(titleTree, titleFile);
  assert.equal(titleFile.data.frontmatter.title, '真实标题');
  assert.equal(titleFile.value, '# 真实标题');
  assert.deepEqual(titleTree.children, []);
});
