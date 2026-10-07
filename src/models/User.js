const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "restaurant","delivery"],
      default: "user",
    },
    isblocked: {
      type: Boolean,
      default: false,
    },
    preferredCuisines: {
  type: [String],
  default: [],
},

frequentlyOrderedItems: {
  type: [String],
  default: [],
},
  },
  { timestamps: true },
);
module.exports = mongoose.model("User", userSchema);
