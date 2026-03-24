
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { createPageUrl, getDescriptionPreviewText } from "@/utils";
import { resolveInstructorForVideo } from "@/utils/instructors";
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
  ListChecks,
  Target,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SECTION_HEADING_LINE_RE =
  /^(what you['’]ll learn|built for|my quick read)$/i;

const GENERIC_COURSE_HOOK = "Structured training built to accelerate your game.";

const CATEGORY_SUBHEADLINES = {
  goalies:
    "Master positioning, footwork, and shot-stopping at a higher level.",
  offense: "Create space, beat defenders, and finish with confidence.",
  defense: "Shut down threats with smarter positioning and reads.",
  faceoffs:
    "Win more possessions with elite faceoff technique and strategy.",
};

function normalizeDescriptionToMarkdown(descriptionText) {
  if (!descriptionText) return "";

  const lines = descriptionText.split("\n");
  const normalized = lines.map((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return "";
    }

    if (/^[•●▪◦]\s+/.test(trimmed)) {
      return `- ${trimmed.replace(/^[•●▪◦]\s+/, "")}`;
    }

    if (SECTION_HEADING_LINE_RE.test(trimmed)) {
      return `### ${trimmed}`;
    }

    return line;
  });

  return normalized.join("\n");
}

function stripLeadingParagraphIfDuplicate(descriptionText, subheadline) {
  if (!descriptionText || !subheadline?.trim()) return descriptionText;
  const subNorm = subheadline.trim().replace(/\s+/g, " ").toLowerCase();
  const blocks = descriptionText.split(/\n\s*\n/);
  const firstRaw = blocks[0]?.trim();
  if (!firstRaw) return descriptionText;
  const firstNorm = firstRaw.replace(/\s+/g, " ").toLowerCase();

  if (firstNorm === subNorm) {
    const rest = blocks.slice(1).join("\n\n").trim();
    return rest || descriptionText;
  }
  if (subNorm.length >= 28 && firstNorm.startsWith(subNorm.slice(0, 28))) {
    const rest = blocks.slice(1).join("\n\n").trim();
    return rest || descriptionText;
  }
  if (firstNorm.length >= 28 && subNorm.startsWith(firstNorm.slice(0, 28))) {
    const rest = blocks.slice(1).join("\n\n").trim();
    return rest || descriptionText;
  }
  return descriptionText;
}

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

  const markdownDescription = useMemo(
    () => normalizeDescriptionToMarkdown(descriptionText),
    [descriptionText]
  );

  const courseHook = useMemo(() => {
    const preview = getDescriptionPreviewText(descriptionText);
    if (!preview) return GENERIC_COURSE_HOOK;

    const firstSentence = preview.match(/.*?[.!?](\s|$)/)?.[0]?.trim();
    return firstSentence || preview;
  }, [descriptionText]);

  const courseSubheadline = useMemo(() => {
    const custom =
      typeof video?.sales_summary === "string" ? video.sales_summary.trim() : "";
    if (custom) return custom;
    const hook = courseHook;
    if (
      (hook === GENERIC_COURSE_HOOK || !descriptionText?.trim()) &&
      video?.category
    ) {
      return CATEGORY_SUBHEADLINES[video.category] || hook;
    }
    return hook;
  }, [video?.sales_summary, video?.category, courseHook, descriptionText]);

  const descriptionTextForSales = useMemo(
    () => stripLeadingParagraphIfDuplicate(descriptionText, courseSubheadline),
    [descriptionText, courseSubheadline]
  );

  const markdownDescriptionForSales = useMemo(
    () => normalizeDescriptionToMarkdown(descriptionTextForSales),
    [descriptionTextForSales]
  );

  const shouldShowSalesDescriptionToggle = useMemo(() => {
    if (!descriptionTextForSales) return false;
    const lines = descriptionTextForSales.split("\n").length;
    const hasListFormatting = /(^|\n)\s*[-*]\s+/.test(descriptionTextForSales);
    return (
      descriptionTextForSales.length > 280 ||
      lines > 5 ||
      hasListFormatting
    );
  }, [descriptionTextForSales]);

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

  const renderDescriptionBlock = (compact = false, salesMode = false) => {
    const md = salesMode
      ? markdownDescriptionForSales.trim() || markdownDescription
      : markdownDescription;
    const showToggle = salesMode
      ? markdownDescriptionForSales.trim()
        ? shouldShowSalesDescriptionToggle
        : shouldShowDescriptionToggle
      : shouldShowDescriptionToggle;

    return (
    <div className={compact ? "mb-6" : "mb-10"}>
      <div
        className={`relative overflow-hidden transition-all duration-300 ${
          !isDescriptionExpanded && showToggle
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
          {md || "No description available."}
        </ReactMarkdown>

        {!isDescriptionExpanded && showToggle && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-900 to-transparent" />
        )}
      </div>

      {showToggle && (
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
  };

  const renderInstructorCard = () => (
    (() => {
      const instructor = resolveInstructorForVideo(video);
      return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white text-xl">Your Instructor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <img
            src={
              instructor.photo ||
              `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face`
            }
            alt={instructor.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-2xl font-bold text-white">{instructor.name}</h3>
            <div className="flex items-center gap-1 text-slate-400">
              <Award className="w-4 h-4" />
              <span className="text-slate-300">{instructor.roleHeadline}</span>
            </div>
          </div>
        </div>
        {instructor.bio && (
          <p className="text-slate-300 text-sm mb-4">{instructor.bio}</p>
        )}
        {Array.isArray(instructor.socials) &&
          instructor.socials.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Connect</h4>
              <div className="flex flex-wrap gap-2">
                {instructor.socials.map((social) => {
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
    })()
  );

  const renderReviewsSection = ({ hideTitle = false } = {}) => (
    <div className={hideTitle ? "" : "mb-8"}>
      {!hideTitle && (
        <h3 className="text-2xl font-bold text-white mb-4">Reviews</h3>
      )}
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
              <Card className="bg-slate-800 border-slate-700">
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
          <div className="space-y-16 lg:space-y-20">
            {/* Sales hero — two columns */}
            <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              <div className="lg:col-span-7 xl:col-span-8 space-y-6 lg:order-1 order-2">
                <div className="rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-2xl shadow-black/40 ring-1 ring-white/5">
                  <div className="relative aspect-video bg-black">
                    {video.preview_url ? (
                      <video
                        className="w-full h-full object-contain bg-black"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-4 ring-1 ring-white/20">
                              <Play className="w-10 h-10 text-white ml-1" />
                            </div>
                            <p className="text-white/90 text-sm font-medium tracking-wide">
                              Preview clip
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center rounded-md bg-black/55 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/95 ring-1 ring-white/15">
                        Preview
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-500 -mt-2 pl-1">
                  {video.preview_url
                    ? "Watch a preview of how this course is taught."
                    : "See how this course is taught — full video unlocks after purchase."}
                </p>

                <div className="pt-2">
                  <h1 className="text-4xl sm:text-5xl md:text-[2.75rem] font-bold text-white tracking-tight leading-[1.08] mb-4">
                    {video.title}
                  </h1>
                  <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-3xl font-light">
                    {courseSubheadline}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500 border-t border-slate-800 pt-6">
                    <span className="inline-flex items-center gap-1.5 text-slate-400">
                      <Star className="w-3.5 h-3.5 text-amber-400/90 shrink-0" />
                      <span className="font-medium text-slate-300">4.9</span>
                      <span>rating</span>
                    </span>
                    <span className="text-slate-600 hidden sm:inline" aria-hidden>
                      ·
                    </span>
                    <span>Premium instructional course</span>
                    <span className="text-slate-600 hidden sm:inline" aria-hidden>
                      ·
                    </span>
                    <span>Built for serious players</span>
                    <span className="text-slate-600 hidden sm:inline" aria-hidden>
                      ·
                    </span>
                    <span>One-time purchase</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 xl:col-span-4 lg:order-2 order-1">
                <Card className="border-slate-600/50 bg-slate-800/90 backdrop-blur-sm shadow-xl shadow-black/30 lg:sticky lg:top-8 rounded-2xl overflow-hidden ring-1 ring-white/5">
                  <CardHeader className="space-y-1 pb-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                      Full course access
                    </p>
                    <CardTitle className="text-4xl sm:text-5xl font-bold text-white tabular-nums">
                      ${video.price}
                    </CardTitle>
                    <p className="text-sm text-slate-500">One-time price · no subscription</p>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-0">
                    {!user ? (
                      <>
                        <Button
                          onClick={handleAddToCart}
                          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/10"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2 shrink-0" />
                          Get Instant Access
                        </Button>
                        <p className="text-center text-xs text-slate-500 -mt-2">
                          One-time purchase. Lifetime access.
                        </p>
                      </>
                    ) : isInCart ? (
                      <div className="space-y-2">
                        <Button
                          onClick={() => navigate(createPageUrl("Cart"))}
                          className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          In Cart — Checkout
                        </Button>
                        <p className="text-slate-400 text-sm text-center">
                          Item added to your cart
                        </p>
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={handleAddToCart}
                          disabled={isAddingToCart}
                          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white shadow-lg shadow-cyan-500/10"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2 shrink-0" />
                          {isAddingToCart ? "Adding…" : "Unlock Full Course"}
                        </Button>
                        <p className="text-center text-xs text-slate-500 -mt-2">
                          One-time purchase. Lifetime access.
                        </p>
                      </>
                    )}

                    <ul className="space-y-2.5 text-sm text-slate-300">
                      {[
                        "Lifetime access",
                        "Watch anytime, any device",
                        "Instant access after purchase",
                        "Premium instructional course",
                      ].map((line) => (
                        <li key={line} className="flex items-start gap-2.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400/90 shrink-0 mt-0.5" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-4 space-y-2.5 text-sm">
                      <div className="flex justify-between gap-4 text-slate-400">
                        <span>Duration</span>
                        <span className="text-slate-200 font-medium tabular-nums">
                          {video.duration} min
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-400">
                        <span>Category</span>
                        <span className="text-slate-200 font-medium capitalize">
                          {video.category}
                        </span>
                      </div>
                      {video.skill_level !== "all" && (
                        <div className="flex justify-between gap-4 text-slate-400">
                          <span>Skill level</span>
                          <span className="text-slate-200 font-medium capitalize">
                            {video.skill_level}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 text-slate-400">
                        <span>Rating</span>
                        <span className="inline-flex items-center gap-1 text-slate-200 font-medium">
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          4.9
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Course curriculum / details */}
            <section className="max-w-4xl">
              <div className="mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Course details
                </h2>
                <p className="text-lg text-slate-300 max-w-2xl">
                  Everything included in this program — structured for real progress.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-800/30 p-6 md:p-8 ring-1 ring-white/5">
                {renderDescriptionBlock(false, true)}
              </div>
            </section>

            {/* Why this course works */}
            <section>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Why this course works
              </h2>
              <p className="text-slate-400 text-sm md:text-base mb-8 max-w-2xl">
                Clear instruction designed for athletes who want results, not noise.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 md:gap-5">
                {[
                  {
                    icon: Target,
                    title: "Elite-level experience",
                    body: "Built from what works at the highest levels of the game.",
                  },
                  {
                    icon: Layers,
                    title: "Real in-game performance",
                    body: "Structured so you can apply it when it matters — not just in theory.",
                  },
                  {
                    icon: ListChecks,
                    title: "Step-by-step clarity",
                    body: "Progressive instruction — no guesswork, no filler.",
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-5 md:p-6 ring-1 ring-white/5"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
                      <Icon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Instructor */}
            <section className="space-y-3">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                  Your instructor
                </h2>
                <p className="text-slate-400 text-sm max-w-xl">
                  Learn from someone who has competed and coached at a serious level.
                </p>
              </div>
              {renderInstructorCard()}
            </section>

            {/* Reviews */}
            <section>
              <Card className="border-slate-700/80 bg-slate-800/50 rounded-2xl ring-1 ring-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl md:text-2xl text-white">
                    What students say
                  </CardTitle>
                  <p className="text-sm text-slate-400 font-normal leading-relaxed">
                    Real feedback from the FilmRoom community — reviews help you
                    decide with confidence.
                  </p>
                </CardHeader>
                <CardContent>{renderReviewsSection({ hideTitle: true })}</CardContent>
              </Card>
            </section>

            {/* Lower CTA */}
            <section className="pb-4">
              <Card className="rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-800/90 to-slate-900/90 overflow-hidden ring-1 ring-cyan-500/10">
                <CardContent className="p-8 md:p-10 text-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Ready to train smarter?
                  </h2>
                  <p className="text-slate-400 text-sm md:text-base mb-6 max-w-md mx-auto">
                    Get full access and work through the course on your schedule.
                  </p>
                  {!user ? (
                    <Button
                      onClick={handleAddToCart}
                      className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Get Instant Access
                    </Button>
                  ) : isInCart ? (
                    <Button
                      onClick={() => navigate(createPageUrl("Cart"))}
                      className="h-12 px-8 text-base font-semibold bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Go to checkout
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart}
                      className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {isAddingToCart ? "Adding…" : "Unlock Full Course"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
