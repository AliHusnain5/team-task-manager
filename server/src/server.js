const config = require('./config');
const app = require('./app');
const { initDb } = require('./db/init');

initDb()
  .then(() => app.listen(config.port, () => console.log(`Server listening on port ${config.port}`)))
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
