const express = require("express");
const router = express.Router();
const {
  getAllVideos,
  getVideo,
  getMyLibrary,
} = require("../controllers/videoController");
const { protect } = require("../middleware/auth");

// Public routes
router.get("/", getAllVideos);
router.get("/:id", getVideo);

// Protected routes
router.get("/my-library", protect, getMyLibrary);

module.exports = router;
