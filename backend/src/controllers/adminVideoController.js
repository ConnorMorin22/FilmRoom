const path = require("path");
const {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} = require("@aws-sdk/client-s3");
const { createPresignedPost } = require("@aws-sdk/s3-presigned-post");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
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

const ensureS3Credentials = async () => {
  try {
    await s3Client.config.credentials();
    return true;
  } catch (credError) {
    console.error("S3 credentials error:", credError);
    return false;
  }
};

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

    const hasCredentials = await ensureS3Credentials();
    if (!hasCredentials) {
      return res.status(500).json({ error: "S3 credentials not available" });
    }

    const isImageUpload = prefix.startsWith("images/");
    const postOptions = {
      Bucket: bucket,
      Key: key,
      Expires: 300,
    };

    if (isImageUpload) {
      postOptions.Fields = { acl: "public-read" };
      postOptions.Conditions = [{ acl: "public-read" }];
    }

    const { url: uploadUrl, fields } = await createPresignedPost(
      s3Client,
      postOptions
    );
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

// @desc    Init multipart upload
// @route   POST /api/admin/videos/multipart/init
exports.initMultipartUpload = async (req, res) => {
  try {
    const { filename, contentType, folder } = req.body;

    if (!filename) {
      return res.status(400).json({ error: "filename is required" });
    }

    const hasCredentials = await ensureS3Credentials();
    if (!hasCredentials) {
      return res.status(500).json({ error: "S3 credentials not available" });
    }

    const bucket = getBucketName();
    const safeName = sanitizeFileName(filename);
    const prefix = folder ? `${folder.replace(/\/+$/g, "")}/` : "uploads/";
    const key = `${prefix}${Date.now()}_${safeName}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || undefined,
    });

    const { UploadId: uploadId } = await s3Client.send(command);
    if (!uploadId) {
      return res.status(500).json({ error: "Failed to start multipart upload" });
    }

    console.log("S3 multipart init", {
      bucket,
      key,
      uploadId,
      region: getRegion(),
      contentType,
    });

    return res.json({
      uploadId,
      s3Key: key,
      bucket,
      fileUrl: buildPublicUrl(bucket, key),
    });
  } catch (error) {
    console.error("Multipart init error:", error);
    return res.status(500).json({ error: "Error starting multipart upload" });
  }
};

// @desc    Presign a multipart upload part
// @route   POST /api/admin/videos/multipart/presign
exports.presignMultipartPart = async (req, res) => {
  try {
    const { uploadId, s3Key, partNumber } = req.body;

    if (!uploadId || !s3Key || !partNumber) {
      return res.status(400).json({
        error: "uploadId, s3Key, and partNumber are required",
      });
    }

    const parsedPart = Number(partNumber);
    if (!Number.isInteger(parsedPart) || parsedPart < 1 || parsedPart > 10000) {
      return res.status(400).json({ error: "partNumber must be 1-10000" });
    }

    const hasCredentials = await ensureS3Credentials();
    if (!hasCredentials) {
      return res.status(500).json({ error: "S3 credentials not available" });
    }

    const bucket = getBucketName();
    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: s3Key,
      UploadId: uploadId,
      PartNumber: parsedPart,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    console.log("S3 multipart presign", {
      bucket,
      key: s3Key,
      uploadId,
      partNumber: parsedPart,
    });

    return res.json({ uploadUrl });
  } catch (error) {
    console.error("Multipart presign error:", error);
    return res.status(500).json({ error: "Error presigning upload part" });
  }
};

// @desc    Complete multipart upload
// @route   POST /api/admin/videos/multipart/complete
exports.completeMultipartUpload = async (req, res) => {
  try {
    const { uploadId, s3Key, parts } = req.body;

    if (!uploadId || !s3Key || !Array.isArray(parts) || parts.length === 0) {
      return res.status(400).json({
        error: "uploadId, s3Key, and parts are required",
      });
    }

    const bucket = getBucketName();
    const normalizedParts = parts
      .map((part) => ({
        ETag: part.ETag,
        PartNumber: Number(part.PartNumber),
      }))
      .filter((part) => part.ETag && Number.isInteger(part.PartNumber))
      .sort((a, b) => a.PartNumber - b.PartNumber);

    if (!normalizedParts.length) {
      return res.status(400).json({ error: "No valid parts provided" });
    }

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: s3Key,
      UploadId: uploadId,
      MultipartUpload: { Parts: normalizedParts },
    });

    await s3Client.send(command);

    console.log("S3 multipart complete", {
      bucket,
      key: s3Key,
      uploadId,
      parts: normalizedParts.length,
    });

    return res.json({
      success: true,
      fileUrl: buildPublicUrl(bucket, s3Key),
    });
  } catch (error) {
    console.error("Multipart complete error:", error);
    return res.status(500).json({ error: "Error completing multipart upload" });
  }
};

// @desc    Abort multipart upload
// @route   POST /api/admin/videos/multipart/abort
exports.abortMultipartUpload = async (req, res) => {
  try {
    const { uploadId, s3Key } = req.body;

    if (!uploadId || !s3Key) {
      return res.status(400).json({ error: "uploadId and s3Key are required" });
    }

    const bucket = getBucketName();
    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: s3Key,
      UploadId: uploadId,
    });

    await s3Client.send(command);

    return res.json({ success: true });
  } catch (error) {
    console.error("Multipart abort error:", error);
    return res.status(500).json({ error: "Error aborting multipart upload" });
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

