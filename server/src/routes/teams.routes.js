const router = require('express').Router();
const controller = require('../controllers/teams.controller');
const validate = require('../middleware/validate');
const intParam = require('../middleware/validateParams');
const schemas = require('../validators/schemas');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.param('id', intParam);
router.param('userId', intParam);

router.get('/', controller.list);
router.post('/', validate(schemas.team), controller.create);
router.get('/:id', controller.details);
router.put('/:id', validate(schemas.team), controller.update);
router.delete('/:id', controller.remove);

router.post('/:id/members', validate(schemas.addMember), controller.addMember);
router.post('/:id/invite', validate(schemas.addMember), controller.invite);
router.delete('/:id/members/:userId', controller.removeMember);

module.exports = router;
