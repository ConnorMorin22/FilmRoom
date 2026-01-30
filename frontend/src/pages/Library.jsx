import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Purchase } from "@/api/entities";
import { Video } from "@/api/entities";
import { User } from "@/api/entities";
import {
  Library as LibraryIcon,
  Play,
  Clock,
  Award,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Library() {
  const navigate = useNavigate();
  const [purchasedVideos, setPurchasedVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filterVideos = useCallback(() => {
    let filtered = [...purchasedVideos];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    setFilteredVideos(filtered);
  }, [purchasedVideos, selectedCategory]);

  const loadLibrary = useCallback(async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setPurchasedVideos(userData.purchasedVideos || []);
    } catch (error) {
      console.error("Failed to load library:", error);
      navigate(createPageUrl("Login"));
    }
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  useEffect(() => {
    filterVideos();
  }, [filterVideos]);

  const categories = [
    { value: "all", label: "All Videos" },
    { value: "offense", label: "Offense" },
    { value: "defense", label: "Defense" },
    { value: "faceoffs", label: "Faceoffs" },
    { value: "goalies", label: "Goalies" },
  ];

  const categoryColors = {
    offense: "bg-red-500/20 text-red-200",
    defense: "bg-blue-500/20 text-blue-200",
    faceoffs: "bg-purple-500/20 text-purple-200",
    goalies: "bg-green-500/20 text-green-200",
  };

  const watchVideo = (video) => {
    // In production, this would open the video player
    navigate(createPageUrl(`VideoDetail?id=${video._id}`));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <LibraryIcon className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-4xl font-bold">My Library</h1>
            <p className="text-slate-400">
              {purchasedVideos.length} purchased training videos
            </p>
          </div>
        </div>

        {purchasedVideos.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-16">
              <LibraryIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Your library is empty</h2>
              <p className="text-slate-400 mb-6">
                Purchase some training videos to start building your collection
              </p>
              <Button
                onClick={() => navigate(createPageUrl("Videos"))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Browse Videos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Filter */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <Filter className="w-4 h-4 text-slate-400" />
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat.value}
                        value={cat.value}
                        className="text-white hover:bg-slate-600"
                      >
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Videos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredVideos.map((video) => (
                <Card
                  key={video._id}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300 group overflow-hidden cursor-pointer"
                  onClick={() => watchVideo(video)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={
                        video.thumbnail_url ||
                        `https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop`
                      }
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />


                    <div className="absolute top-4 left-4">
                      <Badge className={categoryColors[video.category]}>
                        {video.category}
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{video.duration} min</span>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                      {video.title}
                    </h3>
                    <p className="text-slate-400 line-clamp-2 mb-4">
                      {video.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            video.instructor_photo ||
                            `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`
                          }
                          alt={video.instructor_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-white text-sm font-medium">
                            {video.instructor_name}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={(event) => {
                          event.stopPropagation();
                          watchVideo(video);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Watch
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
