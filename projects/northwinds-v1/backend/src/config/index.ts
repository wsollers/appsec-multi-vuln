import { generateKeyPairSync } from 'node:crypto';
import { z } from 'zod';

/**
 * Centralized, typed, deterministic configuration.
 *
 * Every tunable (profiles, allow-lists, limits, key material) is resolved here
 * from environment variables with safe development-only defaults. No other
 * module reads `process.env` directly.
 */

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
  JWT_PRIVATE_KEY: z.string().default(''),
  JWT_PUBLIC_KEY: z.string().default(''),
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
    privateKeyPem: string;
    publicKeyPem: string;
    accessTtlSeconds: number;
    algorithm: 'RS256';
    keyId: string;
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

function resolveKeyPair(
  profile: AppProfile,
  privatePem: string,
  publicPem: string,
): { privateKeyPem: string; publicKeyPem: string } {
  const priv = privatePem.replace(/\\n/g, '\n').trim();
  const pub = publicPem.replace(/\\n/g, '\n').trim();

  if (priv && pub) {
    return { privateKeyPem: priv, publicKeyPem: pub };
  }

  if (profile === 'production') {
    throw new Error(
      'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are required in production; refusing to start with ephemeral keys.',
    );
  }

  // Development/test convenience: a self-contained, ephemeral RS256 key pair.
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { privateKeyPem: privateKey, publicKeyPem: publicKey };
}

let cached: AppConfig | undefined;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = EnvSchema.parse(env);
  const profile = parsed.NODE_ENV;
  const isProduction = profile === 'production';
  const { privateKeyPem, publicKeyPem } = resolveKeyPair(
    profile,
    parsed.JWT_PRIVATE_KEY,
    parsed.JWT_PUBLIC_KEY,
  );

  return {
    profile,
    isProduction,
    port: parsed.PORT,
    corsAllowedOrigins: csv(parsed.CORS_ALLOWED_ORIGINS),
    jwt: {
      issuer: parsed.JWT_ISSUER,
      audience: parsed.JWT_AUDIENCE,
      privateKeyPem,
      publicKeyPem,
      accessTtlSeconds: parsed.JWT_ACCESS_TTL_SECONDS,
      algorithm: 'RS256',
      keyId: 'northwind-rs256-1',
    },
    // The dev token mint is always off in production regardless of the flag.
    devTokenEndpointEnabled: !isProduction && parsed.ENABLE_DEV_TOKEN_ENDPOINT,
    databasePath: parsed.DATABASE_PATH,
    autoMigrate: parsed.AUTO_MIGRATE,
    graphql: {
      maxDepth: parsed.GRAPHQL_MAX_DEPTH,
      maxComplexity: parsed.GRAPHQL_MAX_COMPLEXITY,
      // Introspection is only ever enabled outside production.
      introspection: !isProduction,
    },
    outboundFetchAllowedHosts: csv(parsed.OUTBOUND_FETCH_ALLOWED_HOSTS),
    rateLimit: { windowMs: parsed.RATE_LIMIT_WINDOW_MS, max: parsed.RATE_LIMIT_MAX },
  };
}

/** Process-wide singleton config (resolved once). */
export function getConfig(): AppConfig {
  if (!cached) {
    cached = loadConfig();
  }
  return cached;
}

/** Test helper: build an isolated config without touching the singleton. */
export function buildConfig(overrides: NodeJS.ProcessEnv): AppConfig {
  return loadConfig({ ...process.env, ...overrides });
}
