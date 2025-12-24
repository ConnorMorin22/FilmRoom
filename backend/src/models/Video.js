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
  instructor: {
    name: {
      type: String,
      required: true,
    },
    bio: String,
    profilePicture: String,
  },
  thumbnail: {
    type: String,
    required: [true, "Please add a thumbnail"],
  },
  videoUrl: {
    type: String,
    required: [true, "Please add a video URL"],
  },
  price: {
    type: Number,
    required: [true, "Please add a price"],
    min: 0,
  },
  duration: {
    type: Number, // in seconds
    required: true,
  },
  category: {
    type: String,
    enum: ["Shooting", "Defense", "Faceoff", "Goalie", "Midfield", "General"],
    default: "General",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Video", videoSchema);
