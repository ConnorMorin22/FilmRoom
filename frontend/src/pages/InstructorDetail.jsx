import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Instructor, Video } from "@/api/entities";
import VideoCard from "@/components/VideoCard";
import {
  aggregateInstructorsFromVideos,
  ATHLETE_FALLBACK_PHOTO,
  buildStructuredCredibilityLine,
  resolveInstructorForVideo,
} from "@/utils/instructors";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstructorDetail() {
  const { slug } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [instructor, setInstructor] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const activeVideos = await Video.filter({ is_active: true });
        const allInstructors = aggregateInstructorsFromVideos(activeVideos);
        const bySlug = allInstructors.find((p) => p.slug === slug);

        let instructorEntity = null;
        try {
          instructorEntity = await Instructor.getBySlug(slug);
        } catch {
          // Keep fallback to video-derived aggregation.
        }

        const scopedVideos = activeVideos.filter((video) => {
          const resolved = resolveInstructorForVideo(video);
          return resolved.slug === slug;
        });

        if (!cancelled) {
          setVideos(scopedVideos);
          setInstructor(
            instructorEntity || {
              name: bySlug?.name || "Instructor",
              slug,
              photo_url: bySlug?.photo || ATHLETE_FALLBACK_PHOTO,
              headline: bySlug?.roleHeadline || "",
              bio: bySlug?.credentialLine || "",
              position: "",
              credential_line: bySlug?.credentialLine || "",
              school: "",
              pro_team: "",
            }
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const credibilityLine = useMemo(() => {
    if (!instructor) return "";
    return (
      instructor.headline ||
      buildStructuredCredibilityLine({
        position: instructor.position,
        school: instructor.school,
        pro_team: instructor.pro_team,
        honors: instructor.honors,
      }) ||
      instructor.credential_line ||
      ""
    );
  }, [instructor]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="bg-slate-900 text-white min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <p className="text-slate-400 mb-5">Instructor not found.</p>
          <Link to={createPageUrl("Instructors")} className="text-cyan-400 hover:text-cyan-300">
            Back to Instructors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
        <Link
          to={createPageUrl("Instructors")}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          All Instructors
        </Link>

        <section className="rounded-2xl border border-slate-700/80 bg-slate-800/50 p-6 md:p-8 mb-10">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <img
              src={instructor.photo_url || ATHLETE_FALLBACK_PHOTO}
              alt={instructor.name}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover ring-2 ring-slate-600"
            />
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{instructor.name}</h1>
              {credibilityLine ? (
                <p className="text-cyan-300/90 font-medium mb-2">{credibilityLine}</p>
              ) : null}
              {instructor.bio ? (
                <p className="text-slate-300 leading-relaxed max-w-3xl">{instructor.bio}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Courses by {instructor.name}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                {videos.length} {videos.length === 1 ? "Course" : "Courses"} Available
              </p>
            </div>
            <Button asChild variant="outline" className="border-slate-600 text-slate-200">
              <Link to={createPageUrl("Videos")}>Browse All Courses</Link>
            </Button>
          </div>

          {videos.length === 0 ? (
            <p className="text-slate-400">No active courses for this instructor yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

