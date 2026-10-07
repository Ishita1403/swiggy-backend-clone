const Order = require("../models/order");
const User = require("../models/User");
const restaurant = require("../models/restaurant");
const SurgeSettings = require("../models/surgeSettings");


exports.getallUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isBlocked ? "blocked" : "unblocked"} successfully`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.approveRestaurant = async (req, res) => {
  try {
    const Restaurant = await restaurant.findById(req.params.id);

    if (!Restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    Restaurant.isApproved = !Restaurant.isApproved;
    await Restaurant.save();

    res.status(200).json({
      success: true,
      message: `Restaurant ${Restaurant.isApproved ? "approved" : "disapproved"} successfully`,
      data: Restaurant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("restaurant", "name");
    res.status(200).json({
      success: true,
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getPlatformStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRestaurants = await restaurant.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRestaurants,
        totalOrders,
        totalRevenue:
          totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getFraudOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      isSuspicious: true,
      fraudStatus: "pending",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.approveFraudOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.fraudStatus = "approved";
    order.isSuspicious = false;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Fraud order approved",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.rejectFraudOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.fraudStatus = "rejected";
    order.orderStatus = "Cancelled";

    await order.save();

    res.status(200).json({
      success: true,
      message: "Fraud order rejected",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.restrictFraudUser = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const user = await User.findById(order.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isblocked = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "User temporarily restricted",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createRestaurantByAdmin = async (req, res) => {
  try {
    const createdRestaurant = await restaurant.create(req.body);

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully by admin",
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

exports.updateRestaurantByAdmin = async (req, res) => {
  try {
    const updatedRestaurant = await restaurant.findByIdAndUpdate(
      req.params.restaurantId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedRestaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully by admin",
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

exports.getSurgeSettings = async (req, res) => {
  try {
    let settings = await SurgeSettings.findOne();

    if (!settings) {
      settings = await SurgeSettings.create({});
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateSurgeSettings = async (req, res) => {
  try {
    let settings = await SurgeSettings.findOne();

    if (!settings) {
      settings = await SurgeSettings.create(req.body);
    } else {
      settings = await SurgeSettings.findByIdAndUpdate(
        settings._id,
        req.body,
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Surge settings updated successfully",
      data: settings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};