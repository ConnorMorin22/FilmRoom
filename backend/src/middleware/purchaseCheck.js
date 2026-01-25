const Purchase = require("../models/Purchase");

exports.verifyPurchase = async (req, res, next) => {
  try {
    const videoId = req.params.id || req.params.videoId;
    const userId = req.user._id;

    const purchase = await Purchase.findOne({
      user: userId,
      video: videoId,
      status: "completed",
    });

    if (!purchase) {
      return res.status(403).json({ error: "You must purchase this video" });
    }

    next();
  } catch (error) {
    console.error("Purchase verification error:", error);
    res.status(500).json({ error: "Purchase verification failed" });
  }
};

