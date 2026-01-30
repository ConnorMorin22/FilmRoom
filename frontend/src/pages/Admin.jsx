import React, { useState, useEffect } from "react";
import { Video } from "@/api/entities";
import { Purchase } from "@/api/entities";
import { User } from "@/api/entities";
import { 
  Crown, 
  Plus, 
  Upload, 
  Users, 
  DollarSign, 
  Play,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

import VideoUploadModal from "../components/admin/VideoUploadModal";

export default function Admin() {
  const [videos, setVideos] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalRevenue: 0,
    totalUsers: 0,
    thisMonthSales: 0
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    const [videoData, purchaseData, userData] = await Promise.all([
      Video.list("-created_date"),
      Purchase.filter({ payment_status: "completed" }, "-created_date"),
      User.list("-created_date")
    ]);

    setVideos(videoData);
    setPurchases(purchaseData);
    setUsers(userData);

    // Calculate stats
    const totalRevenue = purchaseData.reduce((sum, p) => sum + p.amount_paid, 0);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthSales = purchaseData.filter(p => 
      new Date(p.created_date) >= thisMonth
    ).reduce((sum, p) => sum + p.amount_paid, 0);

    setStats({
      totalVideos: videoData.length,
      totalRevenue,
      totalUsers: userData.length,
      thisMonthSales
    });

    setIsLoading(false);
  };

  const handleVideoUploaded = () => {
    setShowUploadModal(false);
    setEditingVideo(null);
    loadAdminData();
  };

  const toggleVideoStatus = async (video) => {
    await Video.update(video.id, { is_active: !video.is_active });
    loadAdminData();
  };

  const toggleFeaturedStatus = async (video) => {
    await Video.update(video.id, { is_featured: !video.is_featured });
    loadAdminData();
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Crown className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-400">Manage your FilmRoom platform</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingVideo(null);
              setShowUploadModal(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Video
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Videos</p>
                  <p className="text-2xl font-bold text-white">{stats.totalVideos}</p>
                </div>
                <Play className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">This Month</p>
                  <p className="text-2xl font-bold text-white">${stats.thisMonthSales.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700 mb-8">
            <TabsTrigger value="videos" className="text-slate-300 data-[state=active]:text-white">
              Videos ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="sales" className="text-slate-300 data-[state=active]:text-white">
              Sales ({purchases.length})
            </TabsTrigger>
            <TabsTrigger value="users" className="text-slate-300 data-[state=active]:text-white">
              Users ({users.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Video Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Video</TableHead>
                      <TableHead className="text-slate-300">Category</TableHead>
                      <TableHead className="text-slate-300">Price</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {videos.map((video) => (
                      <TableRow key={video.id} className="border-slate-700">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={video.thumbnail_url || `https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=100&h=60&fit=crop`}
                              alt={video.title}
                              className="w-16 h-10 object-cover rounded"
                            />
                            <div>
                              <div className="font-medium text-white">{video.title}</div>
                              <div className="text-slate-400 text-sm">by {video.instructor_name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-slate-700 text-slate-300">
                            {video.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          ${video.price}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge className={video.is_active ? "bg-green-600" : "bg-red-600"}>
                              {video.is_active ? "Active" : "Inactive"}
                            </Badge>
                            {video.is_featured && (
                              <Badge className="bg-yellow-600">Featured</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingVideo(video)}
                              className="text-slate-400 hover:text-blue-400"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleVideoStatus(video)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFeaturedStatus(video)}
                              className="text-slate-400 hover:text-yellow-400"
                            >
                              <Crown className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">User</TableHead>
                      <TableHead className="text-slate-300">Video</TableHead>
                      <TableHead className="text-slate-300">Amount</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.slice(0, 20).map((purchase) => {
                      const video = videos.find(v => v.id === purchase.video_id);
                      return (
                        <TableRow key={purchase.id} className="border-slate-700">
                          <TableCell className="text-slate-300">
                            {new Date(purchase.created_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-white">
                            {purchase.user_email}
                          </TableCell>
                          <TableCell className="text-white">
                            {video?.title || 'Video not found'}
                          </TableCell>
                          <TableCell className="text-white font-medium">
                            ${purchase.amount_paid.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-600">
                              {purchase.payment_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Name</TableHead>
                      <TableHead className="text-slate-300">Email</TableHead>
                      <TableHead className="text-slate-300">Role</TableHead>
                      <TableHead className="text-slate-300">Joined</TableHead>
                      <TableHead className="text-slate-300">Purchases</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const userPurchases = purchases.filter(p => p.user_email === user.email);
                      return (
                        <TableRow key={user.id} className="border-slate-700">
                          <TableCell className="text-white">
                            {user.full_name}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {user.email}
                          </TableCell>
                          <TableCell>
                            <Badge className={user.role === 'admin' ? "bg-yellow-600" : "bg-slate-600"}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {new Date(user.created_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-white">
                            {userPurchases.length} videos
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Upload/Edit Modal */}
        {(showUploadModal || editingVideo) && (
          <VideoUploadModal
            video={editingVideo}
            onClose={() => {
              setShowUploadModal(false);
              setEditingVideo(null);
            }}
            onVideoUploaded={handleVideoUploaded}
          />
        )}
      </div>
    </div>
  );
}