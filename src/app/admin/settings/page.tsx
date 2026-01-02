'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Loader2, 
  Save,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Settings,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [prices, setPrices] = useState({
    daily: 50,
    weekly: 250,
    monthly: 800,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchPrices();
    }
  }, [session]);

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.daily !== undefined) {
        setPrices(data);
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prices),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Prices updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update prices' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update prices' });
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition mb-4"
          >
            <ArrowLeft size={20} />
            Back to Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Settings className="text-orange-500" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Settings</h1>
              <p className="text-slate-400">Manage package prices</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Pricing Card */}
        <div className="bg-dark-100 rounded-2xl border border-slate-800 p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <DollarSign className="text-primary-500" size={24} />
            Package Prices (KES)
          </h2>

          <div className="space-y-6">
            {/* Daily Price */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Daily Package Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">KES</span>
                <input
                  type="number"
                  value={prices.daily}
                  onChange={(e) => setPrices({ ...prices, daily: parseInt(e.target.value) || 0 })}
                  className="w-full pl-14 pr-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-primary-500"
                  min="1"
                />
              </div>
              <p className="text-slate-500 text-sm mt-1">Price for 24-hour VIP access</p>
            </div>

            {/* Weekly Price */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Weekly Package Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">KES</span>
                <input
                  type="number"
                  value={prices.weekly}
                  onChange={(e) => setPrices({ ...prices, weekly: parseInt(e.target.value) || 0 })}
                  className="w-full pl-14 pr-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-primary-500"
                  min="1"
                />
              </div>
              <p className="text-slate-500 text-sm mt-1">Price for 7-day VIP access</p>
            </div>

            {/* Monthly Price */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Monthly Package Price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">KES</span>
                <input
                  type="number"
                  value={prices.monthly}
                  onChange={(e) => setPrices({ ...prices, monthly: parseInt(e.target.value) || 0 })}
                  className="w-full pl-14 pr-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-primary-500"
                  min="1"
                />
              </div>
              <p className="text-slate-500 text-sm mt-1">Price for 30-day VIP access</p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-8 py-3 bg-primary-600 hover:bg-primary-500 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {saving ? 'Saving...' : 'Save Prices'}
          </button>
        </div>

        {/* Info */}
        <p className="text-slate-500 text-sm text-center mt-6">
          Changes will be reflected immediately on the pricing page.
        </p>
      </div>
    </div>
  );
}
