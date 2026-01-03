'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Crown, Calendar, Clock, CheckCircle, XCircle, Loader2, Ticket, Gift } from 'lucide-react';
import { PredictionCard } from '@/components/PredictionCard';

interface Prediction {
  id: string;
  matchName: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickOff: string;
  tip: string;
  odds: number | null;
  isPremium: boolean;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  analysis: string | null;
}

interface Subscription {
  planType: string;
  startDate: string;
  endDate: string;
}

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  // Voucher redemption state
  const [voucherCode, setVoucherCode] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [voucherSuccess, setVoucherSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [predRes, subRes] = await Promise.all([
          fetch('/api/predictions'),
          fetch('/api/subscription'),
        ]);

        const predData = await predRes.json();
        const subData = await subRes.json();

        setPredictions(predData.predictions || []);
        setSubscription(subData.subscription || null);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoucherError('');
    setVoucherSuccess('');
    setRedeemingVoucher(true);

    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to redeem voucher');
      }

      setVoucherSuccess(`🎉 ${data.message} Your ${data.subscription.planType} plan is now active!`);
      setVoucherCode('');
      
      // Refresh subscription data
      const subRes = await fetch('/api/subscription');
      const subData = await subRes.json();
      setSubscription(subData.subscription || null);
      
      // Update session to reflect new subscription
      await update({ hasActiveSubscription: true, subscriptionEnd: data.subscription.endDate });
      
    } catch (err: any) {
      setVoucherError(err.message);
    } finally {
      setRedeemingVoucher(false);
    }
  };

  const filteredPredictions = predictions.filter((pred) => {
    if (filter === 'pending') return pred.status === 'PENDING';
    if (filter === 'completed') return pred.status !== 'PENDING';
    return true;
  });

  const upcomingPredictions = filteredPredictions.filter(
    (p) => new Date(p.kickOff) > new Date()
  );
  const pastPredictions = filteredPredictions.filter(
    (p) => new Date(p.kickOff) <= new Date()
  );

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {session?.user?.name || 'User'}!
          </h1>
          <p className="text-slate-400">
            Here are your predictions for today
          </p>
        </div>

        {/* Subscription Status */}
        {subscription ? (
          <div className="mb-8 p-6 bg-gradient-to-r from-primary-600/20 to-transparent rounded-2xl border border-primary-500/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                <Crown className="text-primary-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  VIP Member
                  <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-sm rounded-full">
                    {subscription.planType}
                  </span>
                </h3>
                <p className="text-slate-400 flex items-center gap-2">
                  <Calendar size={16} />
                  Expires {format(new Date(subscription.endDate), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 space-y-4">
            {/* Voucher Redemption */}
            <div className="p-6 bg-gradient-to-r from-amber-600/10 to-transparent rounded-2xl border border-amber-500/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Gift className="text-amber-500" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Have a Voucher Code?
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Enter your code below to activate your VIP subscription instantly
                  </p>
                  
                  <form onSubmit={handleRedeemVoucher} className="flex gap-3">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Enter voucher code (e.g., DAILY-ABC123)"
                        className="w-full pl-10 pr-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={redeemingVoucher || !voucherCode}
                      className="px-6 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-600/50 rounded-lg text-white font-medium transition flex items-center gap-2"
                    >
                      {redeemingVoucher ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        'Redeem'
                      )}
                    </button>
                  </form>
                  
                  {voucherError && (
                    <p className="mt-3 text-red-400 text-sm flex items-center gap-1">
                      <XCircle size={14} />
                      {voucherError}
                    </p>
                  )}
                  {voucherSuccess && (
                    <p className="mt-3 text-green-400 text-sm flex items-center gap-1">
                      <CheckCircle size={14} />
                      {voucherSuccess}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Upgrade CTA */}
            <div className="p-6 bg-dark-100 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Don't have a voucher?
                  </h3>
                  <p className="text-slate-400">
                    Get access to all premium predictions
                  </p>
                </div>
                <button
                  onClick={() => router.push('/pricing')}
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-white font-medium transition"
                >
                  View Plans
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Upcoming' },
            { key: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-100 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Upcoming Predictions */}
        {upcomingPredictions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-primary-500" />
              Upcoming Matches
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingPredictions.map((pred) => (
                <PredictionCard
                  key={pred.id}
                  {...pred}
                  isLocked={pred.isPremium && !subscription}
                  onUnlockClick={() => router.push('/pricing')}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past Predictions */}
        {pastPredictions.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              Past Predictions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastPredictions.map((pred) => (
                <PredictionCard
                  key={pred.id}
                  {...pred}
                  isLocked={pred.isPremium && !subscription}
                  onUnlockClick={() => router.push('/pricing')}
                />
              ))}
            </div>
          </section>
        )}

        {filteredPredictions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No predictions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
