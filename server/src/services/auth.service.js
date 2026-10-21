const bcrypt = require('bcrypt');
const pool = require('../db/pool');
const HttpError = require('../utils/httpError');

async function register({ name, email, password }) {
  const hash = await bcrypt.hash(password, 12); // never store plain text
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hash]
    );
    return rows[0];
  } catch (e) {
    if (e.code === '23505') throw new HttpError(409, 'Email is already registered');
    throw e;
  }
}

// Returns the public user, or null when the email/password do not match.
async function verifyCredentials(email, password) {
  const { rows } = await pool.query(
    'SELECT id, name, email, password_hash FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  const row = rows[0];
  if (!row) return null;
  if (!(await bcrypt.compare(password, row.password_hash))) return null;
  return { id: row.id, name: row.name, email: row.email };
}

async function findById(id) {
  const { rows } = await pool.query(
    'SELECT id, name, email, created_at AS "createdAt" FROM users WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

module.exports = { register, verifyCredentials, findById };
