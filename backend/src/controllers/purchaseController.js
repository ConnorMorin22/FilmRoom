const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;
const Purchase = require("../models/Purchase");
const Video = require("../models/Video");
const User = require("../models/User");

// @desc    Create Stripe checkout session (or demo purchase)
// @route   POST /api/purchases/create-checkout
exports.createCheckout = async (req, res) => {
  try {
    const { videoId } = req.body;
    if (videoId == null || String(videoId).trim() === "") {
      return res.status(400).json({ error: "videoId is required" });
    }
    const userId = req.user._id;

    // Get video details
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({
      user: userId,
      video: videoId,
    });

    if (existingPurchase) {
      return res.status(400).json({ error: "You already own this video" });
    }

    // DEMO MODE: If Stripe not configured, create purchase directly
    if (!stripe) {
      console.log("🎬 DEMO MODE: Creating purchase without Stripe");

      // Create purchase record
      const purchase = await Purchase.create({
        user: userId,
        video: videoId,
        amount: video.price * 100, // convert to cents
        status: "completed",
      });

      // Add video to user's purchased videos
      await User.findByIdAndUpdate(userId, {
        $addToSet: { purchasedVideos: videoId },
      });

      return res.json({
        success: true,
        demo: true,
        message: "Demo purchase completed",
        purchase: purchase,
      });
    }

    // PRODUCTION MODE: Create Stripe checkout session
    const frontendUrl =
      process.env.FRONTEND_URL?.trim() ||
      (process.env.NODE_ENV === "production"
        ? "https://lacrossefilmroom.com"
        : "http://localhost:5173");
    const thumbnailUrl = video.thumbnail_url || video.thumbnail;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: video.title,
              description: video.description,
              images: thumbnailUrl ? [thumbnailUrl] : [],
            },
            unit_amount: video.price * 100, // in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId.toString(),
        videoId: videoId.toString(),
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
    const videoId = session.metadata?.videoId;

    if (!userId || !videoId) {
      console.error(
        "Stripe webhook: checkout.session.completed missing userId or videoId",
        { sessionId: session.id, metadata: session.metadata }
      );
    } else {
      try {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        const existing = await Purchase.findOne({
          stripeSessionId: session.id,
        });

        if (existing) {
          await User.findByIdAndUpdate(userId, {
            $addToSet: { purchasedVideos: videoId },
          });
        } else {
          try {
            await Purchase.create({
              user: userId,
              video: videoId,
              stripeSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              amount: session.amount_total,
              status: "completed",
            });
          } catch (createErr) {
            if (createErr.code === 11000) {
              console.warn(
                "Purchase idempotent skip (duplicate key):",
                createErr.keyPattern || createErr.message
              );
            } else {
              throw createErr;
            }
          }

          await User.findByIdAndUpdate(userId, {
            $addToSet: { purchasedVideos: videoId },
          });
        }

        console.log("✅ Purchase completed:", { userId, videoId });
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
