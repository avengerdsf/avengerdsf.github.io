import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Share values, not global homepage layout rules, with the Quartz stylesheet. */
export function extractHomeTokens(css) {
  const light = css.match(/:root\s*\{[^}]*\}/)?.[0];
  const dark = css.match(/html\[data-theme="dark"\]\s*\{[^}]*\}/)?.[0];
  if (!light || !dark) throw new Error('Homepage theme token blocks were not found in assets/css/site.css');
  return `${light}\n\n${dark.replace('html[data-theme="dark"]', ':root[saved-theme="dark"]')}\n`;
}

export function prepareKnowledge(root = process.cwd()) {
  const workspace = path.join(root, '.build/quartz');
  const styles = path.join(workspace, 'quartz/styles');
  mkdirSync(styles, {recursive: true});
  writeFileSync(path.join(styles, 'home-tokens.scss'), extractHomeTokens(readFileSync(path.join(root, 'assets/css/site.css'), 'utf8')));
  cpSync(path.join(root, 'knowledge-quartz/custom.scss'), path.join(styles, 'custom.scss'));
  cpSync(path.join(root, 'knowledge-quartz/quartz.config.yaml'), path.join(workspace, 'quartz.config.yaml'));
  cpSync(path.join(root, 'knowledge-quartz/plugins'), path.join(workspace, 'local-plugins'), {recursive: true});
  execFileSync(process.execPath, [path.join(workspace, 'local-plugins/site-ui/build.mjs')], {stdio: 'inherit'});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) prepareKnowledge();
