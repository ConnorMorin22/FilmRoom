const User = require("../models/User");
const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const getS3KeyFromUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  if (!process.env.S3_BUCKET_NAME) return null;
  try {
    const parsed = new URL(url);
    const bucketHost = `${process.env.S3_BUCKET_NAME}.s3.`;
    if (!parsed.hostname.startsWith(bucketHost)) {
      return null;
    }
    const key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    return key || null;
  } catch (error) {
    return null;
  }
};

const maybeSignImageUrl = (url) => {
  const key = getS3KeyFromUrl(url);
  if (!key) return url;
  return s3.getSignedUrl("getObject", {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Expires: 60 * 60,
  });
};

const mapVideoMediaUrls = (video) => ({
  ...video,
  thumbnail_url: maybeSignImageUrl(video.thumbnail_url),
  instructor_photo: maybeSignImageUrl(video.instructor_photo),
});

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });
};

const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("filmroom_token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password, // Will be hashed automatically by pre-save hook
    });

    // Generate token
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    // Return user data (without password) and token
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Error creating user" });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email and password" });
    }

    // Find user and include password field (normally hidden)
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    // Return user data and token
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error logging in" });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    // Populate purchasedVideos to get full video objects instead of just IDs
    const user = await User.findById(req.user._id).populate("purchasedVideos");
    const purchasedVideos = (user.purchasedVideos || []).map((video) =>
      video ? mapVideoMediaUrls(video.toObject()) : video
    );

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      purchasedVideos,
      role: user.role,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
};

// @desc    Logout user (clear auth cookie)
// @route   POST /api/auth/logout
exports.logout = (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("filmroom_token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  });
  res.json({ success: true });
};
