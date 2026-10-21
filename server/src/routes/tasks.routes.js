const router = require('express').Router();
const controller = require('../controllers/tasks.controller');
const validate = require('../middleware/validate');
const intParam = require('../middleware/validateParams');
const schemas = require('../validators/schemas');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.param('id', intParam);

router.get('/', controller.list);
router.get('/reminders', controller.reminders); // must stay above '/:id'
router.post('/', validate(schemas.taskCreate), controller.create);
router.get('/:id', controller.get);
router.put('/:id', validate(schemas.taskUpdate), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
