const { Pool, types } = require('pg');
const config = require('../config');

// Return DATE columns as plain 'YYYY-MM-DD' strings (avoids timezone shifts)
types.setTypeParser(1082, (value) => value);

const ssl = config.db.ssl ? { rejectUnauthorized: false } : undefined;

// Cloud Run + Cloud SQL: DB_HOST=/cloudsql/<PROJECT>:<REGION>:<INSTANCE>
// Railway / local: DATABASE_URL
const pool = config.hasDb
  ? new Pool(
      config.db.url
        ? { connectionString: config.db.url, ssl }
        : {
            host: config.db.host,
            port: config.db.port,
            user: config.db.user,
            password: config.db.password,
            database: config.db.name,
            ssl,
          }
    )
  : null;

module.exports = pool;
