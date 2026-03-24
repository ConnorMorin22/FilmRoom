import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Video } from "@/api/entities";
import {
  Play,
  Award,
  Target,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  Users,
  Infinity as InfinityIcon,
  ListOrdered,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-lacrosse.png";

import VideoCard from "../components/VideoCard";
import {
  aggregateInstructorsFromVideos,
  ATHLETE_FALLBACK_PHOTO,
} from "@/utils/instructors";

export default function Home() {
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allVideos = await Video.filter({ is_active: true });

      const featured = allVideos
        .filter((v) => v.is_featured)
        .sort(
          (a, b) =>
            new Date(b.created_date || 0) - new Date(a.created_date || 0)
        );
      const rest = allVideos
        .filter((v) => !v.is_featured)
        .sort(
          (a, b) =>
            new Date(b.created_date || 0) - new Date(a.created_date || 0)
        );
      setFeaturedVideos([...featured, ...rest].slice(0, 6));

      setAthletes(aggregateInstructorsFromVideos(allVideos).slice(0, 12));

      const categoryCounts = {
        offense: allVideos.filter((v) => v.category === "offense").length,
        defense: allVideos.filter((v) => v.category === "defense").length,
        faceoffs: allVideos.filter((v) => v.category === "faceoffs").length,
        goalies: allVideos.filter((v) => v.category === "goalies").length,
      };

      setCategories([
        {
          name: "Offense",
          slug: "offense",
          icon: Target,
          color: "from-red-500 to-orange-500",
          count: categoryCounts.offense,
          description:
            "Create separation, finish in tight windows, and read slides.",
        },
        {
          name: "Defense",
          slug: "defense",
          icon: Shield,
          color: "from-blue-500 to-cyan-500",
          count: categoryCounts.defense,
          description:
            "Track hands, time doubles, and stay between your man and the goal.",
        },
        {
          name: "Faceoffs",
          slug: "faceoffs",
          icon: Zap,
          color: "from-purple-500 to-pink-500",
          count: categoryCounts.faceoffs,
          description:
            "Win clamps, exit clean, and turn draws into real possessions.",
        },
        {
          name: "Goalies",
          slug: "goalies",
          icon: Award,
          color: "from-green-500 to-emerald-500",
          count: categoryCounts.goalies,
          description:
            "Hold angles, move on time, and spark transition with your clears.",
        },
      ]);

    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  let popularSlots = 2;

  return (
    <div className="bg-slate-900 text-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 py-20 md:py-24 px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.12]"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/40" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/5 text-slate-300 px-3 py-1.5 rounded-full text-[11px] font-medium tracking-wide mb-7 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400/90" />
              Elite instruction · athlete-led
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-black tracking-tight text-white mb-5 leading-[1.12]">
              <span className="block">Train Like the Pros.</span>
              <span className="block text-slate-100">Learn From the Pros.</span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 mb-10 leading-relaxed">
              Learn the exact techniques used by NCAA All-Americans and PLL
              pros.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto">
              <Link to={createPageUrl("Videos")} className="sm:w-auto w-full">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-cyan-500/10">
                  <Play className="w-5 h-5 mr-2" />
                  Browse Courses
                </Button>
              </Link>
              <Link to={createPageUrl("Instructors")} className="sm:w-auto w-full">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-slate-600 text-slate-100 hover:bg-slate-800/80 hover:text-white px-8 py-6 text-base rounded-xl bg-slate-950/30 backdrop-blur"
                >
                  Meet the Instructors
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured athletes */}
      {athletes.length > 0 && (
        <section className="py-12 md:py-16 px-4 border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-2">
                Instructors
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Featured athletes
              </h2>
              <p className="text-slate-400 mt-2 max-w-xl text-sm md:text-base">
                See who teaches each program—then open their courses.
              </p>
            </div>
            <Link
              to={createPageUrl("Instructors")}
              className="text-sm font-medium text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 shrink-0"
            >
              All instructors
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="flex gap-5 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] athlete-scroll px-0.5">
              {athletes.map((person) => (
                <Card
                  key={person.name}
                  className="flex-shrink-0 w-[252px] sm:w-[268px] snap-start bg-slate-800/50 border-slate-700/70 hover:border-cyan-500/25 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-black/40 transition-all duration-300 group/card"
                >
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="relative mb-4">
                      <img
                        src={person.photo || ATHLETE_FALLBACK_PHOTO}
                        alt={person.name}
                        className="w-[4.5rem] h-[4.5rem] rounded-full object-cover ring-2 ring-slate-600 group-hover/card:ring-cyan-500/35 transition-all duration-300"
                      />
                    </div>
                    <h3 className="font-bold text-white text-lg leading-tight mb-0.5">
                      {person.name}
                    </h3>
                    <p className="text-sm text-cyan-300/90 font-medium mb-3">
                      {person.roleHeadline}
                    </p>
                    <p className="text-xs text-slate-400 leading-snug line-clamp-2 min-h-[2.25rem] mb-5 w-full">
                      {person.credentialLine || "\u00a0"}
                    </p>
                    {person.primaryVideoId ? (
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full bg-slate-700/70 hover:bg-slate-600 text-white border-0 font-semibold"
                      >
                        <Link
                          to={createPageUrl(
                            `VideoDetail?id=${person.primaryVideoId}`
                          )}
                          className="inline-flex items-center justify-center gap-2"
                        >
                          View Courses
                          <ArrowRight className="w-4 h-4 opacity-80" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="secondary" className="w-full font-semibold">
                        <Link to={createPageUrl("Videos")}>Browse Courses</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <style>{`
            .athlete-scroll {
              scrollbar-width: thin;
              scrollbar-color: rgb(51 65 85) transparent;
            }
            .athlete-scroll::-webkit-scrollbar {
              height: 6px;
            }
            .athlete-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .athlete-scroll::-webkit-scrollbar-thumb {
              background: rgb(51 65 85);
              border-radius: 999px;
            }
          `}</style>
        </section>
      )}

      {/* Featured courses */}
      {featuredVideos.length > 0 && (
        <section className="py-16 md:py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-2">
                  Courses
                </p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Featured Courses
                </h2>
              </div>
              <Link to={createPageUrl("Videos")} className="shrink-0">
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-200 hover:bg-slate-800"
                >
                  View all courses
                </Button>
              </Link>
            </div>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-3xl mb-10">
              Walk away with possession habits, clearing patterns, and finishing
              mechanics—the on-field details elite players repeat all season.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8">
              {featuredVideos.map((video) => {
                const showPopular =
                  !video.is_featured && popularSlots > 0;
                if (showPopular) popularSlots -= 1;
                return (
                  <VideoCard
                    key={video.id}
                    video={video}
                    promoBadge={showPopular ? "popular" : null}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Train by position */}
      <section className="py-16 md:py-20 px-4 bg-slate-800/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-2">
              Your game
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Train by position
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              Jump straight into film that matches how you play.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={createPageUrl(`Videos?category=${category.slug}`)}
                className="block group"
              >
                <Card className="bg-slate-800/90 border-slate-700/80 hover:border-slate-500 transition-all duration-300 h-full shadow-md shadow-black/15">
                  <CardContent className="p-7 text-center">
                    <div
                      className={`w-14 h-14 mx-auto mb-5 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg`}
                    >
                      <category.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {category.name}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                      {category.description}
                    </p>
                    <Badge
                      variant="secondary"
                      className="bg-slate-800 text-slate-300 border border-slate-600/70 font-medium"
                    >
                      {category.count}{" "}
                      {category.count === 1 ? "course" : "courses"}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why FilmRoom */}
      <section className="py-14 md:py-16 px-4 pb-16 md:pb-20 border-t border-slate-800/80 bg-slate-950/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-2">
              Why FilmRoom
            </p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Built for players who train with intent
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5">
            {[
              {
                title: "Learn from elite players",
                body: "On-field cues and progressions from athletes who’ve competed at the highest level—not generic tips.",
                icon: Users,
              },
              {
                title: "One-time purchase, lifetime access",
                body: "Own each course for good. Rewatch before season, in the film room, or whenever you need a reset.",
                icon: InfinityIcon,
              },
              {
                title: "Structured courses, not random clips",
                body: "Full programs organized like a practice plan so you know what to work on next.",
                icon: ListOrdered,
              },
            ].map((tile) => (
              <div
                key={tile.title}
                className="rounded-2xl border border-slate-700/70 bg-slate-900/50 p-6 text-center md:text-left"
              >
                <div className="w-10 h-10 mx-auto md:mx-0 mb-4 rounded-lg bg-cyan-500/10 text-cyan-300 flex items-center justify-center">
                  <tile.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white text-base mb-2 leading-snug">
                  {tile.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {tile.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
