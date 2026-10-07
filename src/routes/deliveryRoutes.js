const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../middleware/authMiddleware");
const {
  setStatus,
  declineOrder
} = require("../controllers/deliveryController");

router.use(protect);
router.use(authorize("delivery"));

router.put("/set-status", setStatus);
router.put("/decline-order", declineOrder);
module.exports = router;