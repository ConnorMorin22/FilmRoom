const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const videoRoutes = require("./routes/videoRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Create Express app
const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);

// Middleware to parse JSON (except for Stripe webhook)
app.use("/api/purchases/webhook", express.raw({ type: "application/json" }));
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
