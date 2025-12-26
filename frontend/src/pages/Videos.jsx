
import React, { useState, useEffect, useCallback } from "react";
import { Video } from "@/api/entities";
import { Search, Filter, SortDesc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import VideoCard from "../components/VideoCard";

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSkillLevel, setSelectedSkillLevel] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const filterAndSortVideos = useCallback(() => {
    let filtered = [...videos];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(video => video.category === selectedCategory);
    }

    // Skill level filter
    if (selectedSkillLevel !== "all") {
      filtered = filtered.filter(video => 
        video.skill_level === selectedSkillLevel || video.skill_level === "all"
      );
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case "price_low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "duration":
        filtered.sort((a, b) => a.duration - b.duration);
        break;
      default:
        break;
    }

    setFilteredVideos(filtered);
  }, [videos, searchTerm, selectedCategory, selectedSkillLevel, sortBy]);

  useEffect(() => {
    const loadAllVideos = async () => {
      const allVideos = await Video.filter({ is_active: true }, "-created_date");
      setVideos(allVideos);
      setIsLoading(false);
    };

    loadAllVideos();
    
    // Check URL params for initial filters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, []); // Empty dependency array as loadAllVideos is only called once.

  useEffect(() => {
    filterAndSortVideos();
  }, [filterAndSortVideos]);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "offense", label: "Offense" },
    { value: "defense", label: "Defense" },
    { value: "faceoffs", label: "Faceoffs" },
    { value: "goalies", label: "Goalies" }
  ];

  const skillLevels = [
    { value: "all", label: "All Levels" },
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" }
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "duration", label: "Duration: Short to Long" }
  ];

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
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Training Library</h1>
          <p className="text-slate-400 text-lg">
            {filteredVideos.length} professional training videos available
          </p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search videos, instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-slate-600">
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSkillLevel} onValueChange={setSelectedSkillLevel}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {skillLevels.map(level => (
                  <SelectItem key={level.value} value={level.value} className="text-white hover:bg-slate-600">
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                {sortOptions.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-white hover:bg-slate-600">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {selectedCategory !== "all" && (
              <Badge className="bg-blue-600 text-white">
                {categories.find(c => c.value === selectedCategory)?.label}
              </Badge>
            )}
            {selectedSkillLevel !== "all" && (
              <Badge className="bg-purple-600 text-white">
                {skillLevels.find(l => l.value === selectedSkillLevel)?.label}
              </Badge>
            )}
            {searchTerm && (
              <Badge className="bg-green-600 text-white">
                "{searchTerm}"
              </Badge>
            )}
          </div>
        </div>

        {/* Videos Grid */}
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎥</div>
            <h3 className="text-2xl font-bold mb-2">No videos found</h3>
            <p className="text-slate-400 mb-6">Try adjusting your search or filters</p>
            <Button 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedSkillLevel("all");
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
