const AWS = require("aws-sdk");
const path = require("path");
const Video = require("../models/Video");

const getRegion = () =>
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  process.env.S3_REGION ||
  "us-east-2";

const getBucketName = () => {
  const bucket = process.env.S3_BUCKET_NAME || "filmroom-prod-videos";
  return bucket && bucket.trim() ? bucket.trim() : "filmroom-prod-videos";
};

const createS3Client = (bucket) =>
  new AWS.S3({
    region: getRegion(),
    signatureVersion: "v4",
    s3ForcePathStyle: false,
    s3BucketEndpoint: true,
    endpoint: `https://${bucket}.s3.${getRegion()}.amazonaws.com`,
  });

const buildPublicUrl = (bucket, key) => {
  const encodedKey = encodeURIComponent(key).replace(/%2F/g, "/");
  return `https://${bucket}.s3.${getRegion()}.amazonaws.com/${encodedKey}`;
};

const sanitizeFileName = (fileName) =>
  path.basename(fileName).replace(/\s+/g, "_");

// @desc    Get presigned S3 upload URL
// @route   POST /api/admin/videos/upload
exports.getUploadUrl = async (req, res) => {
  try {
    const { filename, contentType, folder } = req.body;

    if (!filename || !contentType) {
      return res
        .status(400)
        .json({ error: "filename and contentType are required" });
    }

    const bucket = getBucketName();
    const safeName = sanitizeFileName(filename);
    const prefix = folder ? `${folder.replace(/\/+$/g, "")}/` : "uploads/";
    const key = `${prefix}${Date.now()}_${safeName}`;

    const s3 = createS3Client(bucket);
    const uploadUrl = s3.getSignedUrl("putObject", {
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Expires: 300,
    });

    console.log("S3 presign", {
      bucket,
      key,
      region: getRegion(),
      uploadUrl,
    });

    if (!uploadUrl.includes(`${bucket}.s3.`)) {
      return res.status(500).json({
        error: "Presigned URL is missing bucket host",
        uploadUrl,
      });
    }

    return res.json({
      uploadUrl,
      s3Key: key,
      bucket,
      fileUrl: buildPublicUrl(bucket, key),
    });
  } catch (error) {
    console.error("Presign upload error:", error);
    return res.status(500).json({ error: "Error generating upload URL" });
  }
};

// @desc    Create video record
// @route   POST /api/admin/videos
exports.createVideo = async (req, res) => {
  try {
    const {
      title,
      description,
      s3Key,
      stripeProductId,
      price,
      instructor,
      category,
      duration,
      thumbnail_url,
      instructor_bio,
      instructor_photo,
      skill_level,
      tags,
      is_featured,
      is_active,
      preview_url,
      video_url,
    } = req.body;

    if (
      !title ||
      !description ||
      !s3Key ||
      !price ||
      !instructor ||
      !category
    ) {
      return res.status(400).json({
        error:
          "title, description, s3Key, price, instructor, and category are required",
      });
    }

    if (!thumbnail_url || !duration) {
      return res
        .status(400)
        .json({ error: "thumbnail_url and duration are required" });
    }

    const bucket = getBucketName();
    const finalVideoUrl = video_url || buildPublicUrl(bucket, s3Key);

    const video = await Video.create({
      title,
      description,
      instructor_name: instructor,
      instructor_bio,
      instructor_photo,
      thumbnail_url,
      video_url: finalVideoUrl,
      videoKey: s3Key,
      stripeProductId,
      price,
      duration,
      category,
      skill_level,
      tags,
      is_featured,
      is_active,
      preview_url,
    });

    return res.status(201).json({ success: true, video });
  } catch (error) {
    console.error("Create video error:", error);
    return res.status(500).json({ error: "Error creating video" });
  }
};

// @desc    Update video record (admin)
// @route   PUT /api/admin/videos/:id
exports.updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = [
      "title",
      "description",
      "stripeProductId",
      "price",
      "category",
      "duration",
      "thumbnail_url",
      "instructor_name",
      "instructor_bio",
      "instructor_photo",
      "skill_level",
      "tags",
      "is_featured",
      "is_active",
      "preview_url",
      "video_url",
      "videoKey",
    ];

    const updates = Object.keys(req.body || {}).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {});

    const video = await Video.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    return res.json({ success: true, video });
  } catch (error) {
    console.error("Update video error:", error);
    return res.status(500).json({ error: "Error updating video" });
  }
};

