'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-dark-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-slate-300">
            Last updated: December 25, 2025
          </p>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-400">
              By accessing and using SureOdds, you accept and agree to be bound by the terms and 
              conditions of this agreement. If you do not agree to these terms, you should not 
              use this service.
            </p>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Age Requirement</h2>
            <p className="text-slate-400">
              You must be at least 18 years old to use SureOdds. By using this service, you 
              confirm that you are of legal age to participate in sports betting activities 
              in your jurisdiction.
            </p>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Service Description</h2>
            <p className="text-slate-400">
              SureOdds provides sports predictions and analysis for informational purposes only. 
              We do not operate as a betting platform and do not accept bets. Our predictions 
              are based on statistical analysis and expert opinion but do not guarantee outcomes.
            </p>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Disclaimer</h2>
            <div className="text-slate-400 space-y-3">
              <p>
                <strong className="text-yellow-500">⚠️ IMPORTANT:</strong> Sports betting involves 
                significant financial risk. Past performance of our predictions does not guarantee 
                future results.
              </p>
              <p>
                SureOdds is not responsible for any losses incurred from betting based on our 
                predictions. Users are solely responsible for their betting decisions and should 
                only bet what they can afford to lose.
              </p>
            </div>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Subscription & Payments</h2>
            <ul className="text-slate-400 list-disc list-inside space-y-2">
              <li>All payments are processed securely via M-Pesa</li>
              <li>Subscriptions are non-refundable once activated</li>
              <li>VIP access is granted immediately upon successful payment</li>
              <li>Subscriptions do not auto-renew</li>
            </ul>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">6. User Conduct</h2>
            <p className="text-slate-400">
              Users agree not to share, resell, or redistribute VIP predictions. Violation of 
              this policy may result in immediate termination of your account without refund.
            </p>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Responsible Gambling</h2>
            <div className="text-slate-400 space-y-3">
              <p>
                We encourage responsible gambling. If you or someone you know has a gambling 
                problem, please seek help from professional organizations.
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>Set a budget and stick to it</li>
                <li>Never chase losses</li>
                <li>Take regular breaks</li>
                <li>Don't bet under the influence</li>
              </ul>
            </div>
          </section>

          <section className="bg-dark-100 rounded-xl p-6 border border-slate-800">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
            <p className="text-slate-400">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:support@sureodds.com" className="text-primary-500 hover:underline">
                support@sureodds.com
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
