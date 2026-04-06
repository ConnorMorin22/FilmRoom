const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;
const Purchase = require("../models/Purchase");
const Video = require("../models/Video");
const User = require("../models/User");

const STRIPE_PRICE_ID_RE = /^price_[a-zA-Z0-9]+$/;

function getValidStripePriceId(video) {
  const raw = (video.stripePriceId || "").trim();
  if (STRIPE_PRICE_ID_RE.test(raw)) return raw;
  return null;
}

function normalizeVideoIds(payload) {
  const single = payload?.videoId;
  const list = Array.isArray(payload?.videoIds) ? payload.videoIds : [];
  const ids = [
    ...list.map((id) => String(id).trim()).filter(Boolean),
    ...(single != null ? [String(single).trim()] : []),
  ];
  return [...new Set(ids)];
}

async function upsertCompletedPurchase({
  userId,
  videoId,
  stripeSessionId,
  stripePaymentIntentId,
  amountPerVideo,
}) {
  const existing = await Purchase.findOne({
    user: userId,
    video: videoId,
  });

  if (!existing) {
    try {
      await Purchase.create({
        user: userId,
        video: videoId,
        stripeSessionId,
        stripePaymentIntentId,
        amount: amountPerVideo,
        status: "completed",
      });
    } catch (createErr) {
      if (createErr.code !== 11000) {
        throw createErr;
      }
    }
  } else if (!existing.stripeSessionId && stripeSessionId) {
    await Purchase.findByIdAndUpdate(existing._id, {
      stripeSessionId,
      stripePaymentIntentId: stripePaymentIntentId || existing.stripePaymentIntentId,
      status: "completed",
    });
  }

  await User.findByIdAndUpdate(userId, {
    $addToSet: { purchasedVideos: videoId },
  });
}

// @desc    Create Stripe checkout session (or demo purchase)
// @route   POST /api/purchases/create-checkout
exports.createCheckout = async (req, res) => {
  try {
    const videoIds = normalizeVideoIds(req.body);
    if (!videoIds.length) {
      return res.status(400).json({ error: "videoId or videoIds is required" });
    }
    const userId = req.user._id;

    // Get video details for all requested items
    const videos = await Video.find({ _id: { $in: videoIds } });
    const videosById = new Map(videos.map((video) => [String(video._id), video]));
    const missingVideoIds = videoIds.filter((id) => !videosById.has(id));
    if (missingVideoIds.length) {
      return res.status(404).json({ error: "One or more videos were not found" });
    }

    // Check already purchased videos and ignore them
    const existingPurchases = await Purchase.find({
      user: userId,
      video: { $in: videoIds },
    });
    const purchasedSet = new Set(existingPurchases.map((p) => String(p.video)));
    const purchasableIds = videoIds.filter((id) => !purchasedSet.has(id));

    if (!purchasableIds.length) {
      return res.status(400).json({ error: "You already own these videos" });
    }

    // DEMO MODE: If Stripe not configured, create purchase directly
    if (!stripe) {
      console.log("🎬 DEMO MODE: Creating purchase without Stripe");

      const demoPurchases = [];
      for (const id of purchasableIds) {
        const video = videosById.get(id);
        const purchase = await Purchase.create({
          user: userId,
          video: id,
          amount: Math.round(Number(video.price || 0) * 100),
          status: "completed",
        });
        demoPurchases.push(purchase);
        await User.findByIdAndUpdate(userId, {
          $addToSet: { purchasedVideos: id },
        });
      }

      return res.json({
        success: true,
        demo: true,
        message: "Demo purchase completed",
        purchases: demoPurchases,
      });
    }

    // PRODUCTION MODE: Stripe Checkout must use Price IDs (price_)
    const lineItems = [];
    for (const id of purchasableIds) {
      const video = videosById.get(id);
      const stripePriceId = getValidStripePriceId(video);
      if (!stripePriceId) {
        return res.status(400).json({
          error:
            "One or more courses are missing a valid Stripe Price ID (price_...). Set them in admin.",
        });
      }
      lineItems.push({ price: stripePriceId, quantity: 1 });
    }

    const frontendUrl =
      process.env.FRONTEND_URL?.trim() ||
      (process.env.NODE_ENV === "production"
        ? "https://lacrossefilmroom.com"
        : "http://localhost:5173");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      metadata: {
        userId: String(userId),
        videoId: String(purchasableIds[0]),
        videoIds: JSON.stringify(purchasableIds),
      },
      success_url: `${frontendUrl}/Library`,
      cancel_url: `${frontendUrl}/Videos`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Error creating checkout session" });
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/webhooks/stripe
// @note    Registered in app.js BEFORE express.json() with express.raw({ type: "application/json" })
exports.stripeWebhook = async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res
      .status(503)
      .json({ error: "Payment processing not configured yet" });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe webhook: STRIPE_WEBHOOK_SECRET is not set");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const singleVideoId = session.metadata?.videoId;
    let videoIds = [];
    try {
      const parsed = JSON.parse(session.metadata?.videoIds || "[]");
      if (Array.isArray(parsed)) {
        videoIds = parsed.map((id) => String(id).trim()).filter(Boolean);
      }
    } catch (parseErr) {
      console.warn("Invalid metadata.videoIds JSON:", parseErr.message);
    }
    if (!videoIds.length && singleVideoId) {
      videoIds = [String(singleVideoId)];
    }

    if (!userId || !videoIds.length) {
      console.error(
        "Stripe webhook: checkout.session.completed missing userId or videoId(s)",
        { sessionId: session.id, metadata: session.metadata }
      );
    } else {
      try {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        const amountTotal = Number(session.amount_total || 0);
        const perVideoAmount =
          videoIds.length > 0 ? Math.floor(amountTotal / videoIds.length) : amountTotal;

        for (const videoId of videoIds) {
          await upsertCompletedPurchase({
            userId,
            videoId,
            stripeSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            amountPerVideo: perVideoAmount,
          });
        }

        console.log("✅ Purchase completed:", { userId, videoIds });
      } catch (error) {
        console.error("Error processing purchase:", error);
        return res
          .status(500)
          .json({ error: "Failed to record purchase after payment" });
      }
    }
  }

  res.json({ received: true });
};
