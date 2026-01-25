const express = require("express");
const router = express.Router();
const {
  getAllVideos,
  getVideo,
  getMyLibrary,
  getStreamUrl,
} = require("../controllers/videoController");
const { protect } = require("../middleware/auth");
const { verifyPurchase } = require("../middleware/purchaseCheck");

// Public routes
router.get("/", getAllVideos);

// Protected routes
router.get("/my-library", protect, getMyLibrary);
router.get("/:id/stream", protect, verifyPurchase, getStreamUrl);

// Public routes (after specific protected routes)
router.get("/:id", getVideo);

module.exports = router;
