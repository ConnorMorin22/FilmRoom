

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { CartItem } from "@/api/entities";
import { 
  Home, 
  Play, 
  ShoppingCart, 
  Library, 
  Shield, 
  LogIn, 
  LogOut, 
  User as UserIcon,
  Settings,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Load cart count
      const cartItems = await CartItem.filter({ user_email: currentUser.email });
      setCartCount(cartItems.length);
    } catch (error) {
      // User not logged in
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    await User.loginWithRedirect(window.location.origin);
  };

  const handleLogout = async () => {
    await User.logout();
    setUser(null);
    setCartCount(0);
  };

  const navItems = [
    { name: "Home", url: createPageUrl("Home"), icon: Home },
    { name: "Videos", url: createPageUrl("Videos"), icon: Play },
  ];

  if (!isLoading && !user) {
    // Guest layout
    return (
      <div className="min-h-screen bg-slate-900">
        <style>{`
          :root {
            --primary: #00d4ff;
            --gold: #ffd700;
            --navy: #1a1d29;
          }
        `}</style>
        
        <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to={createPageUrl("Home")} className="flex items-center gap-3">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ceb51190f2a080ada61530/92600820c_FilmRoom-01.png"
                  alt="FilmRoom"
                  className="h-16 w-auto"
                />
              </Link>
              
              <nav className="flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.url}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === item.url
                        ? "bg-blue-500/20 text-blue-400"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                ))}
                
                <Button
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white border-0"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </nav>
            </div>
          </div>
        </header>

        <main className="flex-1">
          {children}
        </main>

        <footer className="bg-slate-800 border-t border-slate-700">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-slate-400">© 2024 FilmRoom. Elite lacrosse training platform.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Authenticated user layout
  return (
    <div className="min-h-screen bg-slate-900">
      <style>{`
        :root {
          --primary: #00d4ff;
          --gold: #ffd700;
          --navy: #1a1d29;
        }
      `}</style>
      
      <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68ceb51190f2a080ada61530/92600820c_FilmRoom-01.png"
                alt="FilmRoom"
                className="h-16 w-auto"
              />
            </Link>
            
            <nav className="flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.url}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === item.url
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              ))}
              
              <Link
                to={createPageUrl("Cart")}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === createPageUrl("Cart")
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 min-w-[1.25rem] h-5">
                    {cartCount}
                  </Badge>
                )}
              </Link>
              
              <Link
                to={createPageUrl("Library")}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === createPageUrl("Library")
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Library className="w-4 h-4" />
                <span className="hidden sm:inline">Library</span>
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to={createPageUrl("Admin")}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === createPageUrl("Admin")
                      ? "bg-gold/20 text-yellow-400"
                      : "text-slate-300 hover:text-yellow-400 hover:bg-yellow-500/10"
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700/50">
                    <UserIcon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline max-w-24 truncate">{user?.full_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                  <DropdownMenuItem className="text-slate-300">
                    <UserIcon className="w-4 h-4 mr-2" />
                    {user?.full_name}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem onClick={handleLogout} className="text-slate-300 hover:text-white">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-slate-800 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-slate-400">© 2024 FilmRoom. Elite lacrosse training platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

