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
    message: `Order does not exist: ${orderId}`,
  });
}

function idBodyMatchesIdRoute(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id) {
    if (orderId === id) {
      return next();
    }
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
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

function bodyHasStatusProperty(req, res, next) {
  const { data: { status } = {} } = req.body;
  const statusMessages = [
    'pending',
    'preparing',
    'out-for-delivery',
    'delivered',
  ];

  if (status) {
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of ${statusMessages}.`,
  });
}

// try to break up bodyHasStatusProperty to another statusCheck
function statusCheck(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (res.locals.order.status !== 'delivered') {
    const statusMessages = [
      'pending',
      'preparing',
      'out-for-delivery',
      'delivered',
    ];

    for (let i = 0; i < statusMessages.length; i++) {
      if (status === statusMessages[i]) {
        next();
      }
    }
    next({
      status: 400,
      message: `Order must have a status of ${statusMessages}.`,
    });
  } else {
    next({
      status: 400,
      message: `A delivered order cannot be changed.`,
    });
  }
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

function dishesQuantityPropertyCheck(req, res, next) {
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

//if (res.locals.foundOrder.status === 'delivered') {
//   next({
//     status: 400,
//     message: `A delivered order cannot be changed`,
//   });
// }
function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  if (order.deliverTo !== deliverTo) {
    order.deliverTo = deliverTo;
  }
  if (order.mobileNumber !== mobileNumber) {
    order.mobileNumber = mobileNumber;
  }
  if (order.status !== status) {
    order.status = status;
  }
  if (order.dishes !== dishes) {
    order.dishes = dishes;
  }

  res.json({ data: order });
}

module.exports = {
  list,
  create: [
    bodyHasDeliverToProperty,
    bodyHasMobileNumberProperty,
    bodyHasDishesProperty,
    dishesQuantityPropertyCheck,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    idBodyMatchesIdRoute,
    bodyHasDeliverToProperty,
    bodyHasMobileNumberProperty,
    bodyHasStatusProperty,
    statusCheck,
    bodyHasDishesProperty,
    dishesQuantityPropertyCheck,
    update,
  ],
};
