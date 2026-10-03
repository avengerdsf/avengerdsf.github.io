import test from 'node:test';
import assert from 'node:assert/strict';

const pluginUrl = new URL('../../knowledge-quartz/plugins/note-title/src/index.mjs', import.meta.url);
const text = value => ({type: 'text', value});
const heading = (title, depth = 1) => ({type: 'heading', depth, children: [text(title)]});
async function transform(tree, file) {
  let plugin;
  await assert.doesNotReject(async () => { plugin = (await import(pluginUrl)).default(); });
  for (const attach of plugin.markdownPlugins({})) attach()(tree, file);
}

test('a note without frontmatter promotes its first H1 while keeping source text and other nodes intact', async () => {
  const value = '# 线性回归模型\n\n正文 $f(x)$\n\n## 1. 回归问题\n';
  const paragraph = {type: 'paragraph', children: [text('正文 $f(x)$')]};
  const section = heading('1. 回归问题', 2);
  const tree = {type: 'root', children: [heading('线性回归模型'), paragraph, section]};
  const file = {value, data: {frontmatter: {title: '01_learning_regression', tags: []}}};
  await transform(tree, file);
  assert.equal(file.data.frontmatter.title, '线性回归模型');
  assert.deepEqual(file.data.frontmatter.tags, []);
  assert.deepEqual(tree.children, [paragraph, section]);
  assert.equal(file.value, value);
});

test('formatted headings produce readable titles without Markdown punctuation', async () => {
  const tree = {type: 'root', children: [{type: 'heading', depth: 1, children: [text('使用 '), {type: 'strong', children: [text('NumPy')]}, text(' 与 '), {type: 'inlineCode', value: 'f(x)'}]}]};
  const file = {value: '# 使用 **NumPy** 与 `f(x)`', data: {frontmatter: {title: 'filename'}}};
  await transform(tree, file);
  assert.equal(file.data.frontmatter.title, '使用 NumPy 与 f(x)');
  assert.deepEqual(tree.children, []);
  assert.equal(file.value, '# 使用 **NumPy** 与 `f(x)`');
});

test('authored frontmatter preserves its chosen title and every body heading', async () => {
  const first = heading('正文标题');
  const tree = {type: 'root', children: [{type: 'yaml', value: 'title: 手写标题'}, first]};
  const file = {value: '---\ntitle: 手写标题\n---\n# 正文标题', data: {frontmatter: {title: '手写标题'}}};
  await transform(tree, file);
  assert.equal(file.data.frontmatter.title, '手写标题');
  assert.equal(tree.children[1], first);
});

test('generated directory metadata keeps its configured title', async () => {
  const metadata = {type: 'yaml', value: 'title: 机器学习学习笔记\nknowledgeGeneratedIndex: true'};
  const tree = {type: 'root', children: [metadata]};
  const file = {value: '---\ntitle: 机器学习学习笔记\nknowledgeGeneratedIndex: true\n---', data: {frontmatter: {title: '机器学习学习笔记', knowledgeGeneratedIndex: true}}};
  await transform(tree, file);
  assert.equal(file.data.frontmatter.title, '机器学习学习笔记');
  assert.equal(file.data.frontmatter.knowledgeGeneratedIndex, true);
  assert.deepEqual(tree.children, [metadata]);
});

test('only the first top-level H1 is promoted and later same-name headings remain', async () => {
  const quote = {type: 'blockquote', children: [heading('引用里的标题')]};
  const later = heading('真实文章标题');
  const section = heading('第二节', 2);
  const tree = {type: 'root', children: [quote, heading('真实文章标题'), section, later]};
  const file = {value: '> # 引用里的标题\n\n# 真实文章标题\n\n## 第二节\n\n# 真实文章标题', data: {frontmatter: {title: 'filename'}}};
  await transform(tree, file);
  assert.equal(file.data.frontmatter.title, '真实文章标题');
  assert.deepEqual(tree.children, [quote, section, later]);
});

test('documents without an H1 retain the existing title and complete tree', async () => {
  const section = heading('节标题', 2);
  const tree = {type: 'root', children: [section]};
  const file = {value: '## 节标题', data: {frontmatter: {title: 'filename'}}};
  await transform(tree, file);
  assert.equal(file.data.frontmatter.title, 'filename');
  assert.deepEqual(tree.children, [section]);
});

test('a real README gets one content title while its source and directory links survive', async () => {
  const value = '# 机器学习学习笔记\r\n\r\n[线性回归](chapter_01/01.md)\r\n';
  const paragraph = {type: 'paragraph', children: [{type: 'link', url: 'chapter_01/01.md', children: [text('线性回归')]}]};
  const tree = {type: 'root', children: [heading('机器学习学习笔记'), paragraph]};
  const file = {value, data: {relativePath: 'machine-learning/README.md', frontmatter: {title: 'README'}}};
  await transform(tree, file);
  assert.equal(file.data.frontmatter.title, '机器学习学习笔记');
  assert.equal(file.value, value);
  assert.deepEqual(tree.children, [paragraph]);
});
