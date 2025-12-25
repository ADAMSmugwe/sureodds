import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-dark-100 border-t border-slate-800">
      {/* Responsible Gambling Banner */}
      <div className="bg-yellow-500/10 border-y border-yellow-500/20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-2 text-yellow-500 text-sm">
            <AlertTriangle size={16} />
            <span>
              <strong>18+</strong> | Gamble Responsibly | Betting involves risk | 
              Don't bet more than you can afford to lose
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold">
              <span className="text-primary-500">Sure</span>
              <span className="text-white">Odds</span>
            </Link>
            <p className="mt-4 text-slate-400 max-w-md">
              Premium sports predictions with a proven track record. Join thousands of 
              winners who trust SureOdds for daily winning tips.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/predictions" className="text-slate-400 hover:text-primary-500 transition">
                  Predictions
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-slate-400 hover:text-primary-500 transition">
                  VIP Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-primary-500 transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-primary-500 transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-primary-500 transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="mailto:support@sureodds.com" className="text-slate-400 hover:text-primary-500 transition">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} SureOdds. All rights reserved.
            </p>
            <p className="text-slate-500 text-sm text-center">
              Predictions are for informational purposes only. We do not guarantee any outcomes.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
