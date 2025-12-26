const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Video = require("../models/Video");

dotenv.config();

const sampleVideos = [
  {
    title: "Elite Goalie Fundamentals",
    description:
      "Master the art of goaltending with professional techniques from Liam Eneman. Learn positioning, saves, and mental game.",
    instructor_name: "Liam Eneman",
    instructor_bio:
      "Professional lacrosse goalkeeper with 10+ years of elite experience",
    instructor_photo:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    thumbnail_url:
      "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600&h=400&fit=crop",
    video_url: "https://sample-video.com/goalie",
    price: 60,
    duration: 45,
    category: "goalies",
    skill_level: "intermediate",
    is_featured: true,
    is_active: true,
    tags: ["positioning", "saves", "mental game", "footwork"],
  },
  {
    title: "Attack Mastery: Dodging & Shooting",
    description:
      "Elevate your attack game with Xander Dixon's comprehensive training on dodging techniques and shooting accuracy.",
    instructor_name: "Xander Dixon",
    instructor_bio: "All-American attackman and professional player",
    instructor_photo:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    thumbnail_url:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=400&fit=crop",
    video_url: "https://sample-video.com/attack",
    price: 60,
    duration: 50,
    category: "offense",
    skill_level: "advanced",
    is_featured: true,
    is_active: true,
    tags: ["dodging", "shooting", "stick skills", "footwork"],
  },
  {
    title: "Faceoff Domination Techniques",
    description:
      "Learn winning faceoff strategies from Mike Sissleberger. Master clamps, rakes, and counter moves.",
    instructor_name: "Mike Sissleberger",
    instructor_bio: "Elite faceoff specialist with championship experience",
    instructor_photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    thumbnail_url:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=400&fit=crop",
    video_url: "https://sample-video.com/faceoff",
    price: 60,
    duration: 40,
    category: "faceoffs",
    skill_level: "all",
    is_featured: true,
    is_active: true,
    tags: ["clamps", "rakes", "counter moves", "technique"],
  },
];

const seedVideos = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing videos
    await Video.deleteMany({});
    console.log("Cleared existing videos");

    // Insert sample videos
    await Video.insertMany(sampleVideos);
    console.log("✅ Seeded 3 videos successfully");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding videos:", error);
    process.exit(1);
  }
};

seedVideos();
