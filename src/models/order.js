const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
        },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryFee: {
  type: Number,
  required: true,
  default: 0,
},
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    riskScore:{
      type: Number,
      default: 0,
    },
    isSuspicious:{
      type: Boolean,
      default: false,
    },

    fraudReasons: [
      {
        type: String,
      }
    ],

    fraudStatus: {
      type: String,
      enum: ["none","pending","approved","rejected"],
      default: "none",
    },

    deliveryPartner: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "DeliveryPartner",
  default: null
},

  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
