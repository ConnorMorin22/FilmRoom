const Video = require("../models/Video");
const Purchase = require("../models/Purchase");

// @desc    Get all videos
// @route   GET /api/videos
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    res.json({ success: true, videos });
  } catch (error) {
    console.error("Get videos error:", error);
    res.status(500).json({ error: "Error fetching videos" });
  }
};

// @desc    Get single video
// @route   GET /api/videos/:id
exports.getVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({ success: true, video });
  } catch (error) {
    console.error("Get video error:", error);
    res.status(500).json({ error: "Error fetching video" });
  }
};

// @desc    Get user's purchased videos
// @route   GET /api/videos/my-library
exports.getMyLibrary = async (req, res) => {
  try {
    const purchases = await Purchase.find({ user: req.user._id }).populate(
      "video"
    );

    const videos = purchases.map((p) => p.video);

    res.json({ success: true, videos });
  } catch (error) {
    console.error("Get library error:", error);
    res.status(500).json({ error: "Error fetching library" });
  }
};
