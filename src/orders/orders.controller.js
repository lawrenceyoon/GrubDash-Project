// dependencies
const path = require('path');
// local files
const orders = require(path.resolve('src/data/orders-data'));
const nextId = require('../utils/nextId');

// VALIDATION
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => orderId === order.id);

  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order dose not exist: ${orderId}`,
  });
}

function bodyHasDeliverToProperty(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;

  if (deliverTo) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include a deliverTo.`,
  });
}

function bodyHasMobileNumberProperty(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;

  if (mobileNumber) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include a mobileNumber.`,
  });
}

function bodyHasDishesProperty(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (dishes) {
    if (Array.isArray(dishes) && dishes.length > 0) {
      return next();
    }
    next({
      status: 400,
      message: `Order must include at least one dish.`,
    });
  }
  next({
    status: 400,
    message: `Orders must include a dish.`,
  });
}

function qualityCheck(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  for (let i = 0; i < dishes.length; i++) {
    if (
      !dishes[i].hasOwnProperty('quantity') ||
      !Number.isInteger(dishes[i].quantity) ||
      dishes[i].quantity <= 0
    ) {
      next({
        status: 400,
        message: `Dish ${i} must have a quantity that is an integer greater than 0.`,
      });
    }
  }
  next();
}

// MIDDLEWARE
function list(req, res, next) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, status, dishes },
  } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

module.exports = {
  list,
  create: [
    bodyHasDeliverToProperty,
    bodyHasMobileNumberProperty,
    bodyHasDishesProperty,
    qualityCheck,
    create,
  ],
  read: [orderExists, read],
};
