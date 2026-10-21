const router = require('express').Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/auth', require('./auth.routes'));
router.use('/teams', require('./teams.routes'));
router.use('/tasks', require('./tasks.routes'));

module.exports = router;
