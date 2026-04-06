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
  deleteVideo,
} = require("../controllers/adminVideoController");
const {
  getUsers,
  getPurchases,
  getReviews,
  deleteReview,
} = require("../controllers/adminController");
const {
  getAdminInstructors,
  createInstructor,
  updateInstructor,
  deleteInstructor,
} = require("../controllers/adminInstructorController");
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
router.delete("/videos/:id", protect, requireAdmin, deleteVideo);
router.get("/users", protect, requireAdmin, getUsers);
router.get("/purchases", protect, requireAdmin, getPurchases);
router.get("/reviews", protect, requireAdmin, getReviews);
router.delete("/reviews/:id", protect, requireAdmin, deleteReview);
router.get("/instructors", protect, requireAdmin, getAdminInstructors);
router.post("/instructors", protect, requireAdmin, createInstructor);
router.put("/instructors/:id", protect, requireAdmin, updateInstructor);
router.delete("/instructors/:id", protect, requireAdmin, deleteInstructor);

module.exports = router;

