// Copies non-TS assets (SQL migrations) into dist after tsc build.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = resolve(root, 'src/db/migrations');
const to = resolve(root, 'dist/db/migrations');

if (existsSync(from)) {
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`Copied migrations → ${to}`);
} else {
  console.warn('No migrations directory to copy.');
}
