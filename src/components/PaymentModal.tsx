'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentModalProps {
  planType: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  amount: number;
  onClose: () => void;
}

type PaymentStatus = 'idle' | 'initiating' | 'waiting' | 'success' | 'failed';

export function PaymentModal({ planType, amount, onClose }: PaymentModalProps) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState('');
  const router = useRouter();

  // Poll for payment status
  useEffect(() => {
    if (status !== 'waiting' || !checkoutRequestId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mpesa/status?checkoutRequestId=${checkoutRequestId}`);
        const data = await res.json();

        if (data.status === 'SUCCESS') {
          setStatus('success');
          clearInterval(pollInterval);
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 2000);
        } else if (data.status === 'FAILED') {
          setStatus('failed');
          setError(data.resultDesc || 'Payment failed');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    // Stop polling after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (status === 'waiting') {
        setStatus('failed');
        setError('Payment timed out. Please try again.');
      }
    }, 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [status, checkoutRequestId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('initiating');

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, planType }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setStatus('waiting');
    } catch (err: any) {
      setStatus('failed');
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={status === 'idle' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-dark-100 rounded-2xl w-full max-w-md p-6 border border-slate-800">
        {status === 'idle' && (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Complete Payment
            </h2>
            <p className="text-slate-400 text-center mb-6">
              {planType} VIP Access - KES {amount}
            </p>

            <form onSubmit={handleSubmit}>
              <label className="block text-sm text-slate-400 mb-2">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                  type="tel"
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
                  required
                />
              </div>

              {error && (
                <p className="mt-3 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full mt-6 py-3 bg-primary-600 hover:bg-primary-500 rounded-lg font-semibold text-white transition glow-green"
              >
                Pay KES {amount}
              </button>
            </form>

            <button
              onClick={onClose}
              className="w-full mt-3 py-3 text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
          </>
        )}

        {status === 'initiating' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Initiating payment...</p>
          </div>
        )}

        {status === 'waiting' && (
          <div className="text-center py-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-primary-500/20 pulse-ring" />
              <div className="absolute inset-2 rounded-full bg-primary-500/40 pulse-ring" style={{ animationDelay: '0.5s' }} />
              <Phone className="absolute inset-0 m-auto text-primary-500" size={24} />
            </div>
            <p className="text-white text-lg font-semibold mb-2">
              Check your phone
            </p>
            <p className="text-slate-400">
              Enter your M-Pesa PIN to complete payment
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold mb-2">
              Payment Successful!
            </p>
            <p className="text-slate-400">
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold mb-2">
              Payment Failed
            </p>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => {
                setStatus('idle');
                setError('');
              }}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
