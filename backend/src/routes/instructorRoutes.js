const express = require("express");
const router = express.Router();
const {
  getInstructors,
  getInstructorBySlug,
} = require("../controllers/instructorController");

router.get("/", getInstructors);
router.get("/:slug", getInstructorBySlug);

module.exports = router;

