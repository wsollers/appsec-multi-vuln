import type { AppConfig } from './config/index.js';
import type { DB } from './db/connection.js';
import { openDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import type { Repositories } from './repositories/index.js';
import { createRepositories } from './repositories/index.js';
import type { Services } from './services/index.js';
import { createServices } from './services/index.js';

/**
 * Application context: the wired object graph (config → db → repos → services)
 * shared by the REST and GraphQL transports so business logic is never
 * duplicated (design §5.2).
 */
export interface AppContext {
  config: AppConfig;
  db: DB;
  repos: Repositories;
  services: Services;
}

export interface BuildContextOptions {
  /** Run migrations before use (independent of AUTO_MIGRATE). */
  migrate?: boolean;
  /** Seed the database (used by tests and local bootstrapping). */
  seed?: boolean;
}

export function buildContext(config: AppConfig, options: BuildContextOptions = {}): AppContext {
  const db = openDatabase(config.databasePath);
  if (options.migrate ?? config.autoMigrate) {
    runMigrations(db);
  }
  if (options.seed) {
    seedDatabase(db);
  }
  const repos = createRepositories(db);
  const services = createServices(repos);
  return { config, db, repos, services };
}
