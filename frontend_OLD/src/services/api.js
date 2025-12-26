import axios from "axios";

const API_URL = "http://localhost:5001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// Video API calls
export const videoAPI = {
  getAll: async () => {
    const response = await api.get("/videos");
    return response.data;
  },

  getOne: async (id) => {
    const response = await api.get(`/videos/${id}`);
    return response.data;
  },

  getMyLibrary: async () => {
    const response = await api.get("/videos/my-library");
    return response.data;
  },
};

// Purchase API calls
export const purchaseAPI = {
  createCheckout: async (videoId) => {
    const response = await api.post("/purchases/create-checkout", { videoId });
    return response.data;
  },
};

export default api;
