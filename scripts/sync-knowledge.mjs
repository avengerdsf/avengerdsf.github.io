import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const relativePath = value => typeof value === 'string' && value.length > 0
  && !value.includes('\\') && !value.includes(':') && !value.includes('\0')
  && value.split('/').every(part => part && part !== '.' && part !== '..');
const overlaps = (a, b) => a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`);

export function loadKnowledgeSources(root = process.cwd()) {
  const config = JSON.parse(readFileSync(path.join(root, 'knowledge-sources.json'), 'utf8'));
  const validRepository = value => typeof value === 'string' && /^[\w.-]+\/[\w.-]+$/.test(value);
  const validRef = value => typeof value === 'string' && value.length > 0 && !value.startsWith('-') && !/[\s\0]/.test(value);
  if (!validRepository(config.site?.repository) || !validRef(config.site?.ref) || !relativePath(config.site?.path) || config.site.path.startsWith('.build/')) throw new Error('Invalid local knowledge source');
  if (!Array.isArray(config.sources)) throw new Error('Invalid knowledge sources list');
  for (const [index, source] of config.sources.entries()) {
    if (!validRepository(source.repository) || !validRef(source.ref) || !relativePath(source.target) || !relativePath(source.checkout) || !source.checkout.startsWith('.build/') || typeof source.title !== 'string' || !source.title) throw new Error('Invalid GitHub knowledge source');
    if (overlaps(source.checkout, '.build/quartz')) throw new Error('Quartz checkout is protected from source synchronization');
    for (const previous of config.sources.slice(0, index)) {
      if (overlaps(source.target, previous.target) || overlaps(source.checkout, previous.checkout)) throw new Error('Invalid overlapping knowledge sources');
    }
  }
  return config;
}

// Reject redirected build ancestors before deleting or writing any generated output.
export function guardedPath(root, relative) {
  const target = path.resolve(root, relative);
  let ancestor = target;
  while (!existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const realRoot = realpathSync(root);
  const realAncestor = realpathSync(ancestor);
  const actual = path.relative(realRoot, realAncestor);
  if (actual === '..' || actual.startsWith(`..${path.sep}`) || path.isAbsolute(actual)) throw new Error(`Build path is outside the workspace: ${relative}`);
  if (path.relative(path.resolve(realRoot, path.relative(root, ancestor)), realAncestor)) throw new Error(`Build path is redirected: ${relative}`);
  return target;
}

function updateCheckout(root, source) {
  const checkout = guardedPath(root, source.checkout);
  const repositoryUrl = `https://github.com/${source.repository}.git`;
  const git = args => execFileSync('git', args, {encoding: 'utf8', env: {...process.env, GIT_TERMINAL_PROMPT: '0'}});
  if (!existsSync(checkout)) {
    mkdirSync(path.dirname(checkout), {recursive: true});
    git(['clone', '--depth=1', '--branch', source.ref, '--', repositoryUrl, checkout]);
  } else {
    const origin = git(['-C', checkout, 'config', '--get', 'remote.origin.url']).trim();
    if (origin.replace(/\.git$/, '') !== repositoryUrl.replace(/\.git$/, '')) throw new Error(`Configured checkout has a different origin: ${source.checkout}`);
    if (git(['-C', checkout, 'status', '--porcelain']).trim()) throw new Error(`Configured checkout contains local changes: ${source.checkout}`);
    git(['-C', checkout, 'fetch', '--depth=1', 'origin', source.ref]);
    git(['-C', checkout, 'checkout', '--detach', 'FETCH_HEAD']);
  }
}

function copyNotes(source, destination) {
  cpSync(source, destination, {recursive: true, filter: input => !['.git', '.github'].includes(path.basename(input))});
}

function directoryIndexes(directory, title) {
  const entries = readdirSync(directory, {withFileTypes: true});
  let hasNotes = entries.some(entry => entry.isFile() && /\.md$/i.test(entry.name));
  for (const entry of entries) {
    if (entry.isDirectory()) hasNotes = directoryIndexes(path.join(directory, entry.name), entry.name) || hasNotes;
  }
  if (hasNotes && !existsSync(path.join(directory, 'index.md'))) {
    writeFileSync(path.join(directory, 'index.md'), `---\ntitle: ${JSON.stringify(title)}\nknowledgeGeneratedIndex: true\n---\n`);
  }
  return hasNotes;
}

export function syncKnowledge(root = process.cwd(), {skipFetch = false} = {}) {
  root = path.resolve(root);
  const config = loadKnowledgeSources(root);
  const content = guardedPath(root, '.build/quartz/content');
  const local = guardedPath(root, config.site.path);
  if (!existsSync(local)) throw new Error('Local knowledge folder does not exist');
  for (const source of config.sources) {
    if (existsSync(path.join(local, source.target))) throw new Error(`Local notes conflict with a synced source: ${source.target}`);
    if (!skipFetch) updateCheckout(root, source);
    if (!existsSync(guardedPath(root, source.checkout))) throw new Error(`Source checkout does not exist: ${source.checkout}`);
  }
  // This is the sole clean output; neither source checkouts nor Quartz plugins are removed.
  rmSync(content, {recursive: true, force: true});
  mkdirSync(content, {recursive: true});
  copyNotes(local, content);
  for (const source of config.sources) {
    const destination = path.join(content, source.target);
    copyNotes(guardedPath(root, source.checkout), destination);
    directoryIndexes(destination, source.title);
  }
  console.log(`Prepared knowledge content from local notes and ${config.sources.length} GitHub source(s).`);
  return config;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).some(arg => arg !== '--skip-fetch')) throw new Error('Usage: node scripts/sync-knowledge.mjs [--skip-fetch]');
    syncKnowledge(process.cwd(), {skipFetch: process.argv.includes('--skip-fetch')});
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
