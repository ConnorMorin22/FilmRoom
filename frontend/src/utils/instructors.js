/** Map video category to athlete-facing role label */
export const POSITION_LABEL = {
  offense: "Attack",
  defense: "Defense",
  faceoffs: "Faceoff Specialist",
  goalies: "Goalie",
};

export const ATHLETE_FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face";

function credentialSnippet(text, max = 40) {
  if (!text || typeof text !== "string") return "";
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max).trim()}…`;
}

/**
 * Dedupe videos by instructor_name and pick primary category + featured video for links.
 * @param {Array<object>} videos
 */
export function aggregateInstructorsFromVideos(videos) {
  if (!Array.isArray(videos)) return [];

  const byName = new Map();

  for (const v of videos) {
    const name = (v.instructor_name || "").trim();
    if (!name) continue;
    if (!byName.has(name)) {
      byName.set(name, {
        name,
        photo: v.instructor_photo || "",
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

      return {
        name: entry.name,
        photo:
          entry.photo ||
          primary?.instructor_photo ||
          "",
        /** @type {keyof typeof POSITION_LABEL} */
        roleKey: topCat,
        label: POSITION_LABEL[topCat] || "Pro Instructor",
        credentialLine: credentialSnippet(primary?.instructor_bio || ""),
        primaryVideoId: primary?.id,
        courseCount: entry.videos.length,
      };
    })
    .sort((a, b) => b.courseCount - a.courseCount);
}
