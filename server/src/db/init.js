const fs = require('fs');
const path = require('path');
const pool = require('./pool');

// Creates the tables if they do not exist yet (idempotent).
async function initDb() {
  if (!pool) {
    throw new Error(
      'No database configured. Set DATABASE_URL or DB_NAME/DB_USER/DB_PASSWORD (see .env.example).'
    );
  }
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
}

module.exports = { initDb };
