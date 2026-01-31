const Review = require("../models/Review");
const Purchase = require("../models/Purchase");

const mapReview = (review) => ({
  id: review._id,
  rating: review.rating,
  title: review.title,
  body: review.body,
  created_date: review.created_date,
  user_name: review.user?.name || "Anonymous",
  video_title: review.video?.title,
});

exports.createReview = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const { rating, title, body } = req.body;

    if (!rating || !title || !body) {
      return res.status(400).json({ error: "rating, title, and body required" });
    }

    const purchase = await Purchase.findOne({
      user: req.user._id,
      video: videoId,
      status: "completed",
    });

    if (!purchase) {
      return res.status(403).json({ error: "Purchase required to review" });
    }

    const review = await Review.create({
      user: req.user._id,
      video: videoId,
      rating,
      title,
      body,
    });

    const populated = await review.populate("user", "name");

    return res.status(201).json({ success: true, review: mapReview(populated) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Review already exists" });
    }
    console.error("Create review error:", error);
    return res.status(500).json({ error: "Error creating review" });
  }
};

exports.listReviewsForVideo = async (req, res) => {
  try {
    const { id: videoId } = req.params;
    const reviews = await Review.find({ video: videoId })
      .sort({ created_date: -1 })
      .populate("user", "name");

    return res.json({
      success: true,
      reviews: reviews.map((review) => mapReview(review)),
    });
  } catch (error) {
    console.error("List reviews error:", error);
    return res.status(500).json({ error: "Error fetching reviews" });
  }
};

exports.listTopReviews = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 8, 20);
    const reviews = await Review.find()
      .sort({ created_date: -1 })
      .limit(limit)
      .populate("user", "name")
      .populate("video", "title");

    return res.json({
      success: true,
      reviews: reviews.map((review) => mapReview(review)),
    });
  } catch (error) {
    console.error("Top reviews error:", error);
    return res.status(500).json({ error: "Error fetching reviews" });
  }
};

