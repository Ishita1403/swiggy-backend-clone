const DeliveryPartner = require("../models/deliveryPartner");

exports.setStatus = async (req, res) => {
  try {
    const { partnerId, isAvailable } = req.body;

    const partner = await DeliveryPartner.findByIdAndUpdate(
      partnerId,
      { isAvailable },
      { new: true }
    );

    if (!partner) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Delivery partner status updated",
      data: partner,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.declineOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const Order = require("../models/order");

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const currentPartnerId = order.deliveryPartner;

    const newPartner = await DeliveryPartner.findOne({
      isAvailable: true,
      _id: { $ne: currentPartnerId },
    }).sort({ currentWorkload: 1 });

    if (!newPartner) {
      return res.status(404).json({
        success: false,
        message: "No available delivery partner found",
      });
    }

    if (currentPartnerId) {
      await DeliveryPartner.findByIdAndUpdate(
        currentPartnerId,
        { $inc: { currentWorkload: -1 } }
      );
    }

    order.deliveryPartner = newPartner._id;
    await order.save();

    newPartner.currentWorkload += 1;
    await newPartner.save();

    res.status(200).json({
      success: true,
      message: "Order reassigned successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};