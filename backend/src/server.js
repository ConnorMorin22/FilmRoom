const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const videoRoutes = require("./routes/videoRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const { stripeWebhook } = require("./controllers/purchaseController");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Create Express app
const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
      ].filter(Boolean);
      const vercelPreviewRegex =
        /^https:\/\/filmroom-frontend-[a-z0-9-]+\.vercel\.app$/i;

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        vercelPreviewRegex.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(cookieParser());

// Stripe webhook (must be raw body)
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

// Middleware to parse JSON
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({ message: "FilmRoom API is running!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/purchases", purchaseRoutes);

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
