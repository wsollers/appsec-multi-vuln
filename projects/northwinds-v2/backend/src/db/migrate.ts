import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import type { DB } from './connection.js';
import { openDatabase } from './connection.js';
import { loadConfig } from '../config/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

/**
 * Applies pending SQL migrations in filename order inside a single transaction
 * each, recording applied versions in `schema_migrations`. Idempotent: already
 * applied files are skipped.
 */
export function runMigrations(db: DB): string[] {
  db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version TEXT PRIMARY KEY,
       applied_at TEXT NOT NULL DEFAULT (datetime('now'))
     );`,
  );

  const applied = new Set<string>(
    db
      .prepare('SELECT version FROM schema_migrations')
      .all()
      .map((r) => (r as { version: string }).version),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const newlyApplied: string[] = [];
  const record = db.prepare('INSERT INTO schema_migrations (version) VALUES (?)');

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    const apply = db.transaction(() => {
      db.exec(sql);
      record.run(file);
    });
    apply();
    newlyApplied.push(file);
  }
  return newlyApplied;
}

// CLI entry point: `npm run migrate`.
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const db = openDatabase(config.databasePath);
  const applied = runMigrations(db);
  db.close();
  if (applied.length === 0) {
    console.log('No pending migrations.');
  } else {
    console.log(`Applied ${applied.length} migration(s): ${applied.join(', ')}`);
  }
}
