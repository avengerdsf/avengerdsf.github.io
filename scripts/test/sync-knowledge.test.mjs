import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../sync-knowledge.mjs', import.meta.url));
const repository = 'avengerdsf/machine-learning-notes';
function fixture(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'knowledge-sync-'));
  t.after(() => rmSync(root, {recursive: true, force: true}));
  const config = {site: {repository: 'avengerdsf/avengerdsf.github.io', ref: 'main', path: 'knowledge'}, sources: [{repository, ref: 'main', target: 'machine-learning', title: '机器学习学习笔记', checkout: '.build/machine-learning-notes'}]};
  const write = (relative, value) => {
    const target = path.join(root, relative);
    mkdirSync(path.dirname(target), {recursive: true});
    writeFileSync(target, value);
  };
  write('knowledge-sources.json', JSON.stringify(config));
  write('knowledge/index.md', '---\ntitle: 知识库\n---\n');
  write('knowledge/leetcode/hash-table/two-sum.md', '# 两数之和\n');
  write('.build/quartz/package.json', '{"name":"keep-quartz"}');
  write('.build/machine-learning-notes/README.md', '# 原始说明\n\n[笔记](目录 空格/深层/原始笔记.md)\n');
  const run = (args = ['--skip-fetch'], env = process.env) => spawnSync(process.execPath, [script, ...args], {cwd: root, encoding: 'utf8', env});
  return {root, config, write, run, read: relative => readFileSync(path.join(root, relative), 'utf8')};
}
function successful(result) { assert.equal(result.status, 0, result.stderr || result.stdout); }

test('sync retains nested Chinese and spaced paths and relative asset bytes', t => {
  const f = fixture(t);
  const markdown = '# 原始笔记\n\n![图](../../图 片/图一.svg)\n\n```python\nx = 1\n```\n';
  f.write('.build/machine-learning-notes/目录 空格/深层/原始笔记.md', markdown);
  f.write('.build/machine-learning-notes/图 片/图一.svg', '<svg>原图</svg>');
  f.write('.build/machine-learning-notes/.github/workflows/source.yml', 'private build metadata');
  f.write('.build/machine-learning-notes/.git/HEAD', 'source git metadata');
  successful(f.run());
  assert.equal(f.read('.build/quartz/content/machine-learning/目录 空格/深层/原始笔记.md'), markdown);
  assert.equal(f.read('.build/quartz/content/machine-learning/图 片/图一.svg'), '<svg>原图</svg>');
  assert.equal(f.read('.build/quartz/content/leetcode/hash-table/two-sum.md'), '# 两数之和\n');
  assert.equal(existsSync(path.join(f.root, '.build/quartz/content/machine-learning/.git')), false);
  assert.equal(existsSync(path.join(f.root, '.build/quartz/content/machine-learning/.github')), false);
});

test('a clean rebuild removes deleted source notes without replacing the Quartz checkout', t => {
  const f = fixture(t);
  f.write('.build/machine-learning-notes/old.md', '# deleted later');
  successful(f.run());
  rmSync(path.join(f.root, '.build/machine-learning-notes/old.md'));
  f.write('.build/quartz/content/stale.md', 'old build output');
  successful(f.run());
  assert.equal(existsSync(path.join(f.root, '.build/quartz/content/machine-learning/old.md')), false);
  assert.equal(existsSync(path.join(f.root, '.build/quartz/content/stale.md')), false);
  assert.equal(f.read('.build/quartz/package.json'), '{"name":"keep-quartz"}');
});

test('authored README and index pages coexist without changing either body', t => {
  const f = fixture(t);
  const readme = f.read('.build/machine-learning-notes/README.md');
  const index = '---\ntitle: 原始首页\n---\n\n首页正文\n';
  f.write('.build/machine-learning-notes/index.md', index);
  f.write('.build/machine-learning-notes/目录/README.md', '# 子目录说明\n');
  f.write('.build/machine-learning-notes/目录/index.md', '# 子目录真实首页\n');
  successful(f.run());
  assert.equal(f.read('.build/quartz/content/machine-learning/README.md'), readme);
  assert.equal(f.read('.build/quartz/content/machine-learning/index.md'), index);
  assert.equal(f.read('.build/quartz/content/machine-learning/目录/README.md'), '# 子目录说明\n');
  assert.equal(f.read('.build/quartz/content/machine-learning/目录/index.md'), '# 子目录真实首页\n');
});

test('missing directory indexes get metadata while real README paths remain intact', t => {
  const f = fixture(t);
  f.write('.build/machine-learning-notes/目录 空格/深层/原始笔记.md', '# 原始笔记\n');
  f.write('.build/machine-learning-notes/图 片/图一.svg', '<svg/>');
  successful(f.run());
  assert.equal(f.read('.build/quartz/content/machine-learning/README.md'), '# 原始说明\n\n[笔记](目录 空格/深层/原始笔记.md)\n');
  assert.match(f.read('.build/quartz/content/machine-learning/index.md'), /title: "机器学习学习笔记"\nknowledgeGeneratedIndex: true/);
  assert.match(f.read('.build/quartz/content/machine-learning/目录 空格/index.md'), /title: "目录 空格"\nknowledgeGeneratedIndex: true/);
  assert.match(f.read('.build/quartz/content/machine-learning/目录 空格/深层/index.md'), /title: "深层"\nknowledgeGeneratedIndex: true/);
  assert.equal(existsSync(path.join(f.root, '.build/quartz/content/machine-learning/图 片/index.md')), false);
});

test('invalid source paths fail before cleaning existing content', t => {
  const f = fixture(t);
  f.write('.build/quartz/content/keep.md', 'must survive');
  for (const changes of [{target: '../escape'}, {checkout: '.build/quartz'}, {checkout: '../outside'}]) {
    f.write('knowledge-sources.json', JSON.stringify({...f.config, sources: [{...f.config.sources[0], ...changes}]}));
    const result = f.run();
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Invalid|protected|outside/);
    assert.equal(f.read('.build/quartz/content/keep.md'), 'must survive');
  }
});

test('a redirected Quartz build folder cannot clean authored notes in another workspace folder', t => {
  const f = fixture(t);
  f.write('knowledge/content/keep.md', 'authored notes must survive');
  const quartz = path.join(f.root, '.build/quartz');
  rmSync(quartz, {recursive: true});
  symlinkSync(path.join(f.root, 'knowledge'), quartz, process.platform === 'win32' ? 'junction' : 'dir');
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.equal(existsSync(path.join(f.root, 'knowledge/content/keep.md')), true);
  assert.equal(f.read('knowledge/content/keep.md'), 'authored notes must survive');
  assert.match(result.stderr, /outside|redirected/);
});

test('configured checkout fetches the new commit and removes deleted notes on the next build', t => {
  const f = fixture(t);
  const upstream = path.join(f.root, 'upstream');
  mkdirSync(upstream);
  const git = args => execFileSync('git', args, {cwd: upstream, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
  git(['init', '-b', 'main']);
  git(['config', 'user.name', 'Sync fixture']);
  git(['config', 'user.email', 'fixture@example.test']);
  f.write('upstream/README.md', '# 第一次提交\n');
  f.write('upstream/removed.md', '# 即将删除');
  git(['add', '.']);
  git(['commit', '-m', 'First fixture']);
  rmSync(path.join(f.root, '.build/machine-learning-notes'), {recursive: true});
  f.write('gitconfig', `[url "${upstream.replaceAll('\\', '/')}"]\n\tinsteadOf = https://github.com/${repository}.git\n`);
  const env = {...process.env, GIT_CONFIG_GLOBAL: path.join(f.root, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0'};
  successful(f.run([], env));
  assert.equal(f.read('.build/quartz/content/machine-learning/README.md'), '# 第一次提交\n');
  rmSync(path.join(upstream, 'removed.md'));
  f.write('upstream/README.md', '# 最新提交\n');
  git(['add', '-A']);
  git(['commit', '-m', 'Updated fixture']);
  successful(f.run([], env));
  assert.equal(f.read('.build/quartz/content/machine-learning/README.md'), '# 最新提交\n');
  assert.equal(existsSync(path.join(f.root, '.build/quartz/content/machine-learning/removed.md')), false);
});
