const express = require("express");
const router = express.Router();
const { listTopReviews } = require("../controllers/reviewController");

router.get("/top", listTopReviews);

module.exports = router;

