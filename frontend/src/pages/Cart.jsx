import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { CartItem } from "@/api/entities";
import { Purchase } from "@/api/entities";
import { Video } from "@/api/entities";
import { User } from "@/api/entities";
import { Trash2, CreditCard, ShoppingBag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadCart = useCallback(async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const items = await CartItem.filter({ user_email: currentUser.email });
      const videosPromises = items.map((item) =>
        Video.filter({ id: item.video_id }).then((videos) => ({
          cartItem: item,
          video: videos[0],
        }))
      );

      const cartWithVideos = await Promise.all(videosPromises);
      const filteredCart = cartWithVideos.filter((item) => item.video);
      setCartItems(filteredCart);

      console.log("Cart items loaded:", filteredCart);
    } catch (error) {
      navigate(createPageUrl("Home"));
    }
    setIsLoading(false);
  }, [navigate]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const removeFromCart = async (cartItemId) => {
    await CartItem.delete(cartItemId);
    setCartItems(cartItems.filter((item) => item.cartItem.id !== cartItemId));
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.video.price, 0);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setIsProcessing(true);

    try {
      // Process each video purchase through your backend
      for (const item of cartItems) {
        const data = await Purchase.create({ video_id: item.video.id });
        if (data?.url) {
          window.location.href = data.url;
          return;
        }
      }

      // Clear cart after successful purchases
      const deletePromises = cartItems.map((item) =>
        CartItem.delete(item.cartItem.id)
      );
      await Promise.all(deletePromises);

      // Redirect to library
      navigate(createPageUrl("Library"));
    } catch (error) {
      console.error("Checkout error:", error);
      if (error.response?.status === 401) {
        alert("Please log in to complete your purchase");
        navigate(createPageUrl("Login"));
        return;
      }
      alert(
        error.message ||
          "There was an error processing your purchase. Please try again."
      );
    }

    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-slate-900">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 text-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Videos"))}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold">Your Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="text-center py-16">
              <ShoppingBag className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Your cart is empty
              </h2>
              <p className="text-slate-400 mb-6">
                Add some training videos to get started
              </p>
              <Button
                onClick={() => navigate(createPageUrl("Videos"))}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Browse Videos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map(({ cartItem, video }) => (
                <Card
                  key={cartItem.id}
                  className="bg-slate-800 border-slate-700"
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img
                        src={
                          video.thumbnail_url ||
                          `https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=150&h=100&fit=crop`
                        }
                        alt={video.title}
                        className="w-24 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold mb-1">
                          {video.title}
                        </h3>
                        <p className="text-slate-400 text-sm mb-2">
                          by {video.instructor_name}
                        </p>
                        <p className="text-slate-300 text-sm line-clamp-2">
                          {video.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold mb-2">
                          ${video.price}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(cartItem.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="bg-slate-800 border-slate-700 sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal ({cartItems.length} items)</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Processing Fee</span>
                      <span>$0.00</span>
                    </div>
                  </div>

                  <Separator className="bg-slate-700" />

                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white py-6 text-lg"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Processing...
                      </div>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Complete Purchase
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-slate-400 text-center">
                    * Stripe checkout opens in a new secure payment session.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
