const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Video = require("../models/Video");
const Instructor = require("../models/Instructor");

dotenv.config();

const CORE_INSTRUCTORS = [
  {
    name: "Liam Entenmann",
    slug: "liam-entenmann",
    position: "Goalie",
    school: "Notre Dame",
    pro_team: "Atlas",
    headline: "Goalie • Notre Dame • Atlas",
    credential_line: "PLL Goalie • Notre Dame",
    honors: ["All-American"],
    is_featured: true,
    is_active: true,
    // Match by known legacy name variants + course title hints.
    nameAliases: ["liam entenmann", "liam eneman"],
    titleHints: ["goalie", "complete goalie system"],
  },
  {
    name: "Mike Sisselberger",
    slug: "mike-sisselberger",
    position: "Faceoff Specialist",
    school: "Lehigh",
    pro_team: "Archers",
    headline: "Faceoff Specialist • Lehigh • Archers",
    credential_line: "Elite faceoff specialist",
    honors: ["All-American"],
    is_featured: true,
    is_active: true,
    nameAliases: ["mike sisselberger"],
    titleHints: ["face off blueprint", "faceoff", "face off"],
  },
  {
    name: "Xander Dixon",
    slug: "xander-dixon",
    position: "Attack",
    school: "Virginia",
    pro_team: "Atlas",
    headline: "Attack • Virginia • Atlas",
    credential_line: "All-American attackman",
    honors: ["All-American"],
    is_featured: true,
    is_active: true,
    nameAliases: ["xander dixon"],
    titleHints: ["offensive mastery", "attack"],
  },
];

const toLegacySocials = (instructor) => {
  const socials = [];
  if (instructor.instagram_url) {
    socials.push({ platform: "instagram", url: instructor.instagram_url });
  }
  if (instructor.twitter_url) {
    socials.push({ platform: "twitter", url: instructor.twitter_url });
  }
  if (instructor.youtube_url) {
    socials.push({ platform: "youtube", url: instructor.youtube_url });
  }
  if (instructor.tiktok_url) {
    socials.push({ platform: "tiktok", url: instructor.tiktok_url });
  }
  return socials;
};

const normalized = (value) => String(value || "").trim().toLowerCase();

const run = async () => {
  const mongoUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");

  const videos = await Video.find();
  let totalLinked = 0;

  for (const seed of CORE_INSTRUCTORS) {
    const byName = videos.filter((video) =>
      seed.nameAliases.includes(normalized(video.instructor_name))
    );

    const byTitle = videos.filter((video) => {
      const title = normalized(video.title);
      return seed.titleHints.some((hint) => title.includes(hint));
    });

    const matches = [...new Map([...byName, ...byTitle].map((v) => [String(v._id), v])).values()];
    const primary = matches[0];

    const photo_url =
      primary?.instructor_photo ||
      "";
    const bio =
      primary?.instructor_bio ||
      "";

    const update = {
      name: seed.name,
      slug: seed.slug,
      position: seed.position,
      school: seed.school,
      pro_team: seed.pro_team,
      headline: seed.headline,
      credential_line: seed.credential_line,
      honors: seed.honors,
      is_featured: seed.is_featured,
      is_active: seed.is_active,
      photo_url,
      bio,
    };

    const instructor = await Instructor.findOneAndUpdate(
      { slug: seed.slug },
      { $set: update },
      { upsert: true, new: true }
    );

    if (matches.length > 0) {
      const linkedIds = matches.map((v) => v._id);
      await Video.updateMany(
        { _id: { $in: linkedIds } },
        {
          $set: {
            instructor_id: instructor._id,
            instructor_name: instructor.name,
            instructor_bio: instructor.bio || "",
            instructor_photo: instructor.photo_url || "",
            instructor_socials: toLegacySocials(instructor),
          },
        }
      );
      totalLinked += linkedIds.length;
    }

    console.log(
      `Upserted ${seed.name} (${seed.slug}) and linked ${matches.length} video(s).`
    );
  }

  const instructorCount = await Instructor.countDocuments({
    slug: { $in: CORE_INSTRUCTORS.map((x) => x.slug) },
  });
  console.log(
    `Backfill complete. Core instructors present: ${instructorCount}, videos linked in this run: ${totalLinked}.`
  );

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (error) => {
  console.error("Backfill failed:", error);
  try {
    await mongoose.disconnect();
  } catch (_err) {
    // no-op
  }
  process.exit(1);
});

