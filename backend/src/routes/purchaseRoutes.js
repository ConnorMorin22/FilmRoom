const express = require("express");
const router = express.Router();
const {
  createCheckout,
  stripeWebhook,
} = require("../controllers/purchaseController");
const { protect } = require("../middleware/auth");

// Protected routes
router.post("/create-checkout", protect, createCheckout);

// Webhook (no auth - Stripe calls this)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

module.exports = router;
