const mongoose = require("mongoose");

const socialUrl = {
  type: String,
  trim: true,
  default: "",
};

const instructorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add instructor name"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Please add instructor slug"],
      trim: true,
      lowercase: true,
      unique: true,
    },
    photo_url: {
      type: String,
      trim: true,
      default: "",
    },
    headline: {
      type: String,
      trim: true,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    position: {
      type: String,
      trim: true,
      default: "",
    },
    credential_line: {
      type: String,
      trim: true,
      default: "",
    },
    school: {
      type: String,
      trim: true,
      default: "",
    },
    pro_team: {
      type: String,
      trim: true,
      default: "",
    },
    honors: [String],
    instagram_url: socialUrl,
    twitter_url: socialUrl,
    youtube_url: socialUrl,
    tiktok_url: socialUrl,
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Instructor", instructorSchema);
