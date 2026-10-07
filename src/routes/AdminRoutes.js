const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getallUsers,
  toggleBlockUser,
  approveRestaurant,
  getAllOrders,
  getPlatformStatistics,
  getFraudOrders,
  approveFraudOrder,
  rejectFraudOrder,
  restrictFraudUser,
  createRestaurantByAdmin,
  updateRestaurantByAdmin,
  getSurgeSettings,
  updateSurgeSettings,
} = require("../controllers/AdminController");

router.use(protect);
router.use(authorize("admin"));
router.post("/restaurants/create", createRestaurantByAdmin);

router.put(
  "/restaurants/update/:restaurantId",
  updateRestaurantByAdmin
);
router.get("/surge-settings", getSurgeSettings);

router.put("/surge-settings", updateSurgeSettings);

router.get("/", getallUsers);
router.put("/users/:id/block", toggleBlockUser);
router.put("/restaurant/:id/approve", approveRestaurant);
router.get("/statistics", getPlatformStatistics);
router.get("/orders", getAllOrders);
router.get("/fraud/orders", getFraudOrders);
router.put("/fraud/orders/:orderId/approve", approveFraudOrder);
router.put("/fraud/orders/:orderId/reject", rejectFraudOrder);
router.put("/fraud/orders/:orderId/restrict-user", restrictFraudUser);

module.exports = router;
