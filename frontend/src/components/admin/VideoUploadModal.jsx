import React, { useState } from "react";
import { Video } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { X, Upload, Play, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function VideoUploadModal({ onClose, onVideoUploaded }) {
  const [isUploading, setIsUploading] = useState(false);
  const [videoData, setVideoData] = useState({
    title: "",
    description: "",
    category: "offense",
    instructor_name: "",
    instructor_bio: "",
    instructor_photo: "",
    video_url: "",
    preview_url: "",
    thumbnail_url: "",
    duration: "",
    price: "",
    skill_level: "all",
    tags: "",
    is_featured: false,
    is_active: true
  });

  const handleInputChange = (field, value) => {
    setVideoData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (file, field) => {
    try {
      const { file_url } = await UploadFile({ file });
      setVideoData(prev => ({
        ...prev,
        [field]: file_url
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const processedData = {
        ...videoData,
        duration: parseFloat(videoData.duration) || 0,
        price: parseFloat(videoData.price) || 0,
        tags: videoData.tags ? videoData.tags.split(',').map(tag => tag.trim()) : []
      };

      await Video.create(processedData);
      onVideoUploaded();
    } catch (error) {
      console.error("Error creating video:", error);
    }
    
    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50 p-4">
      <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Upload New Video</CardTitle>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
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
                <Select value={videoData.category} onValueChange={(value) => handleInputChange("category", value)}>
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

            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={videoData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="bg-slate-700 border-slate-600 text-white h-24"
                required
              />
            </div>

            {/* Instructor Info */}
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
                <div className="flex gap-2">
                  <Input
                    id="instructor_photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], "instructor_photo")}
                    className="bg-slate-700 border-slate-600 text-white flex-1"
                  />
                </div>
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

            {/* Video Files */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="video_url" className="text-white">Full Video File</Label>
                <Input
                  id="video_url"
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], "video_url")}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="preview_url" className="text-white">Preview/Trailer (Optional)</Label>
                <Input
                  id="preview_url"
                  type="file"
                  accept="video/*"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], "preview_url")}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label htmlFor="thumbnail_url" className="text-white">Thumbnail Image</Label>
                <Input
                  id="thumbnail_url"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], "thumbnail_url")}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            {/* Video Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="skill_level" className="text-white">Skill Level</Label>
                <Select value={videoData.skill_level} onValueChange={(value) => handleInputChange("skill_level", value)}>
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

            {/* Checkboxes */}
            <div className="flex items-center space-x-6">
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
                disabled={isUploading}
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
                    Create Video
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