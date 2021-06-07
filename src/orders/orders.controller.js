// dependencies
const path = require('path');
// local files
const orders = require(path.resolve('src/data/orders-data'));
const nextId = require('../utils/nextId');

// VALIDATION
// check if order DOES exist, if not return error
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => orderId === order.id);
  res.locals.orderId = orderId;
  res.locals.order = foundOrder;

  if (foundOrder) {
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

// check if id in params MATCHES id in req.body
function idBodyMatchesIdRoute(req, res, next) {
  const { orderId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id) {
    if (orderId === id) {
      res.locals.id = id;
      return next();
    }
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  } else {
    next();
  }
}

// check if req.body has a deliverTo prop
function bodyHasDeliverToProperty(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;

  if (deliverTo) {
    res.locals.deliverTo = deliverTo;
    return next();
  }
  next({
    status: 400,
    message: `Order must include a deliverTo.`,
  });
}

// check if req.body has a mobileNumber prop
function bodyHasMobileNumberProperty(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;

  if (mobileNumber) {
    res.locals.mobileNumber = mobileNumber;
    return next();
  }
  next({
    status: 400,
    message: `Order must include a mobileNumber.`,
  });
}

// check if req.body has a status prop
function bodyHasStatusProperty(req, res, next) {
  const { data: { status } = {} } = req.body;
  const statusMessages = [
    'pending',
    'preparing',
    'out-for-delivery',
    'delivered',
  ];

  if (status) {
    res.locals.status = status;
    return next();
  }
  next({
    status: 400,
    message: `Order must have a status of ${statusMessages}.`,
  });
}

// check if status has one of the following messages, the previous does NOT have a state of delivered,
function statusCheckForUpdate(req, res, next) {
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

// checks if req.body.status is pending
function deleteOnlyOnPendingStatus(req, res, next) {
  if (res.locals.order.status !== 'pending') {
    next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`,
    });
  }
  next();
}

// checks if req.body has dishes prop
function bodyHasDishesProperty(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  if (dishes) {
    res.locals.dishes = dishes;
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

// checks if dishes is an integer greater than 0 and has a quantity prop
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

// HANDLER FUNCTIONS
function list(req, res, next) {
  res.json({ data: orders });
}

function create(req, res, next) {
  const newOrder = {
    id: nextId(),
    deliverTo: res.locals.deliverTo,
    mobileNumber: res.locals.mobileNumber,
    status: res.locals.status,
    dishes: res.locals.dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const foundOrder = res.locals.order;

  if (foundOrder.deliverTo !== res.locals.deliverTo) {
    foundOrder.deliverTo = res.locals.deliverTo;
  }
  if (foundOrder.mobileNumber !== res.locals.mobileNumber) {
    foundOrder.mobileNumber = res.locals.mobileNumber;
  }
  if (foundOrder.status !== res.locals.status) {
    foundOrder.status = res.locals.status;
  }
  if (foundOrder.dishes !== res.locals.dishes) {
    foundOrder.dishes = res.locals.dishes;
  }
  res.json({ data: foundOrder });
}

function destroy(req, res, next) {
  const index = orders.findIndex((order) => order.id === res.locals.orderId);

  orders.splice(index, 1);
  res.sendStatus(204);
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
    statusCheckForUpdate,
    bodyHasDishesProperty,
    dishesQuantityPropertyCheck,
    update,
  ],
  delete: [orderExists, deleteOnlyOnPendingStatus, destroy],
};
