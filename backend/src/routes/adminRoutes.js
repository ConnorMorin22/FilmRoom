const express = require("express");
const router = express.Router();
const {
  getUploadUrl,
  initMultipartUpload,
  presignMultipartPart,
  completeMultipartUpload,
  abortMultipartUpload,
  createVideo,
  updateVideo,
} = require("../controllers/adminVideoController");
const { getUsers, getPurchases } = require("../controllers/adminController");
const { protect } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/admin");

router.post("/videos/upload", protect, requireAdmin, getUploadUrl);
router.post("/videos/multipart/init", protect, requireAdmin, initMultipartUpload);
router.post(
  "/videos/multipart/presign",
  protect,
  requireAdmin,
  presignMultipartPart
);
router.post(
  "/videos/multipart/complete",
  protect,
  requireAdmin,
  completeMultipartUpload
);
router.post(
  "/videos/multipart/abort",
  protect,
  requireAdmin,
  abortMultipartUpload
);
router.post("/videos", protect, requireAdmin, createVideo);
router.put("/videos/:id", protect, requireAdmin, updateVideo);
router.get("/users", protect, requireAdmin, getUsers);
router.get("/purchases", protect, requireAdmin, getPurchases);

module.exports = router;

