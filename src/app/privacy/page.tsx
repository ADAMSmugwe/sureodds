'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-slate-300">
            Last updated: December 25, 2025
          </p>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <div className="text-slate-400 space-y-3">
              <p><strong className="text-white">Personal Information:</strong></p>
              <ul className="list-disc list-inside space-y-2">
                <li>Name and email address (for account creation)</li>
                <li>Phone number (for M-Pesa payments)</li>
                <li>Payment transaction details</li>
              </ul>
              <p className="mt-4"><strong className="text-white">Usage Information:</strong></p>
              <ul className="list-disc list-inside space-y-2">
                <li>Pages visited and features used</li>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
              </ul>
            </div>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <ul className="text-slate-400 list-disc list-inside space-y-2">
              <li>To provide and maintain our service</li>
              <li>To process payments and manage subscriptions</li>
              <li>To send you updates about predictions (if opted in)</li>
              <li>To improve our service and user experience</li>
              <li>To detect and prevent fraud</li>
            </ul>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Security</h2>
            <p className="text-slate-400">
              We implement appropriate security measures to protect your personal information. 
              All payment data is processed securely through Safaricom's M-Pesa platform - we 
              do not store your M-Pesa PIN or full payment credentials.
            </p>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing</h2>
            <p className="text-slate-400">
              We do not sell, trade, or rent your personal information to third parties. We may 
              share data with:
            </p>
            <ul className="text-slate-400 list-disc list-inside space-y-2 mt-3">
              <li>Safaricom (M-Pesa) for payment processing</li>
              <li>Law enforcement if required by law</li>
              <li>Service providers who assist our operations</li>
            </ul>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Cookies</h2>
            <p className="text-slate-400">
              We use cookies to maintain your session, remember your preferences, and analyze 
              site usage. You can control cookie settings through your browser.
            </p>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
            <p className="text-slate-400">You have the right to:</p>
            <ul className="text-slate-400 list-disc list-inside space-y-2 mt-3">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p className="text-slate-400">
              We retain your personal information for as long as your account is active or as 
              needed to provide services. Transaction records are kept for 7 years for legal 
              and accounting purposes.
            </p>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
            <p className="text-slate-400">
              For privacy-related inquiries, please contact us at{' '}
              <a href="mailto:privacy@sureodds.com" className="text-primary-500 hover:underline">
                privacy@sureodds.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="text-primary-500 hover:text-primary-400 transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
