const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
  type: {
    type: String,
    enum: ["Point"],
    default: "Point"
  },
  coordinates: {
    type: [Number],
    default: [0, 0]
  }
},
    rating: {
      type: Number,
      default: 0,
    },
    cuisine: {
  type: String,
  default: "",
},

priceRange: {
  type: Number,
  default: 0,
},

deliveryTime: {
  type: Number,
  default: 0,
},

isVeg: {
  type: Boolean,
  default: false,
},

popularity: {
  type: Number,
  default: 0,
},
    image: {
      type: String,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);
restaurantSchema.index({ location: "2dsphere" });
restaurantSchema.index({ name: "text", cuisine: 1 });
restaurantSchema.index({ rating: -1 });
restaurantSchema.index({ deliveryTime: 1 });
restaurantSchema.index({ priceRange: 1 });
restaurantSchema.index({ popularity: -1 });

module.exports = mongoose.model("Restaurant", restaurantSchema);
