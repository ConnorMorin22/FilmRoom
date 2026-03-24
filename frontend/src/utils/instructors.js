/** Map video category to athlete-facing role label */
export const POSITION_LABEL = {
  offense: "Attack",
  defense: "Defense",
  faceoffs: "Faceoff Specialist",
  goalies: "Goalie",
};

export const ATHLETE_FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face";

const PREFERRED_INSTRUCTOR_LINES = {
  "liam entenmann": {
    position: "Goalie",
    school: "Notre Dame",
    pro_team: "Atlas",
  },
  "mike sisselberger": {
    position: "Faceoff Specialist",
    school: "Lehigh",
    pro_team: "Archers",
  },
  "xander dixon": {
    position: "Attack",
    school: "Virginia",
    pro_team: "Atlas",
  },
};

function credentialSnippet(text, max = 50) {
  if (!text || typeof text !== "string") return "";
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max).trim()}…`;
}

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Headline under instructor name (specific when bio hints league/level).
 * @param {string} categoryKey offense | defense | faceoffs | goalies
 * @param {string} [bio]
 */
export function getInstructorRoleHeadline(categoryKey, bio) {
  const pos = POSITION_LABEL[categoryKey] || "Instructor";
  const b = (bio || "").trim();
  const bl = b.toLowerCase();

  if (/\bpll\b/.test(bl)) {
    if (categoryKey === "goalies") return "PLL Goalie";
    if (categoryKey === "offense") return "PLL Attack";
    if (categoryKey === "defense") return "PLL Defense";
    if (categoryKey === "faceoffs") return "PLL Faceoff Specialist";
    return `PLL · ${pos}`;
  }

  if (/all-?american/.test(bl)) {
    return `${pos} · All-American`;
  }

  if (/\bncaa\b|college|university|\bd-?1\b|division\s*i\b/.test(bl)) {
    return `${pos} · NCAA film`;
  }

  return pos;
}

export function buildStructuredCredibilityLine({
  position = "",
  school = "",
  pro_team = "",
  honors = [],
}) {
  const parts = [position, school, pro_team]
    .map((v) => String(v || "").trim())
    .filter(Boolean);
  if (parts.length) return parts.join(" • ");
  if (Array.isArray(honors) && honors.length) return String(honors[0]).trim();
  return "";
}

/**
 * Second line: trimmed bio, skipped if it duplicates the headline.
 * @param {string} [bio]
 * @param {string} roleHeadline
 */
export function getInstructorCredibilityLine(bio, roleHeadline) {
  const s = credentialSnippet(bio || "", 52);
  if (!s) return "";
  const head = (roleHeadline || "").trim().toLowerCase();
  if (head && s.toLowerCase() === head) return "";
  return s;
}

export function resolveInstructorForVideo(video) {
  const source = video?.instructor || null;
  const category = video?.category;
  const resolvedName = source?.name || video?.instructor_name || "Instructor";
  const normalizedName = String(resolvedName).trim().toLowerCase();
  const preferredLine = PREFERRED_INSTRUCTOR_LINES[normalizedName] || null;
  const roleKey = source?.position
    ? Object.entries(POSITION_LABEL).find(
        ([, label]) => label.toLowerCase() === String(source.position).toLowerCase()
      )?.[0] || category
    : category;

  const fallbackRole = getInstructorRoleHeadline(category, video?.instructor_bio);
  const roleHeadline =
    source?.headline ||
    buildStructuredCredibilityLine(preferredLine || {}) ||
    buildStructuredCredibilityLine({
      position: source?.position,
      school: source?.school,
      pro_team: source?.pro_team,
      honors: source?.honors,
    }) ||
    fallbackRole;

  const credentialLine =
    source?.credential_line ||
    getInstructorCredibilityLine(source?.bio || video?.instructor_bio, roleHeadline);

  const socialsFromEntity = [
    source?.instagram_url
      ? { platform: "instagram", url: source.instagram_url }
      : null,
    source?.twitter_url ? { platform: "twitter", url: source.twitter_url } : null,
    source?.youtube_url ? { platform: "youtube", url: source.youtube_url } : null,
    source?.tiktok_url ? { platform: "tiktok", url: source.tiktok_url } : null,
  ].filter(Boolean);

  return {
    id: source?.id || source?._id || video?.instructor_id || null,
    name: resolvedName,
    photo: source?.photo_url || video?.instructor_photo || ATHLETE_FALLBACK_PHOTO,
    roleKey: roleKey || "offense",
    roleHeadline,
    credentialLine,
    bio: source?.bio || video?.instructor_bio || "",
    socials:
      socialsFromEntity.length > 0
        ? socialsFromEntity
        : Array.isArray(video?.instructor_socials)
        ? video.instructor_socials
        : [],
    slug: source?.slug || slugify(resolvedName),
  };
}

/**
 * Dedupe videos by instructor_name and pick primary category + featured video for links.
 * @param {Array<object>} videos
 */
export function aggregateInstructorsFromVideos(videos) {
  if (!Array.isArray(videos)) return [];

  const byName = new Map();

  for (const v of videos) {
    const resolved = resolveInstructorForVideo(v);
    const name = (resolved.name || "").trim();
    if (!name) continue;
    if (!byName.has(name)) {
      byName.set(name, {
        name,
        photo: resolved.photo || "",
        roleHeadline: resolved.roleHeadline,
        credentialLine: resolved.credentialLine,
        roleKey: resolved.roleKey,
        videos: [],
      });
    }
    byName.get(name).videos.push(v);
  }

  return Array.from(byName.values())
    .map((entry) => {
      const categoryCounts = {};
      entry.videos.forEach((video) => {
        const c = video.category || "offense";
        categoryCounts[c] = (categoryCounts[c] || 0) + 1;
      });
      let topCat = "offense";
      let max = 0;
      Object.entries(categoryCounts).forEach(([c, n]) => {
        if (n > max) {
          max = n;
          topCat = c;
        }
      });

      const sorted = [...entry.videos].sort((a, b) => {
        const af = a.is_featured ? 1 : 0;
        const bf = b.is_featured ? 1 : 0;
        if (bf !== af) return bf - af;
        return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      });
      const primary = sorted[0];
      const resolvedPrimary = resolveInstructorForVideo(primary || {});
      const roleHeadline = entry.roleHeadline || resolvedPrimary.roleHeadline;
      const credentialLine = entry.credentialLine || resolvedPrimary.credentialLine;

      return {
        name: entry.name,
        slug: resolvedPrimary.slug || slugify(entry.name),
        photo:
          entry.photo ||
          resolvedPrimary.photo ||
          "",
        /** @type {keyof typeof POSITION_LABEL} */
        roleKey: entry.roleKey || topCat,
        label: POSITION_LABEL[topCat] || "Pro Instructor",
        roleHeadline,
        credentialLine,
        primaryVideoId: primary?.id,
        courseCount: entry.videos.length,
      };
    })
    .sort((a, b) => b.courseCount - a.courseCount);
}
