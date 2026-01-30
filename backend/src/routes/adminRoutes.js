const express = require("express");
const router = express.Router();
const {
  getUploadUrl,
  createVideo,
} = require("../controllers/adminVideoController");
const { getUsers, getPurchases } = require("../controllers/adminController");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

router.post("/videos/upload", protect, requireAdmin, getUploadUrl);
router.post("/videos", protect, requireAdmin, createVideo);
router.get("/users", protect, requireAdmin, getUsers);
router.get("/purchases", protect, requireAdmin, getPurchases);

module.exports = router;

