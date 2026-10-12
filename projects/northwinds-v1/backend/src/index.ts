import { getConfig } from './config/index.js';
import { buildContext } from './context.js';
import { runMigrations } from './db/migrate.js';
import { seedDatabase } from './db/seed.js';
import { createApp } from './app.js';

/** Server entry point. */
async function main(): Promise<void> {
  const config = getConfig();
  const ctx = buildContext(config, { migrate: config.autoMigrate });

  // Convenience in local development: seed if the dataset is empty.
  if (!config.isProduction) {
    const count = (ctx.db.prepare('SELECT COUNT(*) AS c FROM categories').get() as { c: number }).c;
    if (count === 0) {
      runMigrations(ctx.db);
      seedDatabase(ctx.db);
      console.log('Seeded empty database with the Northwind sample dataset.');
    }
  }

  const app = await createApp(ctx);
  app.listen(config.port, () => {
    console.log(`Northwind API listening on http://localhost:${config.port}`);
    console.log(`  REST:    http://localhost:${config.port}/api/v1`);
    console.log(`  GraphQL: http://localhost:${config.port}/graphql`);
    if (!config.isProduction) {
      console.log(`  Docs:    http://localhost:${config.port}/docs`);
    }
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exitCode = 1;
});
