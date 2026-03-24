import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Video } from "@/api/entities";
import { User } from "@/api/entities";
import { Review } from "@/api/customClient";
import {
  Play,
  Award,
  Target,
  Shield,
  Zap,
  ArrowRight,
  Sparkles,
  ListChecks,
  Infinity,
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
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [topReviews, setTopReviews] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch {
        // guest
      }

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
          description: "Dodging, finishing, and IQ on that end",
        },
        {
          name: "Defense",
          slug: "defense",
          icon: Shield,
          color: "from-blue-500 to-cyan-500",
          count: categoryCounts.defense,
          description: "Footwork, slides, and matchup play",
        },
        {
          name: "Faceoffs",
          slug: "faceoffs",
          icon: Zap,
          color: "from-purple-500 to-pink-500",
          count: categoryCounts.faceoffs,
          description: "Clamp speed, counters, and wing play",
        },
        {
          name: "Goalies",
          slug: "goalies",
          icon: Award,
          color: "from-green-500 to-emerald-500",
          count: categoryCounts.goalies,
          description: "Angles, clears, and save mechanics",
        },
      ]);

      try {
        const reviews = await Review.top(8);
        setTopReviews(reviews);
      } catch (error) {
        console.error("Failed to load reviews:", error);
      }
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
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 py-20 md:py-28 px-4 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.12]"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/40" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-300/95 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-widest mb-8 border border-cyan-500/20 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Elite-level instruction
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent mb-6 leading-[1.08]">
              Train with pro lacrosse players
            </h1>

            <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Learn the exact techniques used by NCAA All-Americans and PLL
              pros—broken down so you can rep them on the field.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to={createPageUrl("Videos")}>
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-8 py-6 text-base font-semibold rounded-xl shadow-lg shadow-cyan-500/10">
                  <Play className="w-5 h-5 mr-2" />
                  Browse courses
                </Button>
              </Link>
              {!user && (
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 py-6 text-base rounded-xl bg-slate-900/40 backdrop-blur"
                  onClick={async () =>
                    await User.loginWithRedirect(window.location.origin)
                  }
                >
                  Sign up free
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured athletes */}
      {athletes.length > 0 && (
        <section className="py-14 md:py-20 px-4 border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-2">
                Instructors
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Featured athletes
              </h2>
              <p className="text-slate-400 mt-2 max-w-xl">
                Real reps from players who’ve competed at the top—tap in to see
                their full training.
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
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin [-webkit-overflow-scrolling:touch] athlete-scroll">
              {athletes.map((person) => (
                <Card
                  key={person.name}
                  className="flex-shrink-0 w-[260px] sm:w-[280px] snap-start bg-slate-800/60 border-slate-700/80 hover:border-slate-600 transition-colors shadow-lg shadow-black/20"
                >
                  <CardContent className="p-5 flex flex-col items-stretch">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={person.photo || ATHLETE_FALLBACK_PHOTO}
                        alt={person.name}
                        className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-600"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-white truncate">
                          {person.name}
                        </h3>
                        <p className="text-sm text-cyan-300/90 font-medium">
                          {person.label}
                        </p>
                      </div>
                    </div>
                    {person.credentialLine ? (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 min-h-[2.5rem]">
                        {person.credentialLine}
                      </p>
                    ) : (
                      <div className="mb-4 min-h-[2.5rem]" />
                    )}
                    {person.primaryVideoId ? (
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full bg-slate-700/80 hover:bg-slate-600 text-white border-0"
                      >
                        <Link
                          to={createPageUrl(
                            `VideoDetail?id=${person.primaryVideoId}`
                          )}
                          className="inline-flex items-center justify-center gap-2"
                        >
                          View training
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="secondary" className="w-full">
                        <Link to={createPageUrl("Videos")}>Browse videos</Link>
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

      {/* Featured training */}
      {featuredVideos.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-2">
                  Programs
                </p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  Featured training
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Deep-dive courses you can own for life—structured like a real
                  practice plan.
                </p>
              </div>
              <Link to={createPageUrl("Videos")}>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-200 hover:bg-slate-800 shrink-0"
                >
                  View all courses
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
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
      <section className="py-20 px-4 bg-slate-800/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-2">
              Your game
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Train by position
            </h2>
            <p className="text-slate-400 text-lg">
              Jump straight into the film that matches how you play.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={createPageUrl(`Videos?category=${category.slug}`)}
                className="block group"
              >
                <Card className="bg-slate-800/90 border-slate-700/80 hover:border-slate-500 transition-all duration-300 h-full shadow-md shadow-black/15">
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg`}
                    >
                      <category.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {category.name}
                    </h3>
                    <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                      {category.description}
                    </p>
                    <Badge
                      variant="secondary"
                      className="bg-slate-700/80 text-slate-300 border-0"
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

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              How it works
            </h2>
            <p className="text-slate-400">
              Three steps. No fluff—just better lacrosse.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {[
              {
                step: "1",
                title: "Choose your position",
                body: "Start where you impact the game most—O, D, the X, or the cage.",
                icon: ListChecks,
              },
              {
                step: "2",
                title: "Learn from elite players",
                body: "Follow progressions and cues from athletes who’ve played at a serious level.",
                icon: Award,
              },
              {
                step: "3",
                title: "Apply it in-game",
                body: "Rep the same reads and mechanics so they show up when it counts.",
                icon: Target,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-700/80 bg-slate-800/40 p-8 text-center"
              >
                <div className="w-12 h-12 mx-auto mb-5 rounded-xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Step {item.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust (replaces fake metrics) */}
      <section className="py-16 px-4 border-t border-slate-800/80 bg-slate-950/50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div>
            <div className="w-11 h-11 mx-auto mb-4 rounded-full bg-blue-500/15 flex items-center justify-center">
              <Award className="w-5 h-5 text-cyan-300" />
            </div>
            <h3 className="font-semibold text-white mb-2">
              Elite-level instruction
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Curated teaching from players who’ve trained and competed at the
              highest levels of the sport.
            </p>
          </div>
          <div>
            <div className="w-11 h-11 mx-auto mb-4 rounded-full bg-blue-500/15 flex items-center justify-center">
              <Target className="w-5 h-5 text-cyan-300" />
            </div>
            <h3 className="font-semibold text-white mb-2">
              Built for serious players
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              No gimmicks—just clear breakdowns and reps you can use in practice
              and games.
            </p>
          </div>
          <div>
            <div className="w-11 h-11 mx-auto mb-4 rounded-full bg-blue-500/15 flex items-center justify-center">
              <Infinity className="w-5 h-5 text-cyan-300" />
            </div>
            <h3 className="font-semibold text-white mb-2">Lifetime access</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Own the courses you buy. Rewatch anytime you want a refresher
              before the season.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews */}
      {topReviews.length > 0 && (
        <section className="py-16 px-4 pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400/90 mb-2">
                  Social proof
                </p>
                <h2 className="text-3xl font-bold text-white">
                  What players say
                </h2>
              </div>
            </div>
            <div className="overflow-hidden">
              <div className="review-marquee">
                {[...topReviews, ...topReviews].map((review, index) => (
                  <div
                    key={`${review.id || review.created_date}-${index}`}
                    className="review-card"
                  >
                    <div className="text-slate-300 text-sm mb-2">
                      {"★".repeat(review.rating).padEnd(5, "☆")}
                    </div>
                    <div className="text-white font-semibold mb-1">
                      {review.title}
                    </div>
                    <div className="text-slate-300 text-sm line-clamp-3 mb-3">
                      {review.body}
                    </div>
                    <div className="text-slate-400 text-xs">
                      {review.user_name}
                      {review.video_title ? ` · ${review.video_title}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <style>{`
            .review-marquee {
              display: flex;
              gap: 24px;
              width: max-content;
              animation: review-scroll 45s linear infinite;
            }
            .review-marquee:hover {
              animation-play-state: paused;
            }
            .review-card {
              background: rgba(30, 41, 59, 0.7);
              border: 1px solid rgba(71, 85, 105, 0.6);
              border-radius: 16px;
              padding: 20px;
              width: 320px;
              flex: 0 0 auto;
              backdrop-filter: blur(8px);
            }
            @keyframes review-scroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </section>
      )}
    </div>
  );
}
