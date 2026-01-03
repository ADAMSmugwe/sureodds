'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Ticket, 
  Plus, 
  Mail, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  ArrowLeft,
  Copy,
  Check,
  Send
} from 'lucide-react';

interface Voucher {
  id: string;
  code: string;
  planType: string;
  email: string;
  isRedeemed: boolean;
  redeemedBy: string | null;
  redeemedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export default function VouchersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    planType: 'DAILY',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchVouchers();
  }, [session, status, filter]);

  const fetchVouchers = async () => {
    try {
      const res = await fetch(`/api/vouchers?status=${filter}`);
      const data = await res.json();
      setVouchers(data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create voucher');
      }

      setSuccess(`Voucher ${data.code} created and sent to ${formData.email}`);
      setFormData({ email: '', planType: 'DAILY' });
      setShowForm(false);
      fetchVouchers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (voucher: Voucher) => {
    if (voucher.isRedeemed) {
      return (
        <span className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
          <CheckCircle size={12} />
          Redeemed
        </span>
      );
    }
    if (new Date(voucher.expiresAt) < new Date()) {
      return (
        <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
          <XCircle size={12} />
          Expired
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
        <Clock size={12} />
        Active
      </span>
    );
  };

  const getPlanBadge = (planType: string) => {
    const colors: Record<string, string> = {
      DAILY: 'bg-blue-500/20 text-blue-400',
      WEEKLY: 'bg-purple-500/20 text-purple-400',
      MONTHLY: 'bg-emerald-500/20 text-emerald-400',
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${colors[planType] || 'bg-slate-500/20 text-slate-400'}`}>
        {planType}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-200 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="p-2 hover:bg-slate-800 rounded-lg transition"
            >
              <ArrowLeft size={20} className="text-slate-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Ticket className="text-primary-500" />
                Voucher Management
              </h1>
              <p className="text-slate-400 text-sm mt-1">Generate and manage subscription vouchers</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-white font-medium transition"
          >
            <Plus size={18} />
            Create Voucher
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-2">
            <CheckCircle size={18} />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-2">
            <XCircle size={18} />
            {error}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="mb-8 bg-dark-100 rounded-xl border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Send size={18} className="text-primary-500" />
              Generate & Send Voucher
            </h2>
            <form onSubmit={handleCreateVoucher} className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Customer Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
                    placeholder="customer@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Plan Type</label>
                <select
                  value={formData.planType}
                  onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="DAILY">Daily (1 Day) - KES 50</option>
                  <option value="WEEKLY">Weekly (7 Days) - KES 250</option>
                  <option value="MONTHLY">Monthly (30 Days) - KES 800</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-600/50 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Generate & Send
                    </>
                  )}
                </button>
              </div>
            </form>
            <p className="text-slate-500 text-sm mt-3">
              💡 The voucher code will be automatically emailed to the customer. Code expires in 7 days.
            </p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'active', 'redeemed', 'expired'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition capitalize ${
                filter === tab
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-100 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Vouchers List */}
        <div className="bg-dark-100 rounded-xl border border-slate-800 overflow-hidden">
          {vouchers.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket className="mx-auto text-slate-600 mb-4" size={48} />
              <p className="text-slate-400">No vouchers found</p>
              <p className="text-slate-500 text-sm mt-1">Create your first voucher to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-200 border-b border-slate-800">
                  <tr>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Code</th>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Email</th>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Plan</th>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Created</th>
                    <th className="text-left px-6 py-4 text-slate-400 font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {vouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-slate-800/50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="text-primary-400 font-mono font-bold">{voucher.code}</code>
                          <button
                            onClick={() => copyCode(voucher.code)}
                            className="p-1 hover:bg-slate-700 rounded transition"
                            title="Copy code"
                          >
                            {copiedCode === voucher.code ? (
                              <Check size={14} className="text-green-400" />
                            ) : (
                              <Copy size={14} className="text-slate-500" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{voucher.email}</td>
                      <td className="px-6 py-4">{getPlanBadge(voucher.planType)}</td>
                      <td className="px-6 py-4">{getStatusBadge(voucher)}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(voucher.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-sm">
                        {new Date(voucher.expiresAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
