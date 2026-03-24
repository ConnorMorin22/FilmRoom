const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Video = require("../models/Video");
const Instructor = require("../models/Instructor");

dotenv.config();

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const videos = await Video.find();
  const byName = new Map();

  videos.forEach((video) => {
    const name = String(video.instructor_name || "").trim();
    if (!name) return;
    if (!byName.has(name)) byName.set(name, []);
    byName.get(name).push(video);
  });

  for (const [name, list] of byName.entries()) {
    const primary = list[0];
    const slug = slugify(name);
    let instructor = await Instructor.findOne({ slug });
    if (!instructor) {
      instructor = await Instructor.create({
        name,
        slug,
        photo_url: primary.instructor_photo || "",
        bio: primary.instructor_bio || "",
        is_featured: list.some((v) => v.is_featured),
        is_active: true,
      });
    }
    await Video.updateMany(
      { _id: { $in: list.map((v) => v._id) } },
      { $set: { instructor_id: instructor._id } }
    );
  }

  console.log(`Synced ${byName.size} instructors from videos.`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

