import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import type { AppContext } from './context.js';
import { buildApiRouter } from './http/routes/index.js';
import { buildCors, buildHelmet } from './http/middleware/security.js';
import { buildRateLimiter } from './http/middleware/rateLimit.js';
import { buildErrorHandler, notFoundHandler } from './http/middleware/errorHandler.js';
import { buildGraphQLMiddleware } from './graphql/server.js';
import { buildOpenApiDocument } from './openapi/openapi.js';

export async function createApp(ctx: AppContext): Promise<Express> {
  const app = express();
  const { config } = ctx;

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use((req, _res, next) => {
    req.ctx = ctx;
    next();
  });

  app.use(buildHelmet(config));
  app.use(buildCors(config));
  app.use(buildRateLimiter(config));
  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());

  const graphql = await buildGraphQLMiddleware(ctx);
  app.use('/graphql', graphql);

  app.use('/api/v1', buildApiRouter(config));

  if (!config.isProduction) {
    const openapi = buildOpenApiDocument(`http://localhost:${config.port}`);
    app.get('/openapi.json', (_req, res) => res.json(openapi));
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
  }

  app.use(notFoundHandler);
  app.use(buildErrorHandler(config.isProduction));

  return app;
}
