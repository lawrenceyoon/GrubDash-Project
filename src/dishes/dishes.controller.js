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
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

function idBodyMatchesIdRoute(req, res, next) {
  const { dishId } = req.params;
  const { data: { id } = {} } = req.body;

  if (id) {
    if (dishId === id) {
      return next();
    }
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function priceIntegerGreaterThanZero(req, res, next) {
  const price = req.body.data.price;

  if (Number.isInteger(price) && price > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0.`,
  });
}

function bodyHasNameProperty(req, res, next) {
  const { data: { name } = {} } = req.body;

  if (name) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a name.`,
  });
}

function bodyHasDescriptionProperty(req, rex, next) {
  const { data: { description } = {} } = req.body;

  if (description) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include a description.`,
  });
}

function bodyHasPriceProperty(req, res, next) {
  const { data: { price } = {} } = req.body;

  if (price) {
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

function bodyHasImageUrlProperty(req, res, next) {
  const { data: { image_url } = {} } = req.body;

  if (image_url) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must include an image_url.`,
  });
}

// MIDDLEWARE
function list(req, res, next) {
  res.json({ data: dishes });
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function read(req, res, next) {
  res.status(200).json({ data: res.locals.dish });
}

function update(req, res, next) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  if (dish.name !== name) {
    dish.name = name;
  }
  if (dish.description !== description) {
    dish.description = description;
  }
  if (dish.price !== price) {
    dish.price = price;
  }
  if (dish.image_url !== image_url) {
    dish.image_url = image_url;
  }
  res.json({ data: dish });
}

function destroy(req, res, next) {
  const { dishId } = req.params;
  const index = dishes.findIndex((dish) => dish.id === dishId);

  dishes.splice(index, 1);
  res.sendStatus(204);
}

// TODO: Implement the /dishes handlers needed to make the tests pass
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
  delete: [dishExists, destroy],
};
