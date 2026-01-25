import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Video } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Play,
  Star,
  Clock,
  Award,
  TrendingUp,
  Target,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import VideoCard from "../components/VideoCard";

export default function Home() {
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        // User not logged in
      }

      const videos = await Video.filter(
        { is_featured: true, is_active: true },
        "-created_date",
        6
      );
      setFeaturedVideos(videos);

      // Load category counts
      const allVideos = await Video.filter({ is_active: true });
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
          description: "Master dodging, shooting, and offensive strategies",
        },
        {
          name: "Defense",
          slug: "defense",
          icon: Shield,
          color: "from-blue-500 to-cyan-500",
          count: categoryCounts.defense,
          description: "Perfect your defensive positioning and techniques",
        },
        {
          name: "Faceoffs",
          slug: "faceoffs",
          icon: Zap,
          color: "from-purple-500 to-pink-500",
          count: categoryCounts.faceoffs,
          description: "Dominate the X with winning faceoff strategies",
        },
        {
          name: "Goalies",
          slug: "goalies",
          icon: Award,
          color: "from-green-500 to-emerald-500",
          count: categoryCounts.goalies,
          description: "Become an elite goalkeeper with pro techniques",
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
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur">
              <TrendingUp className="w-4 h-4" />
              Trusted by 10,000+ Players
            </div>

            <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-blue-100 to-cyan-400 bg-clip-text text-transparent mb-8">
              Master Lacrosse
              <br />
              <span className="text-4xl md:text-6xl">Like a Pro</span>
            </h1>

            <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto">
              Learn from elite professional players with our premium video
              training library. Elevate your game with techniques that win
              championships.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl("Videos")}>
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-8 py-4 text-lg font-semibold rounded-xl">
                  <Play className="w-5 h-5 mr-2" />
                  Start Training
                </Button>
              </Link>
              {!user && (
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-4 text-lg rounded-xl"
                  onClick={async () =>
                    await User.loginWithRedirect(window.location.origin)
                  }
                >
                  Sign Up Free
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Videos - MOVED UP */}
      {featuredVideos.length > 0 && (
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-4">Featured Training</h2>
                <p className="text-slate-400 text-lg">
                  Handpicked by our coaching staff
                </p>
              </div>
              <Link to={createPageUrl("Videos")}>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  View All Videos
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories - MOVED DOWN */}
      <section className="py-20 px-4 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Training Categories</h2>
            <p className="text-slate-400 text-lg">
              Master every aspect of the game
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={createPageUrl(`Videos?category=${category.slug}`)}
              >
                <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-all duration-300 group cursor-pointer h-full">
                  <CardContent className="p-8 text-center">
                    <div
                      className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-r ${category.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}
                    >
                      <category.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{category.name}</h3>
                    <p className="text-slate-400 mb-4">
                      {category.description}
                    </p>
                    <Badge className="bg-slate-700 text-slate-300">
                      {category.count} videos
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">500+</div>
              <div className="text-slate-400">Training Videos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">50+</div>
              <div className="text-slate-400">Pro Athletes</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">10K+</div>
              <div className="text-slate-400">Active Players</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">98%</div>
              <div className="text-slate-400">Success Rate</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
