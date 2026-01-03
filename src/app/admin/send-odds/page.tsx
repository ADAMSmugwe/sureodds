'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Send, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Users, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Clock,
  Trophy,
  Target
} from 'lucide-react';

interface OddItem {
  id: string;
  match: string;
  league: string;
  kickoff: string;
  tip: string;
  odds: string;
}

interface Subscriber {
  email: string;
  name: string | null;
  planType: string;
  endDate: string;
}

export default function SendOddsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [odds, setOdds] = useState<OddItem[]>([
    { id: '1', match: '', league: '', kickoff: '', tip: '', odds: '' }
  ]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingSubscribers, setFetchingSubscribers] = useState(true);
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
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setFetchingSubscribers(true);
      const res = await fetch('/api/odds/send');
      const data = await res.json();
      if (res.ok) {
        setSubscribers(data.subscribers || []);
        setSubscriberCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setFetchingSubscribers(false);
    }
  };

  const addOdd = () => {
    setOdds([
      ...odds,
      { id: Date.now().toString(), match: '', league: '', kickoff: '', tip: '', odds: '' }
    ]);
  };

  const removeOdd = (id: string) => {
    if (odds.length > 1) {
      setOdds(odds.filter(odd => odd.id !== id));
    }
  };

  const updateOdd = (id: string, field: keyof OddItem, value: string) => {
    setOdds(odds.map(odd => 
      odd.id === id ? { ...odd, [field]: value } : odd
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate odds
    const validOdds = odds.filter(odd => odd.match && odd.tip);
    if (validOdds.length === 0) {
      setResult({ type: 'error', message: 'Please add at least one valid prediction with match and tip' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/odds/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          odds: validOdds,
          title,
          message,
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
        // Clear form on success
        if (data.sent > 0) {
          setOdds([{ id: '1', match: '', league: '', kickoff: '', tip: '', odds: '' }]);
          setTitle('');
          setMessage('');
        }
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to send odds' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
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
            <h1 className="text-3xl font-bold text-white">Send Daily Odds</h1>
            <p className="text-slate-400">Send today's predictions to all active subscribers</p>
          </div>
        </div>

        {/* Subscriber Count Card */}
        <div className="bg-gradient-to-r from-primary-600/20 to-amber-600/20 border border-primary-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <Users className="text-primary-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Active Subscribers</h3>
                <p className="text-slate-400 text-sm">These users will receive the odds</p>
              </div>
            </div>
            <div className="text-right">
              {fetchingSubscribers ? (
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              ) : (
                <>
                  <div className="text-4xl font-bold text-primary-400">{subscriberCount}</div>
                  <button
                    onClick={fetchSubscribers}
                    className="text-xs text-slate-400 hover:text-primary-400 transition"
                  >
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

          {/* Odds Input */}
          <div className="bg-dark-100 rounded-xl border border-slate-800 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Target className="text-primary-500" size={20} />
                Today's Predictions
              </h2>
              <button
                type="button"
                onClick={addOdd}
                className="flex items-center gap-2 px-3 py-2 bg-primary-600/20 hover:bg-primary-600/30 text-primary-400 rounded-lg transition text-sm"
              >
                <Plus size={16} />
                Add Match
              </button>
            </div>

            <div className="space-y-4">
              {odds.map((odd, index) => (
                <div 
                  key={odd.id}
                  className="p-4 bg-dark-200 rounded-xl border border-slate-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-400">Match #{index + 1}</span>
                    {odds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOdd(odd.id)}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={odd.match}
                      onChange={(e) => updateOdd(odd.id, 'match', e.target.value)}
                      placeholder="Match (e.g., Arsenal vs Liverpool)"
                      className="w-full px-3 py-2 bg-dark-100 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-primary-500 transition text-sm"
                      required
                    />
                    <input
                      type="text"
                      value={odd.league}
                      onChange={(e) => updateOdd(odd.id, 'league', e.target.value)}
                      placeholder="League (e.g., Premier League)"
                      className="w-full px-3 py-2 bg-dark-100 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-primary-500 transition text-sm"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input
                        type="text"
                        value={odd.kickoff}
                        onChange={(e) => updateOdd(odd.id, 'kickoff', e.target.value)}
                        placeholder="Kickoff (e.g., 20:00)"
                        className="w-full pl-9 pr-3 py-2 bg-dark-100 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-primary-500 transition text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={odd.tip}
                      onChange={(e) => updateOdd(odd.id, 'tip', e.target.value)}
                      placeholder="Tip (e.g., Home Win)"
                      className="w-full px-3 py-2 bg-dark-100 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-primary-500 transition text-sm"
                      required
                    />
                    <input
                      type="text"
                      value={odd.odds}
                      onChange={(e) => updateOdd(odd.id, 'odds', e.target.value)}
                      placeholder="Odds (e.g., 1.85)"
                      className="w-full px-3 py-2 bg-dark-100 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-primary-500 transition text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || subscriberCount === 0}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-primary-600 to-amber-600 hover:from-primary-500 hover:to-amber-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Sending to {subscriberCount} subscriber(s)...
              </>
            ) : (
              <>
                <Send size={24} />
                Send to {subscriberCount} Active Subscriber{subscriberCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
          
          {subscriberCount === 0 && !fetchingSubscribers && (
            <p className="text-center text-slate-400 mt-3 text-sm">
              No active subscribers found. Create vouchers or wait for subscriptions.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
