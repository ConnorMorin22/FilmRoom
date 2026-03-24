const Instructor = require("../models/Instructor");

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

// @desc    Get active instructors
// @route   GET /api/instructors
exports.getInstructors = async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === "true";
    const filter = includeInactive ? {} : { is_active: true };
    const instructors = await Instructor.find(filter).sort({
      is_featured: -1,
      name: 1,
    });
    return res.json({
      success: true,
      instructors: instructors.map(toPayload),
    });
  } catch (error) {
    console.error("Get instructors error:", error);
    return res.status(500).json({ error: "Error fetching instructors" });
  }
};

// @desc    Get instructor by slug
// @route   GET /api/instructors/:slug
exports.getInstructorBySlug = async (req, res) => {
  try {
    const instructor = await Instructor.findOne({
      slug: String(req.params.slug || "").toLowerCase(),
      is_active: true,
    });
    if (!instructor) {
      return res.status(404).json({ error: "Instructor not found" });
    }
    return res.json({ success: true, instructor: toPayload(instructor) });
  } catch (error) {
    console.error("Get instructor by slug error:", error);
    return res.status(500).json({ error: "Error fetching instructor" });
  }
};

