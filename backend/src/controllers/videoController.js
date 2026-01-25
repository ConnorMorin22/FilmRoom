const Video = require("../models/Video");
const Purchase = require("../models/Purchase");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const generateSignedUrl = (videoKey) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: videoKey,
    Expires: 4 * 60 * 60, // 4 hours
  };

  return s3.getSignedUrl("getObject", params);
};

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

// @desc    Get signed stream URL for purchased video
// @route   GET /api/videos/:id/stream
exports.getStreamUrl = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoKey = video.videoKey;
    if (!videoKey) {
      return res.status(400).json({ error: "Video not available for streaming" });
    }

    if (!process.env.S3_BUCKET_NAME) {
      return res.status(500).json({ error: "Streaming not configured" });
    }

    const streamUrl = generateSignedUrl(videoKey);
    res.json({ streamUrl });
  } catch (error) {
    console.error("Get stream URL error:", error);
    res.status(500).json({ error: "Error generating stream URL" });
  }
};
