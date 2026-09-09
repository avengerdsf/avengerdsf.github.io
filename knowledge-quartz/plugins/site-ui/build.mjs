import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// Quartz's YAML layout resolves one component per plugin source. Thin entry packages
// share these implementations; they contain no duplicated UI or metadata logic.
for (const name of ['site-ui', 'knowledge-actions', 'knowledge-overview']) {
  const source = fileURLToPath(new URL(`../${name}/src/`, import.meta.url));
  const destination = fileURLToPath(new URL(`../${name}/dist/`, import.meta.url));
  rmSync(destination, {recursive: true, force: true});
  cpSync(source, destination, {recursive: true});
}
