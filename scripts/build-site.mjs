import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guardedPath } from './sync-knowledge.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const quartz = path.join(root, '.build/quartz');
const commit = 'f1fba3fc55cbf60a60a5d09c95a49c042cdab63a';
function run(command, args, cwd = root) {
  if (command === 'npm' && process.platform === 'win32') {
    const cli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
    if (!existsSync(cli)) throw new Error('Run this build through npm run build:knowledge');
    command = process.execPath;
    args = [cli, ...args];
  }
  const result = spawnSync(command, args, {cwd, stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
try {
  for (const directory of ['.build', '.build/quartz', '.build/preview']) guardedPath(root, directory);
  mkdirSync(path.join(root, '.build'), {recursive: true});
  if (!existsSync(path.join(quartz, '.git'))) run('git', ['clone', 'https://github.com/jackyzha0/quartz.git', quartz]);
  run('git', ['checkout', commit], quartz);
  if (!existsSync(path.join(quartz, 'node_modules/esbuild'))) run('npm', ['ci', '--no-audit', '--no-fund'], quartz);
  if (!existsSync(path.join(quartz, 'node_modules/@quartz-themes/default'))) run('npm', ['install', '--no-save', '--no-audit', '--no-fund', '@quartz-themes/default'], quartz);
  run(process.execPath, ['scripts/sync-knowledge.mjs', ...process.argv.slice(2)]);
  run(process.execPath, ['scripts/prepare-knowledge.mjs']);
  const demo = path.join(quartz, 'local-plugins/algorithm-demo');
  if (!existsSync(path.join(demo, 'node_modules/tsup'))) run('npm', ['install', '--no-audit', '--no-fund'], demo);
  run('npm', ['test'], demo);
  run('npm', ['run', 'build'], demo);
  run(process.execPath, ['quartz/bootstrap-cli.mjs', 'plugin', 'install', '--from-config', '--concurrency', '2'], quartz);
  run(process.execPath, ['quartz/bootstrap-cli.mjs', 'build'], quartz);
  run(process.execPath, ['scripts/validate-site.mjs', '--built']);
  const preview = guardedPath(root, '.build/preview');
  rmSync(preview, {recursive: true, force: true});
  mkdirSync(preview, {recursive: true});
  cpSync(path.join(root, 'index.html'), path.join(preview, 'index.html'));
  cpSync(path.join(root, 'assets'), path.join(preview, 'assets'), {recursive: true});
  cpSync(path.join(quartz, 'public'), path.join(preview, 'knowledge'), {recursive: true});
  console.log('Reviewable site: .build/preview');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
