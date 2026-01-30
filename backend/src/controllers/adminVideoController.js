const path = require("path");
const { S3Client } = require("@aws-sdk/client-s3");
const { createPresignedPost } = require("@aws-sdk/s3-presigned-post");
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

const s3Client = new S3Client({
  region: getRegion(),
  requestChecksumCalculation: "NEVER",
  responseChecksumValidation: "NEVER",
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

    if (!filename) {
      return res.status(400).json({ error: "filename is required" });
    }

    const bucket = getBucketName();
    const safeName = sanitizeFileName(filename);
    const prefix = folder ? `${folder.replace(/\/+$/g, "")}/` : "uploads/";
    const key = `${prefix}${Date.now()}_${safeName}`;

    try {
      await s3Client.config.credentials();
    } catch (credError) {
      console.error("S3 credentials error:", credError);
      return res.status(500).json({ error: "S3 credentials not available" });
    }

    const { url: uploadUrl, fields } = await createPresignedPost(s3Client, {
      Bucket: bucket,
      Key: key,
      Expires: 300,
    });
    const encodedKey = encodeURIComponent(key).replace(/%2F/g, "/");

    console.log("S3 presign", {
      bucket,
      key,
      region: getRegion(),
      contentType,
      uploadUrl,
      sdk: "v3-post",
    });

    if (!uploadUrl.includes(bucket) || fields?.key !== key) {
      return res.status(500).json({
        error: "Presigned upload data is missing bucket or object key",
        uploadUrl,
        fields,
      });
    }

    return res.json({
      uploadUrl,
      fields,
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

