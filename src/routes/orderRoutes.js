const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  placeOrder,
  getMyOrders,
  getRestaurantOrders,
  getOrderById,
  updateOrderStatus,
  mockPayment,
  cancelOrder,
  calculateDeliveryFee
} = require("../controllers/orderController");

router.use(protect);

// User routes
router.post("/", authorize("user"), placeOrder);
router.post("/create", authorize("user"), placeOrder);
router.get("/calculate-delivery-fee", authorize("user"), calculateDeliveryFee);
router.post("/cancel/:orderId", authorize("user"), cancelOrder);
router.get("/my", authorize("user"), getMyOrders);
router.post("/verify", authorize("user"), mockPayment);

// Restaurant routes
router.get("/restaurant", authorize("restaurant"), getRestaurantOrders);
router.put("/:id/status", authorize("restaurant"), updateOrderStatus);

// Order details
router.get("/:orderId", authorize("user"), getOrderById);

module.exports = router;