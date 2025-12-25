'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';

interface Prediction {
  id: string;
  matchName: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickOff: string;
  tip: string;
  odds: number;
  isPremium: boolean;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  analysis: string | null;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    league: '',
    kickOff: '',
    tip: '',
    odds: '',
    isPremium: false,
    analysis: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session.user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchPredictions();
  }, []);

  async function fetchPredictions() {
    try {
      const res = await fetch('/api/predictions');
      const data = await res.json();
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.homeTeam || !formData.awayTeam || !formData.league || 
        !formData.kickOff || !formData.tip || !formData.odds) {
      alert('Please fill in all required fields');
      return;
    }

    const oddsValue = parseFloat(formData.odds);
    if (isNaN(oddsValue) || oddsValue <= 0) {
      alert('Please enter valid odds');
      return;
    }

    const payload = {
      matchName: `${formData.homeTeam} vs ${formData.awayTeam}`,
      homeTeam: formData.homeTeam,
      awayTeam: formData.awayTeam,
      league: formData.league,
      kickOff: formData.kickOff,
      tip: formData.tip,
      odds: oddsValue,
      isPremium: formData.isPremium,
      analysis: formData.analysis || null,
    };

    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          homeTeam: '',
          awayTeam: '',
          league: '',
          kickOff: '',
          tip: '',
          odds: '',
          isPremium: false,
          analysis: '',
        });
        fetchPredictions();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create prediction');
      }
    } catch (error) {
      console.error('Failed to create prediction:', error);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/predictions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchPredictions();
      }
    } catch (error) {
      console.error('Failed to update prediction:', error);
    }
  }

  async function deletePrediction(id: string) {
    if (!confirm('Are you sure you want to delete this prediction?')) return;

    try {
      const res = await fetch(`/api/predictions/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchPredictions();
      }
    } catch (error) {
      console.error('Failed to delete prediction:', error);
    }
  }

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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400">Manage predictions and view stats</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-white transition"
          >
            <Plus size={20} />
            Add Prediction
          </button>
        </div>

        {/* Add Prediction Form */}
        {showForm && (
          <div className="mb-8 bg-dark-100 rounded-xl border border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">New Prediction</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Home Team</label>
                <input
                  type="text"
                  value={formData.homeTeam}
                  onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Away Team</label>
                <input
                  type="text"
                  value={formData.awayTeam}
                  onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">League</label>
                <input
                  type="text"
                  value={formData.league}
                  onChange={(e) => setFormData({ ...formData, league: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g., English Premier League"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Kick Off</label>
                <input
                  type="datetime-local"
                  value={formData.kickOff}
                  onChange={(e) => setFormData({ ...formData, kickOff: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Tip</label>
                <input
                  type="text"
                  value={formData.tip}
                  onChange={(e) => setFormData({ ...formData, tip: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-slate-700 rounded-lg text-white"
                  placeholder="e.g., Home Win & Over 1.5"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Odds</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.odds}
                  onChange={(e) => setFormData({ ...formData, odds: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-slate-700 rounded-lg text-white"
                  placeholder="1.85"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-slate-400 mb-2">Analysis (optional)</label>
                <textarea
                  value={formData.analysis}
                  onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-200 border border-slate-700 rounded-lg text-white"
                  rows={3}
                  placeholder="Why did you pick this?"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPremium}
                    onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-dark-200 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-white">Premium (VIP Only)</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-white font-medium transition"
                >
                  Create Prediction
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Predictions Table */}
        <div className="bg-dark-100 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Match</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Tip</th>
                  <th className="px-6 py-4 text-left text-sm text-slate-400">Kick Off</th>
                  <th className="px-6 py-4 text-center text-sm text-slate-400">Type</th>
                  <th className="px-6 py-4 text-center text-sm text-slate-400">Status</th>
                  <th className="px-6 py-4 text-center text-sm text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {predictions.map((pred) => (
                  <tr key={pred.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{pred.matchName}</p>
                      <p className="text-sm text-slate-500">{pred.league}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-300">{pred.tip}</p>
                      <p className="text-sm text-slate-500">@ {pred.odds}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {format(new Date(pred.kickOff), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {pred.isPremium ? (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">
                          VIP
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full">
                          Free
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={pred.status}
                        onChange={(e) => updateStatus(pred.id, e.target.value)}
                        className="px-2 py-1 bg-dark-200 border border-slate-700 rounded text-sm text-white"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="WON">Won</option>
                        <option value="LOST">Lost</option>
                        <option value="VOID">Void</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => deletePrediction(pred.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {predictions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400">No predictions yet. Add your first one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
