const AWS = require("aws-sdk");
const path = require("path");
const Video = require("../models/Video");

const s3 = new AWS.S3();

const getBucketName = () =>
  process.env.S3_BUCKET_NAME || "filmroom-prod-videos";

const buildPublicUrl = (bucket, key) => {
  const encodedKey = encodeURIComponent(key).replace(/%2F/g, "/");
  return `https://${bucket}.s3.amazonaws.com/${encodedKey}`;
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

    const uploadUrl = s3.getSignedUrl("putObject", {
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      Expires: 300,
    });

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

