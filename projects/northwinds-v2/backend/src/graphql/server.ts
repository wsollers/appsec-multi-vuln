import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { GraphQLError } from 'graphql';
import type { RequestHandler } from 'express';
import type { AppContext } from '../context.js';
import { typeDefs } from './schema.js';
import { resolvers, type GraphQLContext } from './resolvers.js';
import { verifyAccessToken } from '../auth/jwt.js';

/** Builds the GraphQL handler mounted at /graphql. */
export async function buildGraphQLMiddleware(app: AppContext): Promise<RequestHandler> {
  const server = new ApolloServer<GraphQLContext>({
    typeDefs,
    resolvers,
    introspection: true,
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
