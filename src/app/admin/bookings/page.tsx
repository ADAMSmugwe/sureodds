'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  Loader2, 
  CheckCircle, 
  Clock, 
  Phone,
  Mail,
  MessageCircle,
  Send,
  RefreshCw,
  User,
  Package,
  AlertCircle,
  XCircle,
  Calendar,
  Users,
  TrendingUp,
  Timer
} from 'lucide-react';

interface Booking {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  packageName: string;
  packagePrice: number;
  status: 'PENDING' | 'CONTACTED' | 'CONVERTED' | 'CANCELLED';
  notes: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  reminderSent: boolean;
  createdAt: string;
}

const statusColors = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  CONTACTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONVERTED: 'bg-green-500/20 text-green-400 border-green-500/30',
  CANCELLED: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusIcons = {
  PENDING: Clock,
  CONTACTED: Phone,
  CONVERTED: CheckCircle,
  CANCELLED: XCircle,
};

// WhatsApp number
const WHATSAPP_NUMBER = '13215127089';

export default function AdminBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchBookings();
      // Auto-refresh every 15 seconds to catch new bookings
      const interval = setInterval(() => {
        fetchBookings(true);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [session, filter]);

  const fetchBookings = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const url = filter === 'all' ? '/api/booking' : `/api/booking?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setBookings(data.bookings || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string, sendEmail: boolean = false) => {
    setProcessingId(bookingId);
    try {
      const res = await fetch(`/api/booking/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, sendEmail }),
      });

      if (res.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error('Failed to update booking:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const confirmPayment = async (booking: Booking) => {
    // Update status to CONVERTED and send confirmation email
    await updateBookingStatus(booking.id, 'CONVERTED', true);
  };

  const openWhatsAppToSendOdds = (booking: Booking) => {
    const message = `Hi ${booking.fullName}! 🎉

Thank you for your payment for the ${booking.packageName} VIP Package!

Your subscription is now ACTIVE! ✅

Here are today's VIP predictions:

[PASTE YOUR ODDS HERE]

Good luck and happy betting! 🍀

- SureOdds Analytics Team`;

    window.open(
      `https://wa.me/${booking.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  const formatPackageName = (name: string) => name.charAt(0) + name.slice(1).toLowerCase();

  // Calculate expiration status
  const getExpiryStatus = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const hoursLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft <= 0) {
      return { text: 'Expired', color: 'text-red-400 bg-red-500/20', hours: hoursLeft };
    } else if (hoursLeft <= 6) {
      return { text: `Expires in ${hoursLeft}h`, color: 'text-orange-400 bg-orange-500/20', hours: hoursLeft };
    } else if (hoursLeft <= 24) {
      return { text: `Expires in ${hoursLeft}h`, color: 'text-yellow-400 bg-yellow-500/20', hours: hoursLeft };
    } else {
      const daysLeft = Math.ceil(hoursLeft / 24);
      return { text: `${daysLeft} days left`, color: 'text-green-400 bg-green-500/20', hours: hoursLeft };
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== 'ADMIN') {
    return null;
  }

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const convertedCount = bookings.filter(b => b.status === 'CONVERTED').length;
  const contactedCount = bookings.filter(b => b.status === 'CONTACTED').length;
  const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length;
  
  // Calculate active subscriptions (converted and not expired)
  const now = new Date();
  const activeSubscriptions = bookings.filter(b => {
    if (b.status !== 'CONVERTED' || !b.expiresAt) return false;
    return new Date(b.expiresAt) > now;
  }).length;
  
  const expiredSubscriptions = bookings.filter(b => {
    if (b.status !== 'CONVERTED' || !b.expiresAt) return false;
    return new Date(b.expiresAt) <= now;
  }).length;
  
  // Total revenue (only from converted)
  const totalRevenue = bookings
    .filter(b => b.status === 'CONVERTED')
    .reduce((sum, b) => sum + b.packagePrice, 0);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              Bookings Management
              {pendingCount > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-sm rounded-full animate-pulse">
                  {pendingCount} New
                </span>
              )}
            </h1>
            <p className="text-slate-400 mt-1">
              {pendingCount} pending • {convertedCount} converted • Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchBookings(false)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
              title="Refresh now"
            >
              <RefreshCw size={20} />
            </button>
            
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            >
              <option value="all">All Bookings</option>
              <option value="PENDING">Pending</option>
              <option value="CONTACTED">Contacted</option>
              <option value="CONVERTED">Converted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-100 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-500" size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Revenue</p>
                <p className="text-white font-bold text-xl">KES {totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-100 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Users className="text-blue-500" size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Bookings</p>
                <p className="text-white font-bold text-xl">{bookings.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-100 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-primary-500" size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Active Subs</p>
                <p className="text-white font-bold text-xl">{activeSubscriptions}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-dark-100 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Timer className="text-red-500" size={20} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Expired</p>
                <p className="text-white font-bold text-xl">{expiredSubscriptions}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const StatusIcon = statusIcons[booking.status];
              const isProcessing = processingId === booking.id;

              return (
                <div
                  key={booking.id}
                  className="bg-dark-100 rounded-xl border border-slate-800 p-6"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                          <User className="text-slate-400" size={20} />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{booking.fullName}</h3>
                          <p className="text-slate-400 text-sm">
                            {format(new Date(booking.createdAt), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Mail size={16} className="text-slate-500" />
                          <span className="text-sm truncate">{booking.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Phone size={16} className="text-slate-500" />
                          <span className="text-sm">{booking.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-primary-500" />
                          <span className="text-primary-500 font-semibold">
                            {formatPackageName(booking.packageName)} - KES {booking.packagePrice}
                          </span>
                        </div>
                      </div>
                      
                      {/* Subscription Status for Converted */}
                      {booking.status === 'CONVERTED' && booking.expiresAt && (
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          {(() => {
                            const expiryStatus = getExpiryStatus(booking.expiresAt);
                            return (
                              <>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${expiryStatus?.color}`}>
                                  <Timer size={12} />
                                  {expiryStatus?.text}
                                </span>
                                <span className="text-slate-500 text-xs">
                                  Activated: {format(new Date(booking.activatedAt!), 'MMM d, h:mm a')}
                                </span>
                                <span className="text-slate-500 text-xs">
                                  Expires: {format(new Date(booking.expiresAt), 'MMM d, h:mm a')}
                                </span>
                                {booking.reminderSent && (
                                  <span className="text-orange-400 text-xs flex items-center gap-1">
                                    <Mail size={12} />
                                    Reminder sent
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm ${statusColors[booking.status]}`}>
                        <StatusIcon size={14} />
                        {booking.status}
                      </span>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {booking.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'CONTACTED')}
                              disabled={isProcessing}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium transition disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Mark Contacted'}
                            </button>
                            <button
                              onClick={() => confirmPayment(booking)}
                              disabled={isProcessing}
                              className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition disabled:opacity-50"
                            >
                              {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Payment'}
                            </button>
                          </>
                        )}

                        {booking.status === 'CONTACTED' && (
                          <button
                            onClick={() => confirmPayment(booking)}
                            disabled={isProcessing}
                            className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Payment'}
                          </button>
                        )}

                        {booking.status === 'CONVERTED' && (
                          <button
                            onClick={() => openWhatsAppToSendOdds(booking)}
                            className="px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition flex items-center gap-2"
                          >
                            <MessageCircle size={16} />
                            Send Odds
                          </button>
                        )}

                        {/* WhatsApp Quick Contact */}
                        <a
                          href={`https://wa.me/${booking.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-green-500 transition"
                          title="Open WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </a>

                        {/* Email Quick Contact */}
                        <a
                          href={`mailto:${booking.email}`}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-blue-400 transition"
                          title="Send Email"
                        >
                          <Mail size={18} />
                        </a>

                        {booking.status !== 'CANCELLED' && booking.status !== 'CONVERTED' && (
                          <button
                            onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                            disabled={isProcessing}
                            className="p-2 bg-slate-800 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition"
                            title="Cancel Booking"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
