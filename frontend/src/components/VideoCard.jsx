import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Play, Clock, Star, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function VideoCard({ video, showAddToCart = true }) {
  const categoryColors = {
    offense: "bg-red-100 text-red-800",
    defense: "bg-blue-100 text-blue-800", 
    faceoffs: "bg-purple-100 text-purple-800",
    goalies: "bg-green-100 text-green-800"
  };

  const skillLevelColors = {
    beginner: "bg-green-500",
    intermediate: "bg-yellow-500",
    advanced: "bg-red-500",
    all: "bg-gray-500"
  };

  return (
    <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-300 group overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={video.thumbnail_url || `https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop`}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <Link to={createPageUrl(`VideoDetail?id=${video.id}`)}>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        </Link>

        <div className="absolute top-4 left-4">
          <Badge className={categoryColors[video.category]}>
            {video.category}
          </Badge>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          {video.skill_level !== 'all' && (
            <Badge className={`${skillLevelColors[video.skill_level]} text-white`}>
              {video.skill_level}
            </Badge>
          )}
        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-sm">
          <Clock className="w-4 h-4" />
          <span>{video.duration} min</span>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="mb-4">
          <Link to={createPageUrl(`VideoDetail?id=${video.id}`)}>
            <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
              {video.title}
            </h3>
          </Link>
          <p className="text-slate-400 line-clamp-2 mb-3">{video.description}</p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <img
            src={video.instructor_photo || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`}
            alt={video.instructor_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="text-white font-medium">{video.instructor_name}</div>
            <div className="text-slate-400 text-sm flex items-center gap-1">
              <Award className="w-3 h-3" />
              Pro Athlete
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            ${video.price}
          </div>
          {showAddToCart && (
            <Link to={createPageUrl(`VideoDetail?id=${video.id}`)}>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                View Details
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}