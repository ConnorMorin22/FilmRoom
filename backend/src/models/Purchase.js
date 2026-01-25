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
  stripeSessionId: {
    type: String,
    required: false, // Changed from true
    unique: true, // Add this
    sparse: true, // Add this - allows multiple null/undefined values
  },
  stripePaymentIntentId: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
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
