const User = require("../models/User");
const Purchase = require("../models/Purchase");

// @desc    Get all users (admin)
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 });

    const payload = users.map((user) => ({
      id: user._id,
      full_name: user.name,
      email: user.email,
      role: user.role || "user",
      created_date: user.createdAt,
    }));

    return res.json({ success: true, users: payload });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ error: "Error fetching users" });
  }
};

// @desc    Get purchases (admin)
// @route   GET /api/admin/purchases
exports.getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("user", "email")
      .populate("video", "_id")
      .sort({ purchasedAt: -1 });

    const payload = purchases.map((purchase) => ({
      id: purchase._id,
      user_email: purchase.user?.email || null,
      video_id: purchase.video?._id || null,
      amount_paid: (purchase.amount || 0) / 100,
      payment_status: purchase.status || "completed",
      created_date: purchase.purchasedAt,
    }));

    return res.json({ success: true, purchases: payload });
  } catch (error) {
    console.error("Get purchases error:", error);
    return res.status(500).json({ error: "Error fetching purchases" });
  }
};

