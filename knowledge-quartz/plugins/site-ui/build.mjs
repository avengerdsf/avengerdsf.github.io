import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('./src/', import.meta.url));
const destination = fileURLToPath(new URL('./dist/', import.meta.url));
rmSync(destination, {recursive: true, force: true});
cpSync(source, destination, {recursive: true});
