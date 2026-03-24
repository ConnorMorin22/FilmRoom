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
const Instructor = require("../models/Instructor");

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

const STRIPE_PRICE_ID_RE = /^price_[a-zA-Z0-9]+$/;

/** @returns {{ value: string | null } | { error: string }} */
function parseStripePriceId(raw) {
  if (raw == null || raw === "") return { value: null };
  const s = String(raw).trim();
  if (!s) return { value: null };
  if (s.startsWith("prod_")) {
    return {
      error:
        "Use a Stripe Price ID (price_...), not a Product ID (prod_...).",
    };
  }
  if (!STRIPE_PRICE_ID_RE.test(s)) {
    return {
      error:
        "stripePriceId must be a valid Stripe Price ID starting with price_",
    };
  }
  return { value: s };
}

const ensureS3Credentials = async () => {
  try {
    await s3Client.config.credentials();
    return true;
  } catch (credError) {
    console.error("S3 credentials error:", credError);
    return false;
  }
};

const normalizeTimestamps = (timestamps) => {
  if (!Array.isArray(timestamps)) return [];
  return timestamps
    .map((chapter) => ({
      title: (chapter?.title || "").trim(),
      time: Number(chapter?.time),
    }))
    .filter(
      (chapter) =>
        chapter.title && Number.isFinite(chapter.time) && chapter.time >= 0
    );
};

const toLegacySocials = (instructor) => {
  const socials = [];
  if (!instructor) return socials;
  if (instructor.instagram_url) socials.push({ platform: "instagram", url: instructor.instagram_url });
  if (instructor.twitter_url) socials.push({ platform: "twitter", url: instructor.twitter_url });
  if (instructor.youtube_url) socials.push({ platform: "youtube", url: instructor.youtube_url });
  if (instructor.tiktok_url) socials.push({ platform: "tiktok", url: instructor.tiktok_url });
  return socials;
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

    const postOptions = {
      Bucket: bucket,
      Key: key,
      Expires: 300,
    };

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
      stripePriceId,
      price,
      instructor,
      category,
      duration,
      thumbnail_url,
      instructor_bio,
      instructor_photo,
      instructor_socials,
      skill_level,
      tags,
      is_featured,
      is_active,
      preview_url,
      previewKey,
      video_url,
      timestamps,
      instructor_id,
      instructorId,
    } = req.body;

    if (!title || !description || !s3Key || !price || (!instructor && !instructor_id && !instructorId) || !category) {
      return res.status(400).json({
        error:
          "title, description, s3Key, price, instructor/instructor_id, and category are required",
      });
    }

    if (!thumbnail_url || !duration) {
      return res
        .status(400)
        .json({ error: "thumbnail_url and duration are required" });
    }

    const parsedPriceId = parseStripePriceId(stripePriceId);
    if (parsedPriceId.error) {
      return res.status(400).json({ error: parsedPriceId.error });
    }
    if (Number(price) > 0 && !parsedPriceId.value) {
      return res.status(400).json({
        error:
          "stripePriceId is required for paid courses (Stripe Price ID: price_...)",
      });
    }

    const bucket = getBucketName();
    const finalVideoUrl = video_url || buildPublicUrl(bucket, s3Key);

    const selectedInstructorId = instructor_id || instructorId;
    let selectedInstructor = null;
    if (selectedInstructorId) {
      selectedInstructor = await Instructor.findById(selectedInstructorId);
      if (!selectedInstructor) {
        return res.status(400).json({ error: "Invalid instructor_id" });
      }
    }

    const video = await Video.create({
      title,
      description,
      instructor_id: selectedInstructor?._id || undefined,
      instructor_name: selectedInstructor?.name || instructor,
      instructor_bio: selectedInstructor?.bio || instructor_bio,
      instructor_photo: selectedInstructor?.photo_url || instructor_photo,
      instructor_socials: selectedInstructor ? toLegacySocials(selectedInstructor) : instructor_socials,
      thumbnail_url,
      video_url: finalVideoUrl,
      videoKey: s3Key,
      stripePriceId: parsedPriceId.value,
      price,
      duration,
      category,
      skill_level,
      tags,
      is_featured,
      is_active,
      preview_url,
      previewKey,
      timestamps: normalizeTimestamps(timestamps),
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
      "stripePriceId",
      "price",
      "category",
      "duration",
      "thumbnail_url",
      "instructor_name",
      "instructor_bio",
      "instructor_photo",
      "instructor_socials",
      "skill_level",
      "tags",
      "is_featured",
      "is_active",
      "preview_url",
      "previewKey",
      "video_url",
      "videoKey",
      "instructor_id",
      "timestamps",
    ];

    const updates = Object.keys(req.body || {}).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = req.body[key];
      }
      return acc;
    }, {});

    if (req.body?.s3Key) {
      updates.videoKey = req.body.s3Key;
      if (!updates.video_url) {
        updates.video_url = buildPublicUrl(getBucketName(), req.body.s3Key);
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "timestamps")) {
      updates.timestamps = normalizeTimestamps(req.body.timestamps);
    }

    if (Object.prototype.hasOwnProperty.call(req.body || {}, "instructorId")) {
      updates.instructor_id = req.body.instructorId || null;
    }
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "instructor_id")) {
      updates.instructor_id = req.body.instructor_id || null;
    }

    if (Object.prototype.hasOwnProperty.call(updates, "stripePriceId")) {
      const parsed = parseStripePriceId(updates.stripePriceId);
      if (parsed.error) {
        return res.status(400).json({ error: parsed.error });
      }
      updates.stripePriceId = parsed.value;
    }

    if (updates.instructor_id) {
      const selectedInstructor = await Instructor.findById(updates.instructor_id);
      if (!selectedInstructor) {
        return res.status(400).json({ error: "Invalid instructor_id" });
      }
      updates.instructor_name = selectedInstructor.name || updates.instructor_name;
      updates.instructor_bio = selectedInstructor.bio || updates.instructor_bio;
      updates.instructor_photo = selectedInstructor.photo_url || updates.instructor_photo;
      updates.instructor_socials = toLegacySocials(selectedInstructor);
    }

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

