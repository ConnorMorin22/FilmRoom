const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;
const Purchase = require("../models/Purchase");
const Video = require("../models/Video");
const User = require("../models/User");

// @desc    Create Stripe checkout session
// @route   POST /api/purchases/create-checkout
exports.createCheckout = async (req, res) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res
        .status(503)
        .json({ error: "Payment processing not configured yet" });
    }

    const { videoId } = req.body;
    const userId = req.user._id;

    // Check if already purchased
    const existingPurchase = await Purchase.findOne({
      user: userId,
      video: videoId,
    });

    if (existingPurchase) {
      return res.status(400).json({ error: "You already own this video" });
    }

    // Get video details
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Create Stripe checkout session
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
              images: [video.thumbnail],
            },
            unit_amount: video.price, // in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId.toString(),
        videoId: videoId.toString(),
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/video/${videoId}`,
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Error creating checkout session" });
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/purchases/webhook
exports.stripeWebhook = async (req, res) => {
  // Check if Stripe is configured
  if (!stripe) {
    return res
      .status(503)
      .json({ error: "Payment processing not configured yet" });
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
    const { userId, videoId } = session.metadata;

    try {
      // Create purchase record
      await Purchase.create({
        user: userId,
        video: videoId,
        stripeSessionId: session.id,
        amount: session.amount_total,
        status: "completed",
      });

      // Add video to user's purchased videos
      await User.findByIdAndUpdate(userId, {
        $addToSet: { purchasedVideos: videoId },
      });

      console.log("✅ Purchase completed:", { userId, videoId });
    } catch (error) {
      console.error("Error processing purchase:", error);
    }
  }

  res.json({ received: true });
};
