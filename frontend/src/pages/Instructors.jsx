import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Video } from "@/api/entities";
import {
  aggregateInstructorsFromVideos,
  ATHLETE_FALLBACK_PHOTO,
} from "@/utils/instructors";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ROLE_FILTERS = [
  { key: "all", label: "All" },
  { key: "offense", label: "Attack" },
  { key: "defense", label: "Defense" },
  { key: "faceoffs", label: "Faceoff Specialist" },
  { key: "goalies", label: "Goalie" },
];

export default function Instructors() {
  const [instructors, setInstructors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return instructors.filter((person) => {
      if (roleFilter !== "all" && person.roleKey !== roleFilter) {
        return false;
      }
      if (!q) return true;
      return person.name.toLowerCase().includes(q);
    });
  }, [instructors, search, roleFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-2">
            Instructors
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Meet your coaches
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Every course is taught by an athlete who has competed at a serious
            level. Search by name or filter by position, then open their
            courses.
          </p>
        </div>

        {instructors.length > 0 && (
          <div className="flex flex-col gap-5 mb-10">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <Input
                type="search"
                placeholder="Search by instructor name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-slate-800/80 border-slate-600 text-slate-100 placeholder:text-slate-500 focus-visible:ring-cyan-500/40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {ROLE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setRoleFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    roleFilter === f.key
                      ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
                      : "bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {instructors.length === 0 ? (
          <p className="text-slate-400">
            No instructors available yet. Check back soon.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-sm">
            No instructors match your search. Try another name or clear filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filtered.map((person) => (
              <Card
                key={person.name}
                className="bg-slate-800/60 border-slate-700/80 overflow-hidden hover:border-cyan-500/20 hover:bg-slate-800/90 transition-all duration-300"
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <img
                    src={person.photo || ATHLETE_FALLBACK_PHOTO}
                    alt={person.name}
                    className="w-[5.25rem] h-[5.25rem] rounded-full object-cover ring-2 ring-slate-600 mb-4"
                  />
                  <h2 className="text-xl font-bold text-white mb-0.5">
                    {person.name}
                  </h2>
                  <p className="text-sm text-cyan-300/90 font-medium mb-2">
                    {person.roleHeadline}
                  </p>
                  {person.credentialLine ? (
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 max-w-sm leading-snug">
                      {person.credentialLine}
                    </p>
                  ) : (
                    <div className="mb-4 min-h-[1rem]" />
                  )}
                  <p className="text-xs text-slate-500 mb-5">
                    {person.courseCount}{" "}
                    {person.courseCount === 1 ? "course" : "courses"}{" "}
                    available
                  </p>
                  {person.primaryVideoId ? (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white font-semibold"
                    >
                      <Link
                        to={createPageUrl(
                          `VideoDetail?id=${person.primaryVideoId}`
                        )}
                        className="inline-flex items-center justify-center gap-2"
                      >
                        View Courses
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-slate-600 font-semibold"
                    >
                      <Link to={createPageUrl("Videos")}>Browse Courses</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            to={createPageUrl("Videos")}
            className="text-sm text-slate-400 hover:text-white inline-flex items-center gap-2 transition-colors"
          >
            Browse all courses
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
