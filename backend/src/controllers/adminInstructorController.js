const Instructor = require("../models/Instructor");
const Video = require("../models/Video");

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseHonors = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const toPayload = (doc) => ({
  id: doc._id,
  name: doc.name,
  slug: doc.slug,
  photo_url: doc.photo_url || "",
  headline: doc.headline || "",
  bio: doc.bio || "",
  position: doc.position || "",
  credential_line: doc.credential_line || "",
  school: doc.school || "",
  pro_team: doc.pro_team || "",
  honors: Array.isArray(doc.honors) ? doc.honors : [],
  instagram_url: doc.instagram_url || "",
  twitter_url: doc.twitter_url || "",
  youtube_url: doc.youtube_url || "",
  tiktok_url: doc.tiktok_url || "",
  is_featured: Boolean(doc.is_featured),
  is_active: doc.is_active !== false,
});

exports.getAdminInstructors = async (_req, res) => {
  try {
    const instructors = await Instructor.find().sort({ is_featured: -1, name: 1 });
    return res.json({
      success: true,
      instructors: instructors.map(toPayload),
    });
  } catch (error) {
    console.error("Admin get instructors error:", error);
    return res.status(500).json({ error: "Error fetching instructors" });
  }
};

exports.createInstructor = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.name) {
      return res.status(400).json({ error: "name is required" });
    }
    let slug = payload.slug ? slugify(payload.slug) : slugify(payload.name);
    if (!slug) slug = `instructor-${Date.now()}`;

    const exists = await Instructor.findOne({ slug });
    if (exists) {
      return res.status(400).json({ error: "slug already exists" });
    }

    const instructor = await Instructor.create({
      name: payload.name,
      slug,
      photo_url: payload.photo_url || "",
      headline: payload.headline || "",
      bio: payload.bio || "",
      position: payload.position || "",
      credential_line: payload.credential_line || "",
      school: payload.school || "",
      pro_team: payload.pro_team || "",
      honors: parseHonors(payload.honors),
      instagram_url: payload.instagram_url || "",
      twitter_url: payload.twitter_url || "",
      youtube_url: payload.youtube_url || "",
      tiktok_url: payload.tiktok_url || "",
      is_featured: Boolean(payload.is_featured),
      is_active: payload.is_active !== false,
    });
    return res.status(201).json({ success: true, instructor: toPayload(instructor) });
  } catch (error) {
    console.error("Admin create instructor error:", error);
    return res.status(500).json({ error: "Error creating instructor" });
  }
};

exports.updateInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...(req.body || {}) };
    if (Object.prototype.hasOwnProperty.call(updates, "slug")) {
      updates.slug = slugify(updates.slug);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "honors")) {
      updates.honors = parseHonors(updates.honors);
    }
    const instructor = await Instructor.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }
    return res.json({ success: true, instructor: toPayload(instructor) });
  } catch (error) {
    console.error("Admin update instructor error:", error);
    return res.status(500).json({ error: "Error updating instructor" });
  }
};

exports.deleteInstructor = async (req, res) => {
  try {
    const { id } = req.params;
    const linkedVideos = await Video.countDocuments({ instructor_id: id });
    if (linkedVideos > 0) {
      const instructor = await Instructor.findByIdAndUpdate(
        id,
        { is_active: false },
        { new: true }
      );
      if (!instructor) return res.status(404).json({ error: "Instructor not found" });
      return res.json({
        success: true,
        soft_deleted: true,
        instructor: toPayload(instructor),
      });
    }
    await Instructor.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (error) {
    console.error("Admin delete instructor error:", error);
    return res.status(500).json({ error: "Error deleting instructor" });
  }
};

