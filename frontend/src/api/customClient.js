import axios from "axios";

const RAW_API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001/api";
export const API_URL = RAW_API_URL.endsWith("/api")
  ? RAW_API_URL
  : `${RAW_API_URL.replace(/\/+$/, "")}/api`;

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Video Entity - matches Base44 API
export const Video = {
  async list(sortBy = "-created_date", limit = null) {
    const { data } = await api.get("/videos");
    let videos = (data.videos || []).map((v) => ({
      ...v,
      id: v._id || v.id, // Map MongoDB _id to id
    }));

    if (sortBy === "-created_date") {
      videos.sort(
        (a, b) => new Date(b.created_date) - new Date(a.created_date)
      );
    }

    if (limit) {
      videos = videos.slice(0, limit);
    }

    return videos;
  },

  async filter(filters = {}, sortBy = "-created_date", limit = null) {
    const { data } = await api.get("/videos");
    let videos = (data.videos || []).map((v) => ({
      ...v,
      id: v._id || v.id, // Map MongoDB _id to id
    }));

    // Apply filters
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        videos = videos.filter((v) => v[key] === filters[key]);
      }
    });

    if (sortBy === "-created_date") {
      videos.sort(
        (a, b) => new Date(b.created_date) - new Date(a.created_date)
      );
    }

    if (limit) {
      videos = videos.slice(0, limit);
    }

    return videos;
  },

  async update(id, data) {
    const { data: response } = await api.put(`/admin/videos/${id}`, data);
    return response;
  },

  async create(data) {
    const { data: response } = await api.post("/admin/videos", data);
    return response;
  },
};

export const Review = {
  async listForVideo(videoId) {
    const { data } = await api.get(`/videos/${videoId}/reviews`);
    return data.reviews || [];
  },
  async create(videoId, payload) {
    const { data } = await api.post(`/videos/${videoId}/reviews`, payload);
    return data.review;
  },
  async top(limit = 8) {
    const { data } = await api.get(`/reviews/top?limit=${limit}`);
    return data.reviews || [];
  },
};

// Purchase Entity
export const Purchase = {
  async list(sortBy = "-created_date") {
    const { data } = await api.get("/admin/purchases");
    let purchases = data.purchases || [];

    if (sortBy === "-created_date") {
      purchases.sort(
        (a, b) => new Date(b.created_date) - new Date(a.created_date)
      );
    }

    return purchases;
  },

  async filter(filters = {}, sortBy = "-created_date") {
    let purchases = await this.list(sortBy);

    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null) {
        purchases = purchases.filter((p) => p[key] === filters[key]);
      }
    });

    return purchases;
  },

  async create(data) {
    const { data: response } = await api.post("/purchases/create-checkout", {
      videoId: data.video_id,
    });
    return response;
  },
};

// CartItem Entity - In-memory for MVP
export const CartItem = {
  items: JSON.parse(localStorage.getItem("filmroom_cart") || "[]"),

  async filter(filters = {}) {
    return this.items.filter(
      (item) => !filters.user_email || item.user_email === filters.user_email
    );
  },

  async create(data) {
    const newItem = {
      id: Date.now().toString(),
      ...data,
      created_date: new Date().toISOString(),
    };
    this.items.push(newItem);
    localStorage.setItem("filmroom_cart", JSON.stringify(this.items));
    return newItem;
  },

  async delete(id) {
    this.items = this.items.filter((item) => item.id !== id);
    localStorage.setItem("filmroom_cart", JSON.stringify(this.items));
    return { success: true };
  },
};

// User Auth
export const User = {
  currentUser: null,

  async me() {
    try {
      const { data } = await api.get("/auth/me");
      this.currentUser = {
        id: data.id,
        email: data.email,
        full_name: data.name,
        purchasedVideos: data.purchasedVideos || [],
        role: data.role || "user",
      };
      return this.currentUser;
    } catch (error) {
      throw new Error("Not authenticated");
    }
  },

  async loginWithRedirect(returnUrl) {
    localStorage.setItem("filmroom_return_url", returnUrl);
    window.location.href = "/login";
  },

  async logout() {
    await api.post("/auth/logout");
    localStorage.removeItem("filmroom_return_url");
    localStorage.removeItem("filmroom_cart");
    this.currentUser = null;
    window.location.href = "/";
  },

  async list(sortBy = "-created_date") {
    const { data } = await api.get("/admin/users");
    let users = data.users || [];

    if (sortBy === "-created_date") {
      users.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }

    return users;
  },
};

// File Upload (mock for now)
export const UploadFile = async (file) => {
  return {
    url: `https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800`,
    key: `uploads/${Date.now()}_${file.name}`,
  };
};
