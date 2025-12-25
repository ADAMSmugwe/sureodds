'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Crown, Calendar, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

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
          <div className="mb-8 p-6 bg-dark-100 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Upgrade to VIP
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
