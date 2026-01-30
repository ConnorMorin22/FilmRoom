
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Video } from "@/api/entities";
import { CartItem } from "@/api/entities";
import { User } from "@/api/entities";
import { API_URL } from "@/api/customClient";
import { 
  Play, 
  Clock, 
  Award, 
  ShoppingCart, 
  CheckCircle, 
  ArrowLeft,
  Star,
  Users,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function VideoDetail() {
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [videoId, setVideoId] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [isStreamLoading, setIsStreamLoading] = useState(false);

  const loadVideoDetail = useCallback(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("id");
    setVideoId(videoId);
    
    if (!videoId) {
      navigate(createPageUrl("Videos"));
      return;
    }

    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const purchasedVideos = currentUser.purchasedVideos || [];
      setHasPurchased(purchasedVideos.some((v) => v._id === videoId));

      // Check if in cart
      const cartItems = await CartItem.filter({ 
        user_email: currentUser.email, 
        video_id: videoId 
      });
      setIsInCart(cartItems.length > 0);
    } catch (error) {
      // User not logged in, error can be ignored or logged
      console.warn("User not logged in or failed to load user:", error);
    }

    const videoData = await Video.filter({ id: videoId, is_active: true });
    if (videoData.length === 0) {
      navigate(createPageUrl("Videos"));
      return;
    }

    setVideo(videoData[0]);
    setIsLoading(false);
  }, [navigate]); // navigate is a stable dependency from useNavigate hook

  useEffect(() => {
    loadVideoDetail();
  }, [loadVideoDetail]); // loadVideoDetail is now memoized by useCallback

  useEffect(() => {
    const loadStreamUrl = async () => {
      if (!hasPurchased || !videoId) return;
      setIsStreamLoading(true);
      try {
        const response = await fetch(`${API_URL}/videos/${videoId}/stream`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Failed to load stream URL");
        }
        const data = await response.json();
        setStreamUrl(data.streamUrl);
      } catch (error) {
        console.error("Stream URL error:", error);
      } finally {
        setIsStreamLoading(false);
      }
    };

    loadStreamUrl();
  }, [hasPurchased, videoId]);

  const handleAddToCart = async () => {
    if (!user) {
      // If user is not logged in, redirect to login and then back to this page
      await User.loginWithRedirect(window.location.href);
      return;
    }

    setIsAddingToCart(true);
    try {
      await CartItem.create({
        user_email: user.email,
        video_id: video.id
      });
      setIsInCart(true);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
    setIsAddingToCart(false);
  };

  const categoryColors = {
    offense: "bg-red-500/20 text-red-200",
    defense: "bg-blue-500/20 text-blue-200",
    faceoffs: "bg-purple-500/20 text-purple-200",
    goalies: "bg-green-500/20 text-green-200"
  };

  const skillLevelColors = {
    beginner: "bg-green-500",
    intermediate: "bg-yellow-500", 
    advanced: "bg-red-500",
    all: "bg-gray-500"
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="bg-slate-900 text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Video Not Found</h1>
          <Button onClick={() => navigate(createPageUrl("Videos"))}>
            Back to Videos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Videos"))}
          className="mb-6 text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Videos
        </Button>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <div className="relative aspect-video">
                {hasPurchased ? (
                  <div className="w-full h-full bg-black flex items-center justify-center">
                    {isStreamLoading ? (
                      <div className="text-center">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">
                          Loading stream...
                        </p>
                      </div>
                    ) : streamUrl ? (
                      <video
                        className="w-full h-full"
                        src={streamUrl}
                        controls
                        playsInline
                      />
                    ) : (
                      <div className="text-center">
                        <Play className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm">
                          Stream unavailable
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <img
                      src={video.thumbnail_url || `https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-blue-500/80 backdrop-blur rounded-full flex items-center justify-center mb-4">
                          <Play className="w-10 h-10 text-white ml-1" />
                        </div>
                        <p className="text-white font-medium">Preview Available</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Video Details */}
            <div className="mt-8">
              <div className="flex flex-wrap gap-3 mb-4">
                <Badge className={categoryColors[video.category]}>
                  {video.category}
                </Badge>
                {video.skill_level !== 'all' && (
                  <Badge className={`${skillLevelColors[video.skill_level]} text-white`}>
                    {video.skill_level}
                  </Badge>
                )}
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  <Clock className="w-3 h-3 mr-1" />
                  {video.duration} minutes
                </Badge>
              </div>

              <h1 className="text-4xl font-bold mb-4">{video.title}</h1>
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                {video.description}
              </p>

              {/* Tags */}
              {video.tags && video.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-3">What You'll Learn</h3>
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="border-slate-600 text-slate-400">
                        <Target className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-2xl text-white">
                  ${video.price}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasPurchased ? (
                  <div className="text-center py-4">
                    <Button
                      onClick={() => navigate(createPageUrl("Library"))}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Go to Library
                    </Button>
                  </div>
                ) : (
                  <>
                    {!user ? (
                      <Button 
                        onClick={handleAddToCart}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Sign In to Purchase
                      </Button>
                    ) : isInCart ? (
                      <div>
                        <Button 
                          onClick={() => navigate(createPageUrl("Cart"))}
                          className="w-full bg-green-600 hover:bg-green-700 mb-3"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          In Cart - Checkout
                        </Button>
                        <p className="text-slate-400 text-sm text-center">
                          Item added to your cart
                        </p>
                      </div>
                    ) : (
                      <Button 
                        onClick={handleAddToCart}
                        disabled={isAddingToCart}
                        className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        {isAddingToCart ? "Adding..." : "Add to Cart"}
                      </Button>
                    )}
                  </>
                )}

                <div className="space-y-3 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Lifetime access
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    HD video quality
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Mobile & desktop access
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructor Card */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Your Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={video.instructor_photo || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`}
                    alt={video.instructor_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-white">{video.instructor_name}</h3>
                    <div className="flex items-center gap-1 text-slate-400">
                      <Award className="w-4 h-4" />
                      <span>Professional Athlete</span>
                    </div>
                  </div>
                </div>
                {video.instructor_bio && (
                  <p className="text-slate-300 text-sm mb-4">
                    {video.instructor_bio}
                  </p>
                )}
                {Array.isArray(video.instructor_socials) &&
                  video.instructor_socials.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white">
                        Connect
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {video.instructor_socials.map((social) => (
                          <a
                            key={`${social.platform}-${social.url}`}
                            href={social.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-slate-300 hover:text-white underline underline-offset-4"
                          >
                            {social.platform}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Video Stats */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">{video.duration}</div>
                    <div className="text-slate-400 text-sm">Minutes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">4.9</div>
                    <div className="text-slate-400 text-sm flex items-center justify-center gap-1">
                      <Star className="w-3 h-3" />
                      Rating
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
