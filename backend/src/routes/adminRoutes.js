const express = require("express");
const router = express.Router();
const {
  getUploadUrl,
  createVideo,
} = require("../controllers/adminVideoController");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

router.post("/videos/upload", protect, requireAdmin, getUploadUrl);
router.post("/videos", protect, requireAdmin, createVideo);

module.exports = router;

