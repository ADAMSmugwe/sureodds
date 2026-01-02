'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Menu, X, Crown, LogOut, User, Bell, Shield } from 'lucide-react';

export function Navbar() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingBookings, setPendingBookings] = useState(0);

  // Check if user is truly an admin
  const isAdmin = session?.user?.role === 'ADMIN';

  // Fetch pending bookings count for admin only
  useEffect(() => {
    if (isAdmin) {
      const fetchPendingCount = async () => {
        try {
          const res = await fetch('/api/booking?status=PENDING');
          if (res.ok) {
            const data = await res.json();
            setPendingBookings(data.bookings?.length || 0);
          }
        } catch (error) {
          // Silently fail - user might not be admin
        }
      };

      fetchPendingCount();
      // Poll every 30 seconds for new bookings
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-200/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-500">Sure</span>
            <span className="text-2xl font-bold text-white">Odds</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-slate-300 hover:text-white transition">
              Home
            </Link>
            <Link href="/predictions" className="text-slate-300 hover:text-white transition">
              Predictions
            </Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition">
              Pricing
            </Link>
            
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-4">
                {session.user.hasActiveSubscription && (
                  <span className="flex items-center gap-1 text-yellow-500 text-sm">
                    <Crown size={16} />
                    VIP
                  </span>
                )}
                
                {/* Admin Panel - Only visible to admins */}
                {isAdmin && (
                  <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
                    <Shield size={16} className="text-orange-500" />
                    <Link 
                      href="/admin/bookings" 
                      className="relative px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 hover:bg-orange-500/20 transition flex items-center gap-2"
                    >
                      <Bell size={16} />
                      <span>Bookings</span>
                      {pendingBookings > 0 && (
                        <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                          {pendingBookings}
                        </span>
                      )}
                    </Link>
                    <Link 
                      href="/admin/settings" 
                      className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 hover:bg-orange-500/20 transition"
                    >
                      Settings
                    </Link>
                    <Link 
                      href="/admin" 
                      className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 hover:bg-orange-500/20 transition"
                    >
                      Panel
                    </Link>
                  </div>
                )}
                
                <Link href="/dashboard" className="text-slate-300 hover:text-white transition">
                  Dashboard
                </Link>
                
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  href="/login" 
                  className="text-slate-300 hover:text-white transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-600 hover:bg-primary-500 px-4 py-2 rounded-lg transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-200 border-t border-slate-800">
          <div className="px-4 py-4 space-y-4">
            <Link 
              href="/" 
              className="block text-slate-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/predictions" 
              className="block text-slate-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Predictions
            </Link>
            <Link 
              href="/pricing" 
              className="block text-slate-300 hover:text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            
            {session ? (
              <>
                <Link 
                  href="/dashboard" 
                  className="block text-slate-300 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                
                {/* Admin Section - Mobile */}
                {isAdmin && (
                  <div className="pt-4 mt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 text-orange-500 mb-3">
                      <Shield size={16} />
                      <span className="font-semibold">Admin Panel</span>
                    </div>
                    <Link 
                      href="/admin/bookings" 
                      className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 mb-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Bell size={16} />
                      <span>Bookings</span>
                      {pendingBookings > 0 && (
                        <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {pendingBookings}
                        </span>
                      )}
                    </Link>
                    <Link 
                      href="/admin/settings" 
                      className="block px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400 mb-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <Link 
                      href="/admin" 
                      className="block px-3 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-400"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Predictions Panel
                    </Link>
                  </div>
                )}
                
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 text-slate-400"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="block text-slate-300 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block bg-primary-600 text-center py-2 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
