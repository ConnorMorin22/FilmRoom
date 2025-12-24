const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

// Public routes (no authentication required)
router.post("/register", register);
router.post("/login", login);

// Protected route (authentication required)
router.get("/me", protect, getMe);

module.exports = router;
