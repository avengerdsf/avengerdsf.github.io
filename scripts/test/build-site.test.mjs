import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
for (const redirected of ['.build', '.build/quartz']) {
  test(`full build rejects redirected ${redirected} before any checkout or install`, () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'knowledge-build-'));
    try {
      mkdirSync(path.join(directory, 'scripts'));
      for (const file of ['build-site.mjs', 'sync-knowledge.mjs']) cpSync(path.join(root, 'scripts', file), path.join(directory, 'scripts', file));
      const target = path.join(directory, 'authored');
      mkdirSync(path.join(target, 'quartz/.git'), {recursive: true});
      mkdirSync(path.join(target, '.git'), {recursive: true});
      writeFileSync(path.join(target, 'keep.md'), '# Authored content\n');
      mkdirSync(path.dirname(path.join(directory, redirected)), {recursive: true});
      symlinkSync(target, path.join(directory, redirected), process.platform === 'win32' ? 'junction' : 'dir');
      const result = spawnSync(process.execPath, [path.join(directory, 'scripts/build-site.mjs')], {cwd: directory, encoding: 'utf8'});
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /redirected|outside/);
      assert.equal(readFileSync(path.join(target, 'keep.md'), 'utf8'), '# Authored content\n');
      assert.doesNotMatch(result.stderr, /not a git repository|Cloning/);
    } finally { rmSync(directory, {recursive: true, force: true}); }
  });
}
