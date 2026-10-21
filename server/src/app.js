const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const config = require('./config');
const pool = require('./db/pool');
const passport = require('./auth/passport');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

if (config.isProd) app.set('trust proxy', config.trustProxy); // TLS is terminated by the host's proxy

app.use(helmet({ contentSecurityPolicy: config.isProd ? undefined : false }));
app.use(express.json({ limit: '100kb' }));

// Sessions live in PostgreSQL; falls back to memory when SESSION_STORE=memory.
let store;
if (config.hasDb && config.session.store !== 'memory') {
  const PgStore = require('connect-pg-simple')(session);
  store = new PgStore({ pool, tableName: 'user_sessions', createTableIfMissing: true });
} else {
  console.warn('Using in-memory session store (development only).');
}

app.use(
  session({
    store,
    name: config.session.cookieName,
    secret: config.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // not readable from JavaScript
      secure: config.isProd,
      sameSite: 'lax',
      maxAge: config.session.maxAgeMs,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', routes);
app.use('/api', notFound);

// Serve the built React app (single-container deployments such as Docker / Cloud Run).
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

module.exports = app;
