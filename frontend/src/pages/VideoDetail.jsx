
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { createPageUrl, getDescriptionPreviewText } from "@/utils";
import { Video } from "@/api/entities";
import { Review } from "@/api/customClient";
import { CartItem } from "@/api/entities";
import { User } from "@/api/entities";
import { API_URL, TOKEN_KEY } from "@/api/customClient";
import {
  Play,
  Clock,
  Award,
  ShoppingCart,
  CheckCircle,
  ArrowLeft,
  Star,
  Instagram,
  Twitter,
  Youtube,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    body: "",
  });
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playerRef = useRef(null);
  const chapterRowRefs = useRef([]);

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
    try {
      const reviewData = await Review.listForVideo(videoId);
      setReviews(reviewData);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    }
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
        const token = localStorage.getItem(TOKEN_KEY);
        const response = await fetch(`${API_URL}/videos/${videoId}/stream`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setReviewError("");
    setIsSubmittingReview(true);
    try {
      const review = await Review.create(videoId, {
        rating: Number(reviewForm.rating),
        title: reviewForm.title.trim(),
        body: reviewForm.body.trim(),
      });
      setReviews((prev) => [review, ...prev]);
      setReviewForm({ rating: 5, title: "", body: "" });
    } catch (error) {
      setReviewError(
        error.response?.data?.error ||
          "Failed to submit review. Please try again."
      );
    } finally {
      setIsSubmittingReview(false);
    }
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

  const descriptionText = useMemo(() => {
    if (typeof video?.description === "string") {
      return video.description.trim();
    }
    return "";
  }, [video?.description]);

  const markdownDescription = useMemo(() => {
    if (!descriptionText) return "";

    const sectionHeadingPattern =
      /^(what you['’]ll learn|built for|my quick read)$/i;

    const lines = descriptionText.split("\n");
    const normalized = lines.map((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return "";
      }

      // Support bullet characters copied from rich text sources.
      if (/^[•●▪◦]\s+/.test(trimmed)) {
        return `- ${trimmed.replace(/^[•●▪◦]\s+/, "")}`;
      }

      if (sectionHeadingPattern.test(trimmed)) {
        return `### ${trimmed}`;
      }

      return line;
    });

    return normalized.join("\n");
  }, [descriptionText]);

  const courseHook = useMemo(() => {
    const preview = getDescriptionPreviewText(descriptionText);
    if (!preview) return "Structured training built to accelerate your game.";

    const firstSentence = preview.match(/.*?[.!?](\s|$)/)?.[0]?.trim();
    return firstSentence || preview;
  }, [descriptionText]);

  const shouldShowDescriptionToggle = useMemo(() => {
    if (!descriptionText) return false;

    const lines = descriptionText.split("\n").length;
    const hasListFormatting = /(^|\n)\s*[-*]\s+/.test(descriptionText);

    // Keep the toggle simple: show it for visibly long or structured descriptions.
    return descriptionText.length > 280 || lines > 5 || hasListFormatting;
  }, [descriptionText]);

  const chapterList = useMemo(() => {
    if (!Array.isArray(video?.timestamps)) return [];
    return video.timestamps
      .map((chapter) => ({
        title: (chapter?.title || "").trim(),
        time: Number(chapter?.time),
      }))
      .filter((chapter) => chapter.title && Number.isFinite(chapter.time) && chapter.time >= 0)
      .sort((a, b) => a.time - b.time);
  }, [video?.timestamps]);

  const formatChapterTime = (seconds) => {
    const total = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const seekToChapter = (time) => {
    if (!playerRef.current || !Number.isFinite(time)) return;
    playerRef.current.currentTime = time;
    setPlaybackTime(time);
    playerRef.current.play().catch(() => {
      // Ignore autoplay errors and still move user to position.
    });
  };

  const activeChapterIndex = useMemo(() => {
    if (!chapterList.length) return -1;
    let idx = -1;
    for (let i = 0; i < chapterList.length; i++) {
      if (chapterList[i].time <= playbackTime) idx = i;
      else break;
    }
    return idx;
  }, [chapterList, playbackTime]);

  useEffect(() => {
    chapterRowRefs.current = chapterRowRefs.current.slice(0, chapterList.length);
  }, [chapterList.length]);

  useEffect(() => {
    if (activeChapterIndex < 0) return;
    const el = chapterRowRefs.current[activeChapterIndex];
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeChapterIndex]);

  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [video?.id]);

  useEffect(() => {
    setPlaybackTime(0);
  }, [streamUrl]);

  const renderDescriptionBlock = (compact = false) => (
    <div className={compact ? "mb-6" : "mb-10"}>
      <div
        className={`relative overflow-hidden transition-all duration-300 ${
          !isDescriptionExpanded && shouldShowDescriptionToggle
            ? compact
              ? "max-h-[8.5rem]"
              : "max-h-[13rem]"
            : "max-h-[120rem]"
        }`}
      >
        <ReactMarkdown
          className="prose prose-slate prose-invert max-w-none text-slate-200"
          components={{
            h2: ({ ...props }) => (
              <h2
                className="mt-8 mb-3 text-2xl font-bold tracking-tight text-white"
                {...props}
              />
            ),
            h3: ({ ...props }) => (
              <h3
                className="mt-7 mb-2 text-xl font-semibold tracking-tight text-white"
                {...props}
              />
            ),
            p: ({ ...props }) => (
              <p className="my-4 text-base leading-7 text-slate-200" {...props} />
            ),
            ul: ({ ...props }) => (
              <ul className="my-4 list-disc pl-6 text-slate-200" {...props} />
            ),
            ol: ({ ...props }) => (
              <ol className="my-4 list-decimal pl-6 text-slate-200" {...props} />
            ),
            li: ({ ...props }) => (
              <li className="my-1 pl-1 leading-7 marker:text-slate-300" {...props} />
            ),
            strong: ({ ...props }) => (
              <strong className="font-semibold text-white" {...props} />
            ),
          }}
        >
          {markdownDescription || "No description available."}
        </ReactMarkdown>

        {!isDescriptionExpanded && shouldShowDescriptionToggle && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-900 to-transparent" />
        )}
      </div>

      {shouldShowDescriptionToggle && (
        <Button
          variant="ghost"
          onClick={() => setIsDescriptionExpanded((prev) => !prev)}
          className="mt-3 px-0 text-blue-300 hover:text-blue-200 hover:bg-transparent"
        >
          {isDescriptionExpanded ? "Show Less" : "Show More"}
        </Button>
      )}
    </div>
  );

  const renderInstructorCard = () => (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-xl">Your Instructor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <img
            src={
              video.instructor_photo ||
              `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`
            }
            alt={video.instructor_name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-2xl font-bold text-white">{video.instructor_name}</h3>
            <div className="flex items-center gap-1 text-slate-400">
              <Award className="w-4 h-4" />
              <span className="text-slate-300">Professional Athlete</span>
            </div>
          </div>
        </div>
        {video.instructor_bio && (
          <p className="text-slate-300 text-sm mb-4">{video.instructor_bio}</p>
        )}
        {Array.isArray(video.instructor_socials) &&
          video.instructor_socials.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Connect</h4>
              <div className="flex flex-wrap gap-2">
                {video.instructor_socials.map((social) => {
                  const platform = (social.platform || "").toLowerCase();
                  const Icon =
                    platform === "instagram"
                      ? Instagram
                      : platform === "twitter"
                      ? Twitter
                      : platform === "youtube"
                      ? Youtube
                      : Globe;

                  return (
                    <a
                      key={`${social.platform}-${social.url}`}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-white hover:text-slate-200"
                    >
                      <Icon className="w-4 h-4 text-white" />
                      <span className="underline underline-offset-4">
                        {social.platform}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );

  const renderReviewsSection = () => (
    <div className="mb-8">
      <h3 className="text-2xl font-bold text-white mb-4">Reviews</h3>
      {hasPurchased && (
        <form
          onSubmit={handleReviewSubmit}
          className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6"
        >
          {reviewError && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 text-sm px-4 py-2 rounded mb-3">
              {reviewError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm text-white mb-2 block">Rating</label>
              <select
                value={reviewForm.rating}
                onChange={(event) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    rating: event.target.value,
                  }))
                }
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} stars
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-white mb-2 block">Title</label>
              <input
                value={reviewForm.title}
                onChange={(event) =>
                  setReviewForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-sm text-white mb-2 block">Review</label>
            <textarea
              value={reviewForm.body}
              onChange={(event) =>
                setReviewForm((prev) => ({
                  ...prev,
                  body: event.target.value,
                }))
              }
              className="w-full bg-slate-700 border border-slate-600 text-white rounded px-3 py-2 h-24"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmittingReview}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmittingReview ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-slate-400">No reviews yet. Be the first to leave one.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-4"
            >
              <div className="text-slate-300 text-sm mb-1">
                {"★".repeat(review.rating).padEnd(5, "☆")}
              </div>
              <div className="text-white font-semibold mb-1">{review.title}</div>
              <div className="text-slate-300 text-sm mb-2">{review.body}</div>
              <div className="text-slate-400 text-xs">{review.user_name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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

        {hasPurchased ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-slate-800 border-slate-700 overflow-hidden">
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  {isStreamLoading ? (
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-slate-400 text-sm">Loading stream...</p>
                    </div>
                  ) : streamUrl ? (
                    <video
                      ref={playerRef}
                      className="w-full h-full"
                      src={streamUrl}
                      controls
                      playsInline
                      onTimeUpdate={(e) =>
                        setPlaybackTime(e.currentTarget.currentTime)
                      }
                      onSeeked={(e) =>
                        setPlaybackTime(e.currentTarget.currentTime)
                      }
                    />
                  ) : (
                    <div className="text-center">
                      <Play className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                      <p className="text-slate-400 text-sm">Stream unavailable</p>
                    </div>
                  )}
                </div>
              </Card>

              <div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge className={categoryColors[video.category]}>{video.category}</Badge>
                  {video.skill_level !== "all" && (
                    <Badge className={`${skillLevelColors[video.skill_level]} text-white`}>
                      {video.skill_level}
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    <Clock className="w-3 h-3 mr-1" />
                    {video.duration} minutes
                  </Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3">{video.title}</h1>
                {renderDescriptionBlock(true)}
              </div>

              {renderReviewsSection()}
            </div>

            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700 lg:sticky lg:top-8">
                <CardHeader>
                  <CardTitle className="text-white text-xl">Course Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-3">
                    <h4 className="text-white text-sm font-semibold tracking-tight mb-3 px-1">
                      Chapters
                    </h4>
                    {chapterList.length === 0 ? (
                      <p className="text-slate-400 text-sm px-1">
                        Chapters coming soon.
                      </p>
                    ) : (
                      <div className="max-h-[min(52vh,28rem)] overflow-y-auto overflow-x-hidden pr-1 space-y-1.5 [-webkit-overflow-scrolling:touch]">
                        {chapterList.map((chapter, index) => {
                          const isActive = index === activeChapterIndex;
                          return (
                            <button
                              key={`${chapter.title}-${chapter.time}-${index}`}
                              ref={(el) => {
                                chapterRowRefs.current[index] = el;
                              }}
                              type="button"
                              onClick={() => seekToChapter(chapter.time)}
                              className={[
                                "group w-full cursor-pointer text-left rounded-lg border transition-colors duration-200 ease-out",
                                "flex gap-3 items-start py-3 px-3",
                                "border-transparent",
                                isActive
                                  ? "bg-cyan-500/10 border-cyan-500/25 shadow-[inset_3px_0_0_0_rgba(34,211,238,0.85)]"
                                  : "hover:bg-slate-800/90 hover:border-slate-600/60",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "shrink-0 tabular-nums text-[11px] font-medium tracking-wide pt-0.5 min-w-[3rem]",
                                  isActive
                                    ? "text-cyan-300"
                                    : "text-slate-500 group-hover:text-slate-400",
                                ].join(" ")}
                              >
                                {formatChapterTime(chapter.time)}
                              </span>
                              <span
                                className={[
                                  "flex-1 text-sm leading-snug",
                                  isActive
                                    ? "text-white font-semibold"
                                    : "text-slate-300 font-medium group-hover:text-slate-100",
                                ].join(" ")}
                              >
                                {chapter.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Duration</span>
                      <span>{video.duration} min</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Category</span>
                      <span className="capitalize">{video.category}</span>
                    </div>
                    {video.skill_level !== "all" && (
                      <div className="flex justify-between text-slate-300">
                        <span>Skill level</span>
                        <span className="capitalize">{video.skill_level}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {renderInstructorCard()}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 lg:order-2 order-1">
              <Card className="bg-slate-800 border-slate-700 lg:sticky lg:top-8">
                <CardHeader>
                  <CardTitle className="text-4xl font-bold text-white">
                    ${video.price}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!user ? (
                    <Button
                      onClick={handleAddToCart}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Sign In to Unlock Course
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
                      {isAddingToCart ? "Adding..." : "Unlock Course"}
                    </Button>
                  )}

                  <div className="space-y-3 text-sm text-slate-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Lifetime access
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Watch anytime
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Instant access after purchase
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      Premium instructional course
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-700 space-y-2 text-sm">
                    <div className="flex justify-between text-slate-300">
                      <span>Duration</span>
                      <span>{video.duration} min</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Category</span>
                      <span className="capitalize">{video.category}</span>
                    </div>
                    {video.skill_level !== "all" && (
                      <div className="flex justify-between text-slate-300">
                        <span>Skill level</span>
                        <span className="capitalize">{video.skill_level}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-300">
                      <span>Rating</span>
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        4.9
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 lg:order-1 order-2 space-y-8">
              <Card className="bg-slate-800 border-slate-700 overflow-hidden">
                <div className="relative aspect-video">
                  {video.preview_url ? (
                    <video
                      className="w-full h-full bg-black"
                      src={video.preview_url}
                      controls
                      playsInline
                    />
                  ) : (
                    <>
                      <img
                        src={
                          video.thumbnail_url ||
                          `https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&h=600&fit=crop`
                        }
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

              <div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge className={categoryColors[video.category]}>{video.category}</Badge>
                  {video.skill_level !== "all" && (
                    <Badge className={`${skillLevelColors[video.skill_level]} text-white`}>
                      {video.skill_level}
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-slate-600 text-slate-300">
                    <Clock className="w-3 h-3 mr-1" />
                    {video.duration} minutes
                  </Badge>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4">{video.title}</h1>
                <p className="text-slate-300 text-lg mb-6 leading-relaxed">{courseHook}</p>
                {renderDescriptionBlock(false)}
              </div>

              {renderInstructorCard()}
              {renderReviewsSection()}

              <Card className="bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Ready to Start Training?
                  </h3>
                  <p className="text-slate-300 mb-4">
                    Unlock instant access and train at your own pace.
                  </p>
                  <Button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isAddingToCart ? "Adding..." : "Unlock Course"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
