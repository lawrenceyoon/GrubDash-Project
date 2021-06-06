// dependencies
const path = require('path');
// local files
const orders = require(path.resolve('src/data/orders-data'));
const nextId = require('../utils/nextId');

// VALIDATION

// MIDDLEWARE
function list(req, res, next) {
  res.json({ data: orders });
}

module.exports = {
  list,
};
