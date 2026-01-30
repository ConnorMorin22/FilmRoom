const Video = require("../models/Video");
const Purchase = require("../models/Purchase");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const getCloudFrontSigner = () => {
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
  const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;

  if (!keyPairId || !privateKey) return null;

  const normalizedKey = privateKey.includes("BEGIN")
    ? privateKey
    : Buffer.from(privateKey, "base64").toString("utf8");

  return new AWS.CloudFront.Signer(keyPairId, normalizedKey);
};

const generateSignedUrl = (videoKey) => {
  const cloudfrontUrl = process.env.CLOUDFRONT_URL;
  const cloudfrontSigner = getCloudFrontSigner();

  if (cloudfrontUrl && cloudfrontSigner) {
    const baseUrl = cloudfrontUrl.replace(/\/$/, "");
    const objectPath = videoKey.startsWith("/") ? videoKey : `/${videoKey}`;
    const url = `${baseUrl}${objectPath}`;

    return cloudfrontSigner.getSignedUrl({
      url,
      expires: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
    });
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: videoKey,
    Expires: 4 * 60 * 60, // 4 hours
  };

  return s3.getSignedUrl("getObject", params);
};

const getS3KeyFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (!process.env.S3_BUCKET_NAME) return null;
  try {
    const parsed = new URL(url);
    const bucketHost = `${process.env.S3_BUCKET_NAME}.s3.`;
    if (!parsed.hostname.startsWith(bucketHost)) {
      return null;
    }
    const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    return key || null;
  } catch (error) {
    return null;
  }
};

const maybeSignImageUrl = (url) => {
  const key = getS3KeyFromUrl(url);
  if (!key) return url;
  return s3.getSignedUrl("getObject", {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: 60 * 60,
  });
};

const mapVideoMediaUrls = (video) => ({
  ...video,
  thumbnail_url: maybeSignImageUrl(video.thumbnail_url),
  instructor_photo: maybeSignImageUrl(video.instructor_photo),
});

// @desc    Get all videos
// @route   GET /api/videos
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    const payload = videos.map((video) =>
      mapVideoMediaUrls(video.toObject())
    );
    res.json({ success: true, videos: payload });
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

    res.json({ success: true, video: mapVideoMediaUrls(video.toObject()) });
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

    const videos = purchases.map((p) =>
      p.video ? mapVideoMediaUrls(p.video.toObject()) : p.video
    );

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
