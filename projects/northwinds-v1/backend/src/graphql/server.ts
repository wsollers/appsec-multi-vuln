import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { GraphQLError } from 'graphql';
import type { RequestHandler } from 'express';
import type { AppContext } from '../context.js';
import { typeDefs } from './schema.js';
import { resolvers, type GraphQLContext } from './resolvers.js';
import { complexityLimit, depthLimit } from './limits.js';
import { verifyAccessToken } from '../auth/jwt.js';

/**
 * Builds and starts the Apollo Server and returns an Express handler mounted at
 * /graphql. Introspection is enabled only outside production (threat I3), and
 * depth/complexity validation rules bound query cost (threat D1).
 *
 * Authentication is enforced in the per-request context: no resolver runs
 * without a verified RS256 token and a known subject.
 */
export async function buildGraphQLMiddleware(app: AppContext): Promise<RequestHandler> {
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    introspection: app.config.graphql.introspection,
    validationRules: [
      depthLimit(app.config.graphql.maxDepth),
      complexityLimit(app.config.graphql.maxComplexity),
    ],
    // Never leak internals in GraphQL errors outside development.
    includeStacktraceInErrorResponses: !app.config.isProduction,
  });

  await server.start();

  return expressMiddleware(server, {
    context: async ({ req }) => {
      const header = req.headers.authorization;
      const token = header?.toLowerCase().startsWith('bearer ')
        ? header.slice(7).trim()
        : null;
      if (!token) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
        });
      }
      let user;
      try {
        const claims = verifyAccessToken(app.config, token);
        user = app.repos.users.findBySub(claims.sub);
      } catch {
        user = null;
      }
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
        });
      }
      return { app, user };
    },
  });
}
