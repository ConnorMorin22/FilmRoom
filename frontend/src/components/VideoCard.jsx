import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl, getDescriptionPreviewText } from "@/utils";
import {
  getInstructorRoleHeadline,
  getInstructorCredibilityLine,
} from "@/utils/instructors";
import { Play, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function VideoCard({
  video,
  showAddToCart = true,
  promoBadge = null,
}) {
  const navigate = useNavigate();
  const descriptionPreview = getDescriptionPreviewText(video.description);
  const roleHeadline = getInstructorRoleHeadline(
    video.category,
    video.instructor_bio
  );
  const instructorCred = getInstructorCredibilityLine(
    video.instructor_bio,
    roleHeadline
  );
  const categoryColors = {
    offense: "bg-red-500/20 text-red-200",
    defense: "bg-blue-500/20 text-blue-200",
    faceoffs: "bg-purple-500/20 text-purple-200",
    goalies: "bg-green-500/20 text-green-200",
  };

  const skillLevelColors = {
    beginner: "bg-green-500",
    intermediate: "bg-yellow-500",
    advanced: "bg-red-500",
    all: "bg-gray-500"
  };

  return (
    <Card
      className="bg-slate-800/95 border-slate-700/90 hover:border-slate-600 hover:bg-slate-800 transition-all duration-300 group overflow-hidden cursor-pointer shadow-lg shadow-black/20"
      onClick={() => navigate(createPageUrl(`VideoDetail?id=${video.id}`))}
    >
      <div className="relative aspect-video">
        <img
          src={video.thumbnail_url || `https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=400&fit=crop`}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute top-3 left-3">
          <Badge className={categoryColors[video.category]}>
            {video.category}
          </Badge>
        </div>

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {video.is_featured && (
            <Badge className="bg-amber-500/95 text-amber-950 border-0 font-semibold text-[10px] uppercase tracking-wider shadow-sm">
              Featured
            </Badge>
          )}
          {promoBadge === "popular" && !video.is_featured && (
            <Badge className="bg-violet-600/95 text-white border-0 font-semibold text-[10px] uppercase tracking-wider shadow-sm">
              Popular
            </Badge>
          )}
          {video.skill_level !== "all" && (
            <Badge
              className={`${skillLevelColors[video.skill_level]} text-white text-[10px] uppercase tracking-wide border-0 shadow-sm`}
            >
              {video.skill_level}
            </Badge>
          )}
        </div>

        <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white text-sm">
          <Clock className="w-4 h-4" />
          <span>{video.duration} min</span>
        </div>
      </div>

      <CardContent className="p-6 md:p-7">
        <div className="mb-4">
        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
          {video.title}
        </h3>
          <p className="text-slate-300/90 text-sm leading-relaxed line-clamp-2 mb-3">
            {descriptionPreview}
          </p>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <img
            src={video.instructor_photo || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`}
            alt={video.instructor_name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="text-white font-medium truncate">
              {video.instructor_name}
            </div>
            <div className="text-sm text-cyan-300/90 font-medium truncate">
              {roleHeadline}
            </div>
            {instructorCred ? (
              <div className="text-slate-500 text-xs mt-0.5 line-clamp-2 leading-snug">
                {instructorCred}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-white">
            ${video.price}
          </div>
          {showAddToCart && (
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={(event) => {
                event.stopPropagation();
                navigate(createPageUrl(`VideoDetail?id=${video.id}`));
              }}
            >
              View Courses
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}