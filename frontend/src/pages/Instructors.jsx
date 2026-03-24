import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Video } from "@/api/entities";
import {
  aggregateInstructorsFromVideos,
  ATHLETE_FALLBACK_PHOTO,
} from "@/utils/instructors";
import { Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const videos = await Video.filter({ is_active: true });
        if (!cancelled) {
          setInstructors(aggregateInstructorsFromVideos(videos));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
        <div className="max-w-2xl mb-12 md:mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-3">
            Instructors
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Train with elite players
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Every course is taught by athletes who have competed at a serious level. Choose
            a coach and dive into their full programs on the course page.
          </p>
        </div>

        {instructors.length === 0 ? (
          <p className="text-slate-400">No instructors available yet. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {instructors.map((person) => (
              <Card
                key={person.name}
                className="bg-slate-800/80 border-slate-700/80 overflow-hidden hover:border-slate-600 transition-colors"
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <img
                    src={person.photo || ATHLETE_FALLBACK_PHOTO}
                    alt={person.name}
                    className="w-24 h-24 rounded-full object-cover ring-2 ring-slate-600 mb-4"
                  />
                  <h2 className="text-xl font-bold text-white mb-1">{person.name}</h2>
                  <p className="text-sm text-cyan-300/90 font-medium mb-1">{person.label}</p>
                  {person.credentialLine ? (
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2 max-w-sm mx-auto">
                      {person.credentialLine}
                    </p>
                  ) : null}
                  <p className="text-xs text-slate-500 mb-6">
                    {person.courseCount}{" "}
                    {person.courseCount === 1 ? "program" : "programs"} on FilmRoom
                  </p>
                  {person.primaryVideoId ? (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
                    >
                      <Link
                        to={createPageUrl(`VideoDetail?id=${person.primaryVideoId}`)}
                        className="inline-flex items-center justify-center gap-2"
                      >
                        View training
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full border-slate-600">
                      <Link to={createPageUrl("Videos")}>Browse videos</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-14 flex justify-center">
          <Link
            to={createPageUrl("Videos")}
            className="text-sm text-slate-400 hover:text-white inline-flex items-center gap-2 transition-colors"
          >
            <Award className="w-4 h-4" />
            Browse all training
          </Link>
        </div>
      </div>
    </div>
  );
}
