import { useState, useEffect, useRef } from "react";
import { Video, Instructor } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { X, Upload, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const FILE_LIMITS = {
  video_url: 200 * 1024 * 1024 * 1024, // 200GB
  preview_url: 2 * 1024 * 1024 * 1024, // 2GB
  thumbnail_url: 20 * 1024 * 1024, // 20MB
  instructor_photo: 20 * 1024 * 1024, // 20MB
};

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
};

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram URL" },
  { key: "twitter", label: "X/Twitter URL" },
  { key: "youtube", label: "YouTube URL" },
  { key: "tiktok", label: "TikTok URL" },
];

const normalizeSocials = (socialState) =>
  SOCIAL_FIELDS.map((field) => ({
    platform: field.key,
    url: socialState?.[field.key]?.trim() || "",
  })).filter((entry) => entry.url);

const parseSocials = (socials) => {
  const initial = SOCIAL_FIELDS.reduce((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {});
  if (!Array.isArray(socials)) return initial;
  socials.forEach((social) => {
    if (social?.platform && social?.url && initial[social.platform] !== undefined) {
      initial[social.platform] = social.url;
    }
  });
  return initial;
};

const formatChapterInput = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const parseChapterInputToSeconds = (value) => {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }

  const parts = normalized.split(":").map((part) => part.trim());
  if (parts.some((part) => !/^\d+$/.test(part))) return null;

  if (parts.length === 2) {
    const [mins, secs] = parts.map(Number);
    if (secs > 59) return null;
    return mins * 60 + secs;
  }

  if (parts.length === 3) {
    const [hrs, mins, secs] = parts.map(Number);
    if (mins > 59 || secs > 59) return null;
    return hrs * 3600 + mins * 60 + secs;
  }

  return null;
};

const buildInitialState = (video) => ({
  title: video?.title || "",
  description: video?.description || "",
  category: video?.category || "offense",
  instructor_id: video?.instructor_id || video?.instructor?.id || "",
  instructor_name: video?.instructor_name || "",
  instructor_bio: video?.instructor_bio || "",
  instructor_photo: video?.instructor_photo || "",
  instructor_socials: parseSocials(video?.instructor_socials),
  video_url: video?.video_url || "",
  s3Key: video?.videoKey || "",
  previewKey: video?.previewKey || "",
  stripeProductId: video?.stripeProductId || "",
  preview_url: video?.preview_url || "",
  thumbnail_url: video?.thumbnail_url || "",
  duration: video?.duration?.toString() || "",
  price: video?.price?.toString() || "",
  skill_level: video?.skill_level || "all",
  tags: Array.isArray(video?.tags) ? video.tags.join(", ") : "",
  timestamps: Array.isArray(video?.timestamps)
    ? video.timestamps.map((chapter) => ({
        title: chapter?.title || "",
        timeInput: formatChapterInput(chapter?.time),
      }))
    : [],
  is_featured: Boolean(video?.is_featured),
  is_active: video?.is_active !== false,
});

export default function VideoUploadModal({ onClose, onVideoUploaded, video }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [uploadingField, setUploadingField] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState("");
  const [videoData, setVideoData] = useState(buildInitialState(video));
  const [instructors, setInstructors] = useState([]);
  const isEditMode = Boolean(video);
  const initialStateRef = useRef(buildInitialState(video));

  useEffect(() => {
    const nextState = buildInitialState(video);
    setVideoData(nextState);
    initialStateRef.current = nextState;
  }, [video]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await Instructor.list({ admin: true });
        if (!cancelled) setInstructors(rows || []);
      } catch (err) {
        console.error("Failed loading instructors:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInputChange = (field, value) => {
    setVideoData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChapterChange = (index, field, value) => {
    setVideoData((prev) => ({
      ...prev,
      timestamps: prev.timestamps.map((chapter, chapterIndex) =>
        chapterIndex === index ? { ...chapter, [field]: value } : chapter
      ),
    }));
  };

  const addChapter = () => {
    setVideoData((prev) => ({
      ...prev,
      timestamps: [...prev.timestamps, { title: "", timeInput: "" }],
    }));
  };

  const removeChapter = (index) => {
    setVideoData((prev) => ({
      ...prev,
      timestamps: prev.timestamps.filter((_, chapterIndex) => chapterIndex !== index),
    }));
  };

  const handleFileUpload = async (file, field) => {
    setError("");
    const limit = FILE_LIMITS[field];
    if (limit && file.size > limit) {
      setError(
        `${field.replace("_", " ")} is too large. Max ${formatBytes(limit)}.`
      );
      return;
    }
    setIsFileUploading(true);
    setUploadingField(field);
    setUploadProgress({
      loaded: 0,
      total: file.size,
      startedAt: Date.now(),
    });
    try {
      const folder = field === "video_url" || field === "preview_url"
        ? "videos"
        : "images";
      const { file_url, s3Key } = await UploadFile({
        file,
        folder,
        onProgress: (progress) => {
          setUploadProgress((prev) => ({
            loaded: progress.loaded,
            total: progress.total,
            startedAt: prev?.startedAt || Date.now(),
          }));
        },
      });
      setVideoData(prev => ({
        ...prev,
        [field]: file_url,
        ...(field === "video_url" ? { s3Key } : {}),
        ...(field === "preview_url" ? { previewKey: s3Key } : {}),
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error.message || "File upload failed. Please try again.");
    } finally {
      setIsFileUploading(false);
      setUploadingField("");
      setUploadProgress(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setError("");

    try {
      const chapterValidation = (videoData.timestamps || []).map((chapter, index) => {
        const title = (chapter.title || "").trim();
        const time = parseChapterInputToSeconds(chapter.timeInput || "");
        return { index, title, time };
      });

      const invalidChapter = chapterValidation.find(
        (chapter) => (chapter.title && chapter.time === null) || (!chapter.title && chapter.time !== null)
      );
      if (invalidChapter) {
        setError(
          `Chapter ${invalidChapter.index + 1} must include both a title and a valid time (e.g. 1:30 or 01:02:15).`
        );
        return;
      }

      const processedData = {
        ...videoData,
        duration: parseFloat(videoData.duration) || 0,
        price: parseFloat(videoData.price) || 0,
        tags: videoData.tags ? videoData.tags.split(',').map(tag => tag.trim()) : [],
        instructor_socials: normalizeSocials(videoData.instructor_socials),
        timestamps: chapterValidation
          .filter((chapter) => chapter.title && chapter.time !== null)
          .map((chapter) => ({ title: chapter.title, time: chapter.time })),
      };

      if (!processedData.thumbnail_url || processedData.duration <= 0) {
        setError("Thumbnail and duration are required.");
        return;
      }

      if (isEditMode) {
        const initialData = initialStateRef.current;
        const hasChanges = Object.keys(processedData).some(
          (key) => processedData[key] !== initialData[key]
        );
        if (!hasChanges) {
          setError("No changes to save. Select a new file or edit fields.");
          return;
        }
        await Video.update(video.id, {
          title: processedData.title,
          description: processedData.description,
          s3Key: processedData.s3Key || undefined,
          stripeProductId: processedData.stripeProductId,
          price: processedData.price,
          instructor_id: processedData.instructor_id || undefined,
          instructor_name: processedData.instructor_name,
          category: processedData.category,
          duration: processedData.duration,
          thumbnail_url: processedData.thumbnail_url,
          instructor_bio: processedData.instructor_bio,
          instructor_photo: processedData.instructor_photo,
          instructor_socials: processedData.instructor_socials,
          skill_level: processedData.skill_level,
          tags: processedData.tags,
          is_featured: processedData.is_featured,
          is_active: processedData.is_active,
          preview_url: processedData.preview_url,
          previewKey: processedData.previewKey || undefined,
          video_url: processedData.video_url,
          timestamps: processedData.timestamps,
        });
      } else {
        if (!processedData.s3Key) {
          setError("Please upload the full video file before saving.");
          return;
        }
        await Video.create({
          title: processedData.title,
          description: processedData.description,
          s3Key: processedData.s3Key,
          stripeProductId: processedData.stripeProductId,
          price: processedData.price,
          instructor_id: processedData.instructor_id || undefined,
          instructor: processedData.instructor_name,
          category: processedData.category,
          duration: processedData.duration,
          thumbnail_url: processedData.thumbnail_url,
          instructor_bio: processedData.instructor_bio,
          instructor_photo: processedData.instructor_photo,
          instructor_socials: processedData.instructor_socials,
          skill_level: processedData.skill_level,
          tags: processedData.tags,
          is_featured: processedData.is_featured,
          is_active: processedData.is_active,
          preview_url: processedData.preview_url,
          previewKey: processedData.previewKey || undefined,
          video_url: processedData.video_url,
          timestamps: processedData.timestamps,
        });
      }
      onVideoUploaded();
    } catch (error) {
      console.error("Error creating video:", error);
      setError(
        error.response?.data?.error ||
          "Failed to create video. Check required fields."
      );
    }
    
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">
            {isEditMode ? "Edit Video" : "Upload New Video"}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 text-sm px-4 py-2 rounded">
              {error}
            </div>
          )}
          {isFileUploading && (
            <div className="bg-blue-900/30 border border-blue-700 text-blue-200 text-sm px-4 py-2 rounded">
              <div className="flex items-center justify-between gap-4">
                <span>Uploading {uploadingField.replace("_", " ")}...</span>
                {uploadProgress && (
                  <span className="text-xs">
                    {formatBytes(uploadProgress.loaded)} /{" "}
                    {formatBytes(uploadProgress.total)}
                  </span>
                )}
              </div>
              {uploadProgress && uploadProgress.total > 0 && (
                <div className="mt-2">
                  <div className="h-2 w-full rounded bg-blue-900/50">
                    <div
                      className="h-2 rounded bg-blue-400"
                      style={{
                        width: `${Math.min(
                          100,
                          (uploadProgress.loaded / uploadProgress.total) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-blue-100/80">
                    {(() => {
                      const elapsed =
                        (Date.now() - uploadProgress.startedAt) / 1000;
                      const speed =
                        elapsed > 0 ? uploadProgress.loaded / elapsed : 0;
                      const remaining =
                        speed > 0
                          ? (uploadProgress.total - uploadProgress.loaded) /
                            speed
                          : 0;
                      return `~${formatDuration(remaining)} remaining`;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="text-xs text-slate-400">
            File limits: Video up to {formatBytes(FILE_LIMITS.video_url)} ·
            Preview up to {formatBytes(FILE_LIMITS.preview_url)} · Images up to{" "}
            {formatBytes(FILE_LIMITS.thumbnail_url)}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="bg-slate-900/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Sales</CardTitle>
                <p className="text-sm text-slate-400">
                  Controls the pre-purchase conversion experience.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="text-white">Video Title</Label>
                    <Input
                      id="title"
                      value={videoData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-white">Category</Label>
                    <Select
                      value={videoData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="offense" className="text-white">Offense</SelectItem>
                        <SelectItem value="defense" className="text-white">Defense</SelectItem>
                        <SelectItem value="faceoffs" className="text-white">Faceoffs</SelectItem>
                        <SelectItem value="goalies" className="text-white">Goalies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-white">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={videoData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="stripeProductId" className="text-white">Stripe Product ID</Label>
                    <Input
                      id="stripeProductId"
                      value={videoData.stripeProductId}
                      onChange={(e) => handleInputChange("stripeProductId", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="preview_url" className="text-white">Preview/Trailer (Optional)</Label>
                  <Input
                    id="preview_url"
                    type="file"
                    accept="video/*"
                    onChange={(e) =>
                      e.target.files[0] && handleFileUpload(e.target.files[0], "preview_url")
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  {videoData.preview_url && (
                    <div className="mt-2">
                      <video
                        src={videoData.preview_url}
                        controls
                        className="w-full max-w-sm rounded border border-slate-600"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="thumbnail_url" className="text-white">Thumbnail Image</Label>
                  {videoData.thumbnail_url && (
                    <div className="mt-2 mb-3">
                      <img
                        src={videoData.thumbnail_url}
                        alt="Current thumbnail"
                        className="w-40 h-24 object-cover rounded border border-slate-600"
                      />
                    </div>
                  )}
                  <Input
                    id="thumbnail_url"
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      e.target.files[0] && handleFileUpload(e.target.files[0], "thumbnail_url")
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="instructor_id" className="text-white">Link Instructor Profile</Label>
                  <Select
                    value={videoData.instructor_id || "none"}
                    onValueChange={(value) => {
                      const selected = value === "none" ? null : instructors.find((i) => i.id === value);
                      handleInputChange("instructor_id", value === "none" ? "" : value);
                      if (selected) {
                        handleInputChange("instructor_name", selected.name || "");
                        handleInputChange("instructor_bio", selected.bio || "");
                        handleInputChange("instructor_photo", selected.photo_url || "");
                        handleInputChange("instructor_socials", {
                          instagram: selected.instagram_url || "",
                          twitter: selected.twitter_url || "",
                          youtube: selected.youtube_url || "",
                          tiktok: selected.tiktok_url || "",
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="none" className="text-white">None (legacy fields only)</SelectItem>
                      {instructors.map((ins) => (
                        <SelectItem key={ins.id} value={ins.id} className="text-white">
                          {ins.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {videoData.instructor_id ? (
                    <p className="text-xs text-slate-400 mt-2">
                      Profile data is sourced from the selected instructor. Legacy fields remain editable for fallback.
                    </p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="instructor_name" className="text-white">Instructor Name</Label>
                    <Input
                      id="instructor_name"
                      value={videoData.instructor_name}
                      onChange={(e) => handleInputChange("instructor_name", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="instructor_photo" className="text-white">Instructor Photo</Label>
                    <Input
                      id="instructor_photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files[0] && handleFileUpload(e.target.files[0], "instructor_photo")
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="instructor_bio" className="text-white">Instructor Bio</Label>
                  <Textarea
                    id="instructor_bio"
                    value={videoData.instructor_bio}
                    onChange={(e) => handleInputChange("instructor_bio", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white h-20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SOCIAL_FIELDS.map((field) => (
                    <div key={field.key}>
                      <Label htmlFor={`social_${field.key}`} className="text-white">
                        {field.label}
                      </Label>
                      <Input
                        id={`social_${field.key}`}
                        value={videoData.instructor_socials[field.key]}
                        onChange={(e) =>
                          handleInputChange("instructor_socials", {
                            ...videoData.instructor_socials,
                            [field.key]: e.target.value,
                          })
                        }
                        placeholder="https://"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_featured"
                      checked={videoData.is_featured}
                      onCheckedChange={(checked) => handleInputChange("is_featured", checked)}
                    />
                    <Label htmlFor="is_featured" className="text-white">Featured Video</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="is_active"
                      checked={videoData.is_active}
                      onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                    />
                    <Label htmlFor="is_active" className="text-white">Active</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/60 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Purchased</CardTitle>
                <p className="text-sm text-slate-400">
                  Controls the owned course/player experience.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="video_url" className="text-white">Full Video File</Label>
                  {isEditMode && (
                    <p className="text-xs text-slate-400 mt-1">
                      Select a new file to replace the current full course video.
                    </p>
                  )}
                  <Input
                    id="video_url"
                    type="file"
                    accept="video/*"
                    onChange={(e) =>
                      e.target.files[0] && handleFileUpload(e.target.files[0], "video_url")
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Full Course Description (Markdown)</Label>
                  <Textarea
                    id="description"
                    value={videoData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white h-36"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={videoData.duration}
                      onChange={(e) => handleInputChange("duration", e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="skill_level" className="text-white">Skill Level</Label>
                    <Select
                      value={videoData.skill_level}
                      onValueChange={(value) => handleInputChange("skill_level", value)}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="all" className="text-white">All Levels</SelectItem>
                        <SelectItem value="beginner" className="text-white">Beginner</SelectItem>
                        <SelectItem value="intermediate" className="text-white">Intermediate</SelectItem>
                        <SelectItem value="advanced" className="text-white">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags" className="text-white">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={videoData.tags}
                    onChange={(e) => handleInputChange("tags", e.target.value)}
                    placeholder="dodging, shooting, fundamentals"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Timestamps / Chapters</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addChapter}
                      className="border-slate-600 text-slate-200 hover:bg-slate-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Chapter
                    </Button>
                  </div>

                  {videoData.timestamps.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No chapters yet. Add chapters to power the owned player navigation.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {videoData.timestamps.map((chapter, index) => (
                        <div
                          key={`chapter-${index}`}
                          className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-800/70 border border-slate-700 rounded p-2"
                        >
                          <div className="md:col-span-7">
                            <Input
                              value={chapter.title}
                              onChange={(e) =>
                                handleChapterChange(index, "title", e.target.value)
                              }
                              placeholder="Chapter title"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Input
                              value={chapter.timeInput}
                              onChange={(e) =>
                                handleChapterChange(index, "timeInput", e.target.value)
                              }
                              placeholder="mm:ss or hh:mm:ss"
                              className="bg-slate-700 border-slate-600 text-white"
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeChapter(index)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              aria-label={`Remove chapter ${index + 1}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading || isFileUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Uploading...
                  </div>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {isEditMode ? "Save Changes" : "Create Video"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}