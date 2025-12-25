'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, FileText, Lock, AlertTriangle, CheckCircle } from 'lucide-react';

const CONSENT_KEY = 'sureodds_terms_accepted';
const CONSENT_VERSION = '1.0'; // Increment this to force re-acceptance when terms change

export function TermsConsentModal() {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    // Check if user has already accepted terms
    const checkConsent = () => {
      try {
        const consent = localStorage.getItem(CONSENT_KEY);
        if (consent) {
          const parsed = JSON.parse(consent);
          // Check if consent version matches current version
          if (parsed.version === CONSENT_VERSION && parsed.accepted) {
            setShowModal(false);
          } else {
            setShowModal(true);
          }
        } else {
          setShowModal(true);
        }
      } catch {
        setShowModal(true);
      }
      setIsLoading(false);
    };

    checkConsent();
  }, []);

  const handleAccept = () => {
    if (!ageConfirmed || !termsAccepted) return;

    // Store consent in localStorage
    const consentData = {
      accepted: true,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    
    // Also set a cookie for server-side checks if needed
    document.cookie = `${CONSENT_KEY}=${CONSENT_VERSION}; path=/; max-age=31536000; SameSite=Lax`;
    
    setShowModal(false);
  };

  // Don't render anything while checking consent status
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-dark-200 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Don't show modal if consent already given
  if (!showModal) {
    return null;
  }

  const canProceed = ageConfirmed && termsAccepted;

  return (
    <>
      {/* Full screen overlay - blocks all content */}
      <div className="fixed inset-0 z-[100] bg-dark-200">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Centered modal */}
        <div className="relative min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-dark-100 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Welcome to SureOdds
              </h1>
              <p className="text-primary-100 mt-2">
                Premium Sports Predictions Platform
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6">
              {/* Age Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-500">Age Restriction</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      This website contains sports betting predictions. You must be <strong className="text-white">18 years or older</strong> to access this content. Gambling can be addictive - please bet responsibly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms Summary */}
              <div className="bg-dark-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-6 h-6 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">Terms and Conditions</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      By using SureOdds, you agree to use our predictions for informational purposes only. We do not guarantee any betting outcomes, and you are solely responsible for your betting decisions and any financial losses incurred.
                    </p>
                    <Link 
                      href="/terms" 
                      target="_blank"
                      className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-400 text-sm mt-2 transition"
                    >
                      Read full Terms and Conditions →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Privacy Summary */}
              <div className="bg-dark-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-6 h-6 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white">Privacy Policy</h3>
                    <p className="text-slate-400 text-sm mt-1">
                      We collect your email, phone number (for M-Pesa payments), and usage data to provide our services. Your data is securely stored and never sold to third parties.
                    </p>
                    <Link 
                      href="/privacy" 
                      target="_blank"
                      className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-400 text-sm mt-2 transition"
                    >
                      Read full Privacy Policy →
                    </Link>
                  </div>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ageConfirmed}
                    onChange={(e) => setAgeConfirmed(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-slate-600 bg-dark-200 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-slate-300 group-hover:text-white transition">
                    I confirm that I am <strong className="text-white">18 years of age or older</strong> and legally allowed to view gambling-related content in my jurisdiction.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-slate-600 bg-dark-200 text-primary-500 focus:ring-primary-500 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-slate-300 group-hover:text-white transition">
                    I have read and agree to the{' '}
                    <Link href="/terms" target="_blank" className="text-primary-500 hover:underline">
                      Terms and Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" target="_blank" className="text-primary-500 hover:underline">
                      Privacy Policy
                    </Link>.
                  </span>
                </label>
              </div>

              {/* Accept Button */}
              <button
                onClick={handleAccept}
                disabled={!canProceed}
                className={`w-full py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 ${
                  canProceed
                    ? 'bg-primary-600 hover:bg-primary-500 text-white glow-green cursor-pointer'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {canProceed && <CheckCircle className="w-5 h-5" />}
                {canProceed ? 'I Agree - Enter SureOdds' : 'Please accept all terms to continue'}
              </button>

              {/* Responsible Gambling */}
              <p className="text-center text-slate-500 text-xs">
                🎰 Gamble Responsibly | If you have a gambling problem, seek help at{' '}
                <a 
                  href="https://www.begambleaware.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:underline"
                >
                  BeGambleAware.org
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
