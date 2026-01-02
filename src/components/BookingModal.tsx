'use client';

import { useState } from 'react';
import { User, Mail, Phone, Loader2, CheckCircle, AlertCircle, X, MessageCircle, Copy, Send } from 'lucide-react';

interface BookingModalProps {
  packageName: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  packagePrice: number;
  onClose: () => void;
}

type BookingStatus = 'idle' | 'submitting' | 'success' | 'error';

// WhatsApp number for receiving payment confirmations
const WHATSAPP_NUMBER = '13215127089';

export function BookingModal({ packageName, packagePrice, onClose }: BookingModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<BookingStatus>('idle');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('submitting');

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          packageName,
          packagePrice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking');
      }

      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError(err.message);
    }
  };

  const formatPackageName = (name: string) => {
    return name.charAt(0) + name.slice(1).toLowerCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={status === 'idle' || status === 'error' ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-dark-100 rounded-2xl w-full max-w-md p-6 border border-slate-800">
        {/* Close button */}
        {(status === 'idle' || status === 'error') && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        )}

        {/* Form State */}
        {(status === 'idle' || status === 'error') && (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Book These Odds
            </h2>
            <p className="text-slate-400 text-center mb-6">
              {formatPackageName(packageName)} VIP Package - KES {packagePrice}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-dark-200 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-primary-500"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Phone Number
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
                    minLength={9}
                  />
                </div>
              </div>

              {/* Package Reference (read-only display) */}
              <div className="p-4 bg-dark-200 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400">Selected Package</p>
                <p className="text-white font-semibold">
                  {formatPackageName(packageName)} VIP Access
                </p>
                <p className="text-primary-500 font-bold text-lg">
                  KES {packagePrice}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-primary-600 hover:bg-primary-500 rounded-lg font-semibold text-white transition glow-green"
              >
                Book Now
              </button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-4">
              Our team will contact you within 24 hours to complete your booking.
            </p>
          </>
        )}

        {/* Submitting State */}
        {status === 'submitting' && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Submitting your booking...</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="text-center py-4">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <h3 className="text-white text-xl font-semibold mb-2">
              Booking Received!
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Now complete your payment and share the confirmation with us.
            </p>

            {/* M-Pesa Payment Instructions */}
            <div className="bg-dark-200 rounded-xl p-4 mb-4 text-left border border-slate-700">
              <h4 className="text-primary-500 font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                Pay via M-Pesa Buy Goods
              </h4>
              <div className="bg-dark-100 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Till Number</span>
                  <div className="flex items-center gap-2">
                    <span className="text-primary-500 font-bold text-lg">7972829</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('7972829');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="text-slate-400 hover:text-white transition"
                    >
                      {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Amount</span>
                  <span className="text-white font-bold">KES {packagePrice}</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs">
                Open M-Pesa → Lipa na M-Pesa → Buy Goods → Enter Till & Amount
              </p>
            </div>

            {/* Share Payment Confirmation */}
            <div className="bg-dark-200 rounded-xl p-4 mb-4 text-left border border-slate-700">
              <h4 className="text-primary-500 font-semibold mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                Share Payment Confirmation
              </h4>
              <p className="text-slate-400 text-sm mb-3">
                After paying, send us a screenshot or forward the M-Pesa message:
              </p>
              
              {/* WhatsApp Button */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Hi SureOdds! 👋\n\nI just paid for the ${formatPackageName(packageName)} VIP Package (KES ${packagePrice}).\n\nName: ${fullName}\nPhone: ${phone}\n\nHere's my payment confirmation:`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-semibold text-white transition mb-2"
              >
                <MessageCircle size={20} />
                Send via WhatsApp
              </a>
              
              {/* Email Button */}
              <a
                href={`mailto:sureoddsanalytics@gmail.com?subject=Payment Confirmation - ${formatPackageName(packageName)} Package&body=${encodeURIComponent(
                  `Hi SureOdds Team,\n\nI just completed payment for the ${formatPackageName(packageName)} VIP Package (KES ${packagePrice}).\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\n\nPlease find my M-Pesa confirmation attached/below:\n\n[Paste your M-Pesa message or attach screenshot here]\n\nThank you!`
                )}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-white transition"
              >
                <Send size={20} />
                Send via Email
              </a>
            </div>

            <p className="text-slate-500 text-xs mb-4">
              ⚡ We'll activate your VIP access within 10 minutes of receiving your confirmation!
            </p>

            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-400 hover:text-white transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
