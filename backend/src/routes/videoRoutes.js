const express = require("express");
const router = express.Router();
const {
  getAllVideos,
  getVideo,
  getMyLibrary,
  getStreamUrl,
} = require("../controllers/videoController");
const {
  createReview,
  listReviewsForVideo,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");
const { verifyPurchase } = require("../middleware/purchaseCheck");

// Public routes
router.get("/", getAllVideos);

// Protected routes
router.get("/my-library", protect, getMyLibrary);
router.get("/:id/stream", protect, verifyPurchase, getStreamUrl);
router.post("/:id/reviews", protect, verifyPurchase, createReview);

// Public routes (after specific protected routes)
router.get("/:id", getVideo);
router.get("/:id/reviews", listReviewsForVideo);

module.exports = router;
