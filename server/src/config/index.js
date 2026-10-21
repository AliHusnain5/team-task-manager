// Single place that reads environment variables.
require('dotenv').config();

const env = process.env;
const isProd = env.NODE_ENV === 'production';

if (isProd && !env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production');
}

module.exports = {
  env: env.NODE_ENV || 'development',
  isProd,
  port: Number(env.PORT) || 8080,
  // Number of reverse proxies in front of the app (Railway / Cloud Run = 1)
  trustProxy: Number(env.TRUST_PROXY || 1),

  session: {
    secret: env.SESSION_SECRET || 'dev-only-secret-change-me',
    cookieName: 'ttm.sid',
    maxAgeMs: 1000 * 60 * 60 * 24 * 7,
    store: env.SESSION_STORE, // set to "memory" to skip the PostgreSQL session store
  },

  hasDb: Boolean(env.DATABASE_URL || env.DB_NAME),
  db: {
    url: env.DATABASE_URL,
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 5432,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    name: env.DB_NAME,
    ssl: env.DB_SSL === 'true',
  },

  authRateLimitMax: Number(env.AUTH_RATE_LIMIT_MAX) || 100,
};
