'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Send, 
  ArrowLeft, 
  Users, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Clock,
  Trophy,
  Target,
  CheckSquare,
  Square,
  RefreshCw,
  Gift,
  Crown
} from 'lucide-react';

interface VipPrediction {
  id: string;
  match: string;
  league: string;
  kickoff: string;
  kickoffDate: string;
  tip: string;
  odds: string;
  status: string;
}

interface Subscriber {
  email: string;
  name: string | null;
  planType?: string;
  endDate?: string;
}

type SendType = 'free' | 'vip';

export default function SendOddsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [sendType, setSendType] = useState<SendType>('vip');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [predictions, setPredictions] = useState<VipPrediction[]>([]);
  const [selectedPredictions, setSelectedPredictions] = useState<Set<string>>(new Set());
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [result, setResult] = useState<{
    type: 'success' | 'error';
    message: string;
    sent?: number;
    failed?: number;
  } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchData();
  }, [sendType]);

  const fetchData = async () => {
    try {
      setFetchingData(true);
      const res = await fetch(`/api/odds/send?type=${sendType}`);
      const data = await res.json();
      if (res.ok) {
        setSubscribers(data.subscribers || []);
        setSubscriberCount(data.count || 0);
        setPredictions(data.predictions || []);
        // Auto-select all pending predictions
        const pendingIds = (data.predictions || [])
          .filter((p: VipPrediction) => p.status === 'PENDING')
          .map((p: VipPrediction) => p.id);
        setSelectedPredictions(new Set(pendingIds));
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setFetchingData(false);
    }
  };

  const togglePrediction = (id: string) => {
    const newSelected = new Set(selectedPredictions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPredictions(newSelected);
  };

  const selectAll = () => {
    const allIds = predictions.map(p => p.id);
    setSelectedPredictions(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedPredictions(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get selected predictions
    const selectedOdds = predictions
      .filter(p => selectedPredictions.has(p.id))
      .map(p => ({
        match: p.match,
        league: p.league,
        kickoff: p.kickoff,
        tip: p.tip,
        odds: p.odds,
      }));

    if (selectedOdds.length === 0) {
      setResult({ type: 'error', message: 'Please select at least one prediction to send' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/odds/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odds: selectedOdds,
          title,
          message,
          sendType,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          type: 'success',
          message: data.message,
          sent: data.sent,
          failed: data.failed,
        });
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send odds' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (status === 'loading' || (session?.user?.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/admin"
            className="p-2 bg-dark-100 rounded-lg hover:bg-dark-200 transition"
          >
            <ArrowLeft size={20} className="text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Send Predictions</h1>
            <p className="text-slate-400">Send free picks to all users or VIP odds to subscribers</p>
          </div>
        </div>

        {/* Send Type Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSendType('free')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition ${
              sendType === 'free'
                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                : 'bg-dark-100 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <Gift size={24} />
            <div className="text-left">
              <div className="font-semibold">Free Picks</div>
              <div className="text-xs opacity-80">Send to ALL users</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setSendType('vip')}
            className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl border-2 transition ${
              sendType === 'vip'
                ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                : 'bg-dark-100 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <Crown size={24} />
            <div className="text-left">
              <div className="font-semibold">VIP Odds</div>
              <div className="text-xs opacity-80">Paid subscribers only</div>
            </div>
          </button>
        </div>

        {/* Subscriber Count Card */}
        <div className={`rounded-xl p-6 mb-8 border ${
          sendType === 'free' 
            ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border-blue-500/30'
            : 'bg-gradient-to-r from-primary-600/20 to-amber-600/20 border-primary-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                sendType === 'free' ? 'bg-blue-500/20' : 'bg-primary-500/20'
              }`}>
                <Users className={sendType === 'free' ? 'text-blue-400' : 'text-primary-400'} size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {sendType === 'free' ? 'All Users' : 'Active Subscribers'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {sendType === 'free' 
                    ? 'Everyone with an email in the database' 
                    : 'Users with active paid subscriptions'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {fetchingData ? (
                <Loader2 className={`w-6 h-6 animate-spin ${sendType === 'free' ? 'text-blue-500' : 'text-primary-500'}`} />
              ) : (
                <>
                  <div className={`text-4xl font-bold ${sendType === 'free' ? 'text-blue-400' : 'text-primary-400'}`}>
                    {subscriberCount}
                  </div>
                  <button
                    onClick={fetchData}
                    className={`text-xs hover:${sendType === 'free' ? 'text-blue-400' : 'text-primary-400'} text-slate-400 transition flex items-center gap-1`}
                  >
                    <RefreshCw size={12} />
                    Refresh
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Subscriber Preview */}
          {subscribers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Preview recipients:</p>
              <div className="flex flex-wrap gap-2">
                {subscribers.slice(0, 5).map((sub, idx) => (
                  <span key={idx} className="px-3 py-1 bg-dark-200 rounded-full text-xs text-slate-300">
                    {sub.name || sub.email}
                  </span>
                ))}
                {subscribers.length > 5 && (
                  <span className="px-3 py-1 bg-dark-200 rounded-full text-xs text-slate-400">
                    +{subscribers.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Result Alert */}
        {result && (
          <div className={`mb-6 p-4 rounded-xl border ${
            result.type === 'success' 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-3">
              {result.type === 'success' ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <AlertCircle className="text-red-500" size={24} />
              )}
              <div>
                <p className={result.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                  {result.message}
                </p>
                {result.sent !== undefined && result.sent > 0 && (
                  <p className="text-sm text-slate-400 mt-1">
                    Sent to {result.sent} subscriber(s)
                    {result.failed && result.failed > 0 && `, ${result.failed} failed`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Header */}
          <div className="bg-dark-100 rounded-xl border border-slate-800 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="text-amber-500" size={20} />
              Email Header (Optional)
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Custom Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Today's VIP Predictions - ${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`}
                  className="w-full px-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Additional Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any additional notes or message for subscribers..."
                  rows={2}
                  className="w-full px-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* VIP Predictions Selection */}
          <div className="bg-dark-100 rounded-xl border border-slate-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className={sendType === 'free' ? 'text-blue-500' : 'text-primary-500'} size={20} />
                {sendType === 'free' ? 'Free Predictions' : 'VIP Predictions'}
                <span className="text-sm font-normal text-slate-400">
                  ({selectedPredictions.size} selected)
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className={`px-3 py-1.5 text-xs rounded-lg transition ${
                    sendType === 'free' 
                      ? 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'
                      : 'bg-primary-600/20 hover:bg-primary-600/30 text-primary-400'
                  }`}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-400 rounded-lg transition"
                >
                  Deselect All
                </button>
                <button
                  type="button"
                  onClick={fetchData}
                  className="p-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-400 rounded-lg transition"
                  title="Refresh predictions"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {fetchingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className={`w-8 h-8 animate-spin ${sendType === 'free' ? 'text-blue-500' : 'text-primary-500'}`} />
              </div>
            ) : predictions.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 mb-2">
                  No {sendType === 'free' ? 'free' : 'VIP'} predictions found
                </p>
                <p className="text-slate-500 text-sm mb-4">
                  {sendType === 'free' 
                    ? 'Create free predictions in the Admin Panel first (non-premium predictions)'
                    : 'Create VIP predictions in the Admin Panel first (mark them as Premium/VIP)'}
                </p>
                <Link
                  href="/admin"
                  className={`inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition text-sm ${
                    sendType === 'free' 
                      ? 'bg-blue-600 hover:bg-blue-500'
                      : 'bg-primary-600 hover:bg-primary-500'
                  }`}
                >
                  Go to Admin Panel
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {predictions.map((prediction) => (
                  <div 
                    key={prediction.id}
                    onClick={() => togglePrediction(prediction.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedPredictions.has(prediction.id)
                        ? sendType === 'free'
                          ? 'bg-blue-600/10 border-blue-500/50'
                          : 'bg-primary-600/10 border-primary-500/50'
                        : 'bg-dark-200 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {selectedPredictions.has(prediction.id) ? (
                          <CheckSquare className={sendType === 'free' ? 'text-blue-500' : 'text-primary-500'} size={20} />
                        ) : (
                          <Square className="text-slate-500" size={20} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">
                            {prediction.match}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            prediction.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                            prediction.status === 'WON' ? 'bg-green-500/20 text-green-400' :
                            prediction.status === 'LOST' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {prediction.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <span className="text-slate-400">{prediction.league}</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock size={12} />
                            {formatDate(prediction.kickoffDate)} • {prediction.kickoff}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            sendType === 'free'
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'bg-primary-600/20 text-primary-400'
                          }`}>
                            {prediction.tip}
                          </span>
                          {prediction.odds && (
                            <span className="text-amber-400 font-semibold">
                              @ {prediction.odds}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || subscriberCount === 0 || selectedPredictions.size === 0}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-lg ${
              sendType === 'free'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                : 'bg-gradient-to-r from-primary-600 to-amber-600 hover:from-primary-500 hover:to-amber-500'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Sending to {subscriberCount} {sendType === 'free' ? 'user' : 'subscriber'}(s)...
              </>
            ) : (
              <>
                <Send size={24} />
                Send {selectedPredictions.size} {sendType === 'free' ? 'Free Pick' : 'VIP Prediction'}{selectedPredictions.size !== 1 ? 's' : ''} to {subscriberCount} {sendType === 'free' ? 'User' : 'Subscriber'}{subscriberCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
          
          {subscriberCount === 0 && !fetchingData && (
            <p className="text-center text-slate-400 mt-3 text-sm">
              {sendType === 'free' 
                ? 'No users found in the database.'
                : 'No active subscribers found. Create vouchers or wait for subscriptions.'}
            </p>
          )}
          
          {selectedPredictions.size === 0 && predictions.length > 0 && (
            <p className="text-center text-slate-400 mt-3 text-sm">
              Select at least one prediction to send.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
