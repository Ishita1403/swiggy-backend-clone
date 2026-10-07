const Order = require("../models/order");
const { calculateRiskScore } = require("../services/fraudDetectionService");
const Cart = require("../models/Cart");
const restaurant = require("../models/restaurant");
const DeliveryPartner = require("../models/deliveryPartner");
const { getIO } = require("../../utils/socket");


// ✅ Place Order
exports.placeOrder = async (req, res) => {
  try {
    const { deliveryAddress } = req.body;

    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.menuItem")
      .populate("restaurant");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }
    const fraudCheck = await calculateRiskScore(req.user._id);

    // Validate restaurant approved
    if (!cart.restaurant.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Restaurant not approved"
      });
    }

    // Recalculate total securely
    const items = cart.items.map(item => ({
      menuItem: item.menuItem._id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: item.quantity
    }));

    const totalAmount = items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

   const SurgeSettings = require("../models/surgeSettings");

let settings = await SurgeSettings.findOne();

if (!settings) {
  settings = await SurgeSettings.create({});
}

const recentOrders = await Order.countDocuments({
  restaurant: cart.restaurant._id,
  createdAt: {
    $gte: new Date(Date.now() - 60 * 60 * 1000)
  }
});

const hour = new Date().getHours();

let surgeMultiplier = 1;

if (recentOrders >= 5) {
  surgeMultiplier = surgeMultiplier * 1.2;
}

if (
  (hour >= settings.lunchStart && hour <= settings.lunchEnd) ||
  (hour >= settings.dinnerStart && hour <= settings.dinnerEnd)
) {
  surgeMultiplier = surgeMultiplier * settings.surgeMultiplier;
}

const deliveryFee = settings.baseDeliveryFee * surgeMultiplier;
const deliveryPartner = await DeliveryPartner.findOne({
  isAvailable: true,
  location: {
    $near: {
      $geometry: cart.restaurant.location,
      $maxDistance: 10000
    }
  }
}).sort({ currentWorkload: 1 });
    const order = await Order.create({
      user: req.user._id,
      restaurant: cart.restaurant._id,
      deliveryPartner: deliveryPartner ? deliveryPartner._id : null,
      items,
      totalAmount,
      deliveryFee,
      deliveryAddress,

      riskScore: fraudCheck.score,
      isSuspicious: fraudCheck.isSuspicious,
      fraudReasons: fraudCheck.reasons,
      fraudStatus: fraudCheck.isSuspicious ? "pending" : "none",
    });

    if (deliveryPartner) {
  deliveryPartner.currentWorkload += 1;
  await deliveryPartner.save();
}

    // Clear cart after order
    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// ✅ Get My Orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single order details
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id
    }).populate("deliveryPartner");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ Get Restaurant Orders
exports.getRestaurantOrders = async (req, res) => {
  try {
    const Restaurant = await restaurant.findOne({ owner: req.user._id });

    if (!Restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found"
      });
    }

    const orders = await Order.find({ restaurant: Restaurant._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.mockPayment = async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);

  order.paymentStatus = "Paid";
  order.orderStatus = "Confirmed";

  await order.save();

  res.status(200).json({
    success: true,
    message: "Mock payment successful"
  });
};

// ✅ Update Order Status (Restaurant Only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id)
      .populate("restaurant");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Verify restaurant ownership
    const Restaurant = await restaurant.findOne({ owner: req.user._id });

    if (!Restaurant || Restaurant._id.toString() !== order.restaurant._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    order.orderStatus = status;
    await order.save();

    const io = getIO();

io.to(order.user.toString()).emit("orderStatusUpdated", {
  orderId: order._id,
  status: order.orderStatus,
  message: `Your order status is now ${order.orderStatus}`,
});

    res.status(200).json({
      success: true,
      message: "Order status updated",
      data: order
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.orderStatus === "Delivered") {
      return res.status(400).json({
        message: "Delivered orders cannot be cancelled",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({
        message: "Order is already cancelled",
      });
    }

    order.orderStatus = "Cancelled";
    await order.save();

    const fraudCheck = await calculateRiskScore(req.user._id);

order.riskScore = fraudCheck.score;
order.isSuspicious = fraudCheck.isSuspicious;
order.fraudReasons = fraudCheck.reasons;
order.fraudStatus = fraudCheck.isSuspicious ? "pending" : "none";

await order.save();

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.calculateDeliveryFee = async (req, res) => {
  try {
    const SurgeSettings = require("../models/surgeSettings");

    let settings = await SurgeSettings.findOne();

    if (!settings) {
      settings = await SurgeSettings.create({});
    }

    const hour = new Date().getHours();

    let surgeMultiplier = 1;

   const recentOrders = await Order.countDocuments({
  restaurant: req.query.restaurantId,
  createdAt: {
    $gte: new Date(Date.now() - 60 * 60 * 1000)
  }
});

if (recentOrders >= 5) {
  surgeMultiplier = surgeMultiplier * 1.2;
}

    if (
  (hour >= settings.lunchStart && hour <= settings.lunchEnd) ||
  (hour >= settings.dinnerStart && hour <= settings.dinnerEnd)
) {
  surgeMultiplier = surgeMultiplier * settings.surgeMultiplier;
}
    const deliveryFee = settings.baseDeliveryFee * surgeMultiplier;

    res.status(200).json({
      success: true,
      baseFee: settings.baseDeliveryFee,
      surgeMultiplier,
      deliveryFee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};