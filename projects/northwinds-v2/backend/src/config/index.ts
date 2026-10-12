import { z } from 'zod';

export type AppProfile = 'development' | 'test' | 'production';

const csv = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
  JWT_ISSUER: z.string().min(1).default('https://northwind.example.com/'),
  JWT_AUDIENCE: z.string().min(1).default('northwind-api'),
  JWT_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().max(86400).default(900),
  ENABLE_DEV_TOKEN_ENDPOINT: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  DATABASE_PATH: z.string().default('./data/northwind.sqlite'),
  AUTO_MIGRATE: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  GRAPHQL_MAX_DEPTH: z.coerce.number().int().positive().max(50).default(8),
  GRAPHQL_MAX_COMPLEXITY: z.coerce.number().int().positive().max(100000).default(1000),
  OUTBOUND_FETCH_ALLOWED_HOSTS: z.string().default(''),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
});

export interface AppConfig {
  profile: AppProfile;
  isProduction: boolean;
  port: number;
  corsAllowedOrigins: string[];
  jwt: {
    issuer: string;
    audience: string;
    accessTtlSeconds: number;
  };
  devTokenEndpointEnabled: boolean;
  databasePath: string;
  autoMigrate: boolean;
  graphql: {
    maxDepth: number;
    maxComplexity: number;
    introspection: boolean;
  };
  outboundFetchAllowedHosts: string[];
  rateLimit: { windowMs: number; max: number };
}

let cached: AppConfig | undefined;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.parse(env);
  const profile = parsed.NODE_ENV;
  const isProduction = profile === 'production';

  return {
    profile,
    isProduction,
    port: parsed.PORT,
    corsAllowedOrigins: csv(parsed.CORS_ALLOWED_ORIGINS),
    jwt: {
      issuer: parsed.JWT_ISSUER,
      audience: parsed.JWT_AUDIENCE,
      accessTtlSeconds: parsed.JWT_ACCESS_TTL_SECONDS,
    },
    devTokenEndpointEnabled: parsed.ENABLE_DEV_TOKEN_ENDPOINT,
    databasePath: parsed.DATABASE_PATH,
    autoMigrate: parsed.AUTO_MIGRATE,
    graphql: {
      maxDepth: parsed.GRAPHQL_MAX_DEPTH,
      maxComplexity: parsed.GRAPHQL_MAX_COMPLEXITY,
      introspection: !isProduction,
    },
    outboundFetchAllowedHosts: csv(parsed.OUTBOUND_FETCH_ALLOWED_HOSTS),
    rateLimit: { windowMs: parsed.RATE_LIMIT_WINDOW_MS, max: parsed.RATE_LIMIT_MAX },
  };
}

export function getConfig(): AppConfig {
  if (!cached) {
    cached = loadConfig();
  }
  return cached;
}

export function buildConfig(overrides: NodeJS.ProcessEnv): AppConfig {
  return loadConfig({ ...process.env, ...overrides });
}
