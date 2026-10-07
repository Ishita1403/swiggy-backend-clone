const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getRecommendations } = require("../controllers/recommendationController");

router.get("/:userId", protect, getRecommendations);

module.exports = router;