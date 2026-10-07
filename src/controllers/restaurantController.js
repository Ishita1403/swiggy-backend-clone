const restaurant = require("../models/restaurant");

function isFuzzyMatch(search, text) {
  search = search.toLowerCase();
  text = text.toLowerCase();

  if (text.includes(search)) {
    return true;
  }

  const words = text.split(/\s+/);

  return words.some((word) => {
    if (Math.abs(word.length - search.length) > 1) {
      return false;
    }

    const matrix = [];

    for (let i = 0; i <= word.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= search.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= word.length; i++) {
      for (let j = 1; j <= search.length; j++) {
        if (word[i - 1] === search[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] =
            Math.min(
              matrix[i - 1][j],
              matrix[i][j - 1],
              matrix[i - 1][j - 1]
            ) + 1;
        }
      }
    }

    return matrix[word.length][search.length] <= 1;
  });
}
exports.createRestaurant = async (req, res) => {
  try {
    if (req.user.role !== "restaurant") {
      return res.status(403).json({
        success: false,
        message: "Only restaurant owners can create restaurants",
      });
    }
    const existingRestaurant = await restaurant.findOne({
      owner: req.user._id,
    });
    if (existingRestaurant) {
      return res.status(400).json({
        success: false,
        message: "You already have a restaurant registered",
      });
    }
    const createdRestaurant = await restaurant.create({
      ...req.body,
      owner: req.user._id,
    });
    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      data: createdRestaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating restaurant",
      error: error.message,
    });
  }
};

exports.getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "You don't have a restaurant registered",
      });
    }
    res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching restaurant",
      error: error.message,
    });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "You don't have a restaurant registered",
      });
    }
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this restaurant",
      });
    }
    const updatedRestaurant = await restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      data: updatedRestaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating restaurant",
      error: error.message,
    });
  }
};
exports.getAllRestaurants = async (req, res) => {
  try {
    const { city, page = 1, limit = 10 } = req.query;
    const query = { isApproved: true };
    if (city) {
      query.city = city;
    }
    const restaurants = await restaurant
      .find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching restaurants",
      error: error.message,
    });
  }
};
exports.searchRestaurants = async (req, res) => {
  try {
    const {
      cuisine,
      rating,
      maxDeliveryTime,
      minPrice,
      maxPrice,
      isVeg,
      search,
    } = req.query;

    const match = {};

    if (cuisine) {
      match.cuisine = { $regex: cuisine, $options: "i" };
    }

    if (rating) {
      match.rating = { $gte: Number(rating) };
    }

    if (maxDeliveryTime) {
      match.deliveryTime = { $lte: Number(maxDeliveryTime) };
    }

    if (minPrice || maxPrice) {
      match.priceRange = {};

      if (minPrice) {
        match.priceRange.$gte = Number(minPrice);
      }

      if (maxPrice) {
        match.priceRange.$lte = Number(maxPrice);
      }
    }

    if (isVeg !== undefined) {
      match.isVeg = isVeg === "true";
    }

    if (search) {
  const allRestaurants = await restaurant.find({});

  const matchingIds = allRestaurants
    .filter((r) => isFuzzyMatch(search, r.name))
    .map((r) => r._id);

  match._id = { $in: matchingIds };
}

    const restaurants = await restaurant.aggregate([
      { $match: match },
      {
        $sort: {
          popularity: -1,
          rating: -1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
