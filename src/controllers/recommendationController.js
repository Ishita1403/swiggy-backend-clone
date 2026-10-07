const Order = require("../models/order");
const Restaurant = require("../models/restaurant");
const User = require("../models/User");

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const orders = await Order.find({ user: userId }).populate("restaurant");

    if (orders.length === 0) {
      const restaurants = await Restaurant.find({ isApproved: true })
        .sort({ popularity: -1, rating: -1 })
        .limit(10);

      return res.status(200).json({
        success: true,
        message: "Popular restaurants recommended",
        data: restaurants,
      });
    }

    const cuisineCount = {};
    const itemCount = {};

    orders.forEach((order) => {
      if (order.restaurant && order.restaurant.cuisine) {
        const cuisine = order.restaurant.cuisine.toLowerCase();
        cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
      }

      order.items.forEach((item) => {
        if (item.name) {
          const itemName = item.name.toLowerCase();
          itemCount[itemName] = (itemCount[itemName] || 0) + item.quantity;
        }
      });
    });

    const preferredCuisines = Object.keys(cuisineCount)
      .sort((a, b) => cuisineCount[b] - cuisineCount[a]);

    const frequentlyOrderedItems = Object.keys(itemCount)
      .sort((a, b) => itemCount[b] - itemCount[a]);

    user.preferredCuisines = preferredCuisines;
    user.frequentlyOrderedItems = frequentlyOrderedItems;
    await user.save();

    const restaurants = await Restaurant.aggregate([
      {
        $match: {
          isApproved: true,
        },
      },
      {
        $addFields: {
          recommendationScore: {
            $add: [
              {
                $cond: [
                  {
                    $in: [
                      { $toLower: "$cuisine" },
                      preferredCuisines,
                    ],
                  },
                  50,
                  0,
                ],
              },
              {
                $multiply: ["$rating", 10],
              },
              {
                $multiply: ["$popularity", 0.2],
              },
            ],
          },
        },
      },
      {
        $sort: {
          recommendationScore: -1,
        },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      success: true,
      preferences: {
        preferredCuisines,
        frequentlyOrderedItems,
      },
      data: restaurants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};