const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
  /** Same Checkout Session / PaymentIntent can cover multiple videos — must not be globally unique */
  stripeSessionId: {
    type: String,
    required: false,
  },
  stripePaymentIntentId: {
    type: String,
    required: false,
  },
  amount: {
    type: Number, // in cents
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "completed",
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate purchases
purchaseSchema.index({ user: 1, video: 1 }, { unique: true });

module.exports = mongoose.model("Purchase", purchaseSchema);
