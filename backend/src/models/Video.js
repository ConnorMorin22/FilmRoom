const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please add a title"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  instructor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
  },
  instructor_name: {
    type: String,
    required: true,
  },
  instructor_bio: String,
  instructor_photo: String,
  instructor_socials: [
    {
      platform: String,
      url: String,
    },
  ],
  thumbnail_url: {
    type: String,
    required: [true, "Please add a thumbnail"],
  },
  thumbnail: {
    type: String,
  },
  video_url: {
    type: String,
    required: [true, "Please add a video URL"],
  },
  preview_url: {
    type: String,
    default: "",
  },
  videoKey: {
    type: String,
  },
  previewKey: {
    type: String,
  },
  /** @deprecated Prefer stripePriceId. Checkout uses Price IDs (price_), not Product IDs (prod_). */
  stripeProductId: {
    type: String,
  },
  /** Stripe Price ID for Checkout: line_items[].price — must start with price_ */
  stripePriceId: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Please add a price"],
    min: 0,
  },
  duration: {
    type: Number, // in minutes
    required: true,
  },
  category: {
    type: String,
    enum: ["offense", "defense", "faceoffs", "goalies"],
    required: true,
  },
  skill_level: {
    type: String,
    enum: ["beginner", "intermediate", "advanced", "all"],
    default: "all",
  },
  is_featured: {
    type: Boolean,
    default: false,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  tags: [String],
  timestamps: [
    {
      title: {
        type: String,
        trim: true,
      },
      time: {
        type: Number,
        min: 0,
      },
    },
  ],
  created_date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Video", videoSchema);
