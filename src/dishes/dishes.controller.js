// dependencies
const path = require('path');
// local files
const dishes = require(path.resolve('src/data/dishes-data'));
const nextId = require('../utils/nextId');

// VALIDATION
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dishId === dish.id);

  if (foundDish) {
    res.locals.dishId = dishId;
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

// check if id in params MATCHES id in req.body
function idBodyMatchesIdRoute(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id) {
    if (dishId === id) {
      res.locals.id = id;
      return next();
    }
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

// checks if price prop is an integer greater than 0
function priceIntegerGreaterThanZero(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (Number.isInteger(price) && price > 0) {
    res.locals.price = price;
    return next();
  }
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0.`,
  });
}

// check if req.body has a name prop
function bodyHasNameProperty(req, res, next) {
  const { data: { name } = {} } = req.body;

  if (name) {
    res.locals.name = name;
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a name.`,
  });
}

// check if req.body has a description prop
function bodyHasDescriptionProperty(req, res, next) {
  const { data: { description } = {} } = req.body;

  if (description) {
    res.locals.description = description;
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a description.`,
  });
}

// check if req.body has a price prop and it isn't 0
function bodyHasPriceProperty(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (price) {
    res.locals.price = price;
    return next();
  }
  if (price === 0) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0.`,
    });
  }
  next({
    status: 400,
    message: `Dish must include a price.`,
  });
}

// check if req.body has an image_url prop
function bodyHasImageUrlProperty(req, res, next) {
  const { data: { image_url } = {} } = req.body;

  if (image_url) {
    res.locals.image_url = image_url;
    return next();
  }
  next({
    status: 400,
    message: `Dish must include an image_url.`,
  });
}

// HANDLER FUNCTIONS
function list(req, res, next) {
  res.json({ data: dishes });
}

function create(req, res, next) {
  const newDish = {
    id: nextId(),
    name: res.locals.name,
    description: res.locals.description,
    price: res.locals.price,
    image_url: res.locals.image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const foundDish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (foundDish.name !== res.locals.name) {
    foundDish.name = res.locals.name;
  }
  if (foundDish.description !== res.locals.description) {
    foundDish.description = res.locals.description;
  }
  if (foundDish.price !== res.locals.price) {
    foundDish.price = res.locals.price;
  }
  if (foundDish.image_url !== res.locals.image_url) {
    foundDish.image_url = res.locals.image_url;
  }
  res.json({ data: foundDish });
}

module.exports = {
  list,
  create: [
    bodyHasNameProperty,
    bodyHasDescriptionProperty,
    bodyHasPriceProperty,
    priceIntegerGreaterThanZero,
    bodyHasImageUrlProperty,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    idBodyMatchesIdRoute,
    bodyHasNameProperty,
    bodyHasDescriptionProperty,
    bodyHasPriceProperty,
    priceIntegerGreaterThanZero,
    bodyHasImageUrlProperty,
    update,
  ],
};
