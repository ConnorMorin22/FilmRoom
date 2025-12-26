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
  instructor_name: {
    type: String,
    required: true,
  },
  instructor_bio: String,
  instructor_photo: String,
  thumbnail_url: {
    type: String,
    required: [true, "Please add a thumbnail"],
  },
  video_url: {
    type: String,
    required: [true, "Please add a video URL"],
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
  created_date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Video", videoSchema);
