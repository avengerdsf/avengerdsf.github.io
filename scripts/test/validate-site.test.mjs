import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
function fixture(lineEnding) {
  const directory = mkdtempSync(path.join(tmpdir(), 'knowledge-validation-'));
  for (const name of ['index.html', 'assets', 'knowledge', 'knowledge-quartz', '.github', 'scripts', 'knowledge-sources.json']) {
    try { cpSync(path.join(root, name), path.join(directory, name), {recursive: true}); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const convert = folder => {
    for (const entry of readdirSync(folder, {withFileTypes: true})) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) convert(file);
      else if (/\.(md|mjs|css|scss|yaml|yml|html|json)$/.test(file)) {
        writeFileSync(file, readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/\n/g, lineEnding));
      }
    }
  };
  convert(directory);
  return directory;
}
function validate(directory) {
  return spawnSync(process.execPath, [path.join(directory, 'scripts/validate-site.mjs'), '--source'], {cwd: directory, encoding: 'utf8'});
}
for (const [name, ending] of [['LF', '\n'], ['CRLF', '\r\n']]) {
  test(`source validation accepts a real ${name} checkout`, () => {
    const directory = fixture(ending);
    try {
      const result = validate(directory);
      assert.equal(result.status, 0, result.stderr || result.stdout);
    } finally { rmSync(directory, {recursive: true, force: true}); }
  });
}
test('source validation rejects missing authored frontmatter', () => {
  const directory = fixture('\n');
  try {
    writeFileSync(path.join(directory, 'knowledge/leetcode/hash-table/index.md'), '# 哈希表\n');
    const result = validate(directory);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /hash-table\/index\.md: missing Chinese frontmatter title/);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
