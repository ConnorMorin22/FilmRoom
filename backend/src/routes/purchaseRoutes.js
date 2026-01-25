const express = require("express");
const router = express.Router();
const {
  createCheckout,
} = require("../controllers/purchaseController");
const { protect } = require("../middleware/auth");

// Protected routes
router.post("/create-checkout", protect, createCheckout);
router.post("/create-checkout-session", protect, createCheckout);

module.exports = router;
