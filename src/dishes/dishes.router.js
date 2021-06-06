// dependencies
const router = require('express').Router();
// local files
const controller = require('./dishes.controller');

// TODO: Implement the /dishes routes needed to make the tests pass
router.route('/:dishId').get(controller.read);
router.route('/').get(controller.list).post(controller.create);

module.exports = router;
