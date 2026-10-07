const mongoose = require("mongoose");

const surgeSettingsSchema = new mongoose.Schema({
  baseDeliveryFee: {
    type: Number,
    default: 40
  },
  surgeMultiplier: {
    type: Number,
    default: 1.5
  },
  lunchStart: {
    type: Number,
    default: 12
  },
  lunchEnd: {
    type: Number,
    default: 14
  },
  dinnerStart: {
    type: Number,
    default: 19
  },
  dinnerEnd: {
    type: Number,
    default: 21
  }
});

module.exports = mongoose.model("SurgeSettings", surgeSettingsSchema);