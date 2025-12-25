import Link from 'next/link';
import { Trophy, TrendingUp, Shield, Zap, CheckCircle, XCircle } from 'lucide-react';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// Cache stats for 5 minutes - reduces DB calls significantly
const getCachedStats = unstable_cache(
  async () => {
    const [total, won, lost] = await Promise.all([
      prisma.prediction.count({ where: { status: { not: 'PENDING' } } }),
      prisma.prediction.count({ where: { status: 'WON' } }),
      prisma.prediction.count({ where: { status: 'LOST' } }),
    ]);
    
    const winRate = total > 0 ? Math.round((won / total) * 100) : 0;
    
    return { total, won, lost, winRate };
  },
  ['homepage-stats'],
  { revalidate: 300, tags: ['stats'] }
);

// Cache recent results for 2 minutes
const getCachedRecentResults = unstable_cache(
  async () => {
    return prisma.prediction.findMany({
      where: { status: { in: ['WON', 'LOST'] } },
      orderBy: { kickOff: 'desc' },
      take: 10,
    });
  },
  ['homepage-results'],
  { revalidate: 120, tags: ['predictions'] }
);

// Cache free picks for 1 minute
const getCachedFreePicks = unstable_cache(
  async () => {
    return prisma.prediction.findMany({
      where: { 
        isPremium: false,
        status: 'PENDING',
        kickOff: { gte: new Date() },
      },
      orderBy: { kickOff: 'asc' },
      take: 3,
    });
  },
  ['homepage-free-picks'],
  { revalidate: 60, tags: ['predictions'] }
);

export default async function HomePage() {
  const [stats, recentResults, freePicks] = await Promise.all([
    getCachedStats(),
    getCachedRecentResults(),
    getCachedFreePicks(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-transparent to-transparent" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Win Big with{' '}
              <span className="text-primary-500">Expert Predictions</span>
            </h1>
            <p className="text-xl text-slate-400 mb-8">
              Join thousands of winners using our data-driven sports predictions. 
              Verified results, transparent history.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="px-8 py-4 bg-primary-600 hover:bg-primary-500 rounded-xl font-semibold text-white transition glow-green"
              >
                Join VIP Now
              </Link>
              <Link
                href="/predictions"
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-white transition"
              >
                View Free Picks
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            <div className="bg-dark-100 rounded-xl p-6 border border-slate-800 text-center">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{stats.winRate}%</p>
              <p className="text-slate-400">Win Rate</p>
            </div>
            <div className="bg-dark-100 rounded-xl p-6 border border-slate-800 text-center">
              <TrendingUp className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-slate-400">Total Predictions</p>
            </div>
            <div className="bg-dark-100 rounded-xl p-6 border border-slate-800 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{stats.won}</p>
              <p className="text-slate-400">Won</p>
            </div>
            <div className="bg-dark-100 rounded-xl p-6 border border-slate-800 text-center">
              <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-white">{stats.lost}</p>
              <p className="text-slate-400">Lost</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Results */}
      <section className="py-16 px-4 bg-dark-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">Verified Results</h2>
            <p className="text-slate-400">Transparent track record - see our recent predictions</p>
          </div>

          <div className="bg-dark-100 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm text-slate-400">Match</th>
                    <th className="px-6 py-4 text-left text-sm text-slate-400">Tip</th>
                    <th className="px-6 py-4 text-left text-sm text-slate-400">Odds</th>
                    <th className="px-6 py-4 text-center text-sm text-slate-400">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentResults.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <p className="text-white font-medium">{result.matchName}</p>
                        <p className="text-sm text-slate-500">{result.league}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{result.tip}</td>
                      <td className="px-6 py-4 text-slate-300">{result.odds.toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        {result.status === 'WON' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
                            <CheckCircle size={14} />
                            WON
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-sm">
                            <XCircle size={14} />
                            LOST
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Free Picks */}
      {freePicks.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-2">Today's Free Picks</h2>
              <p className="text-slate-400">Try before you buy - free predictions daily</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {freePicks.map((pick) => (
                <div 
                  key={pick.id} 
                  className="bg-dark-100 rounded-xl border border-slate-800 p-6"
                >
                  <p className="text-sm text-slate-500 mb-2">{pick.league}</p>
                  <p className="text-lg font-semibold text-white mb-4">{pick.matchName}</p>
                  <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3 text-center">
                    <p className="text-primary-400 font-semibold">{pick.tip}</p>
                    <p className="text-slate-400 text-sm">@ {pick.odds.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 px-4 bg-dark-200/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-2">Why Choose SureOdds?</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Verified Results</h3>
              <p className="text-slate-400">
                Every prediction is tracked and verified. No hidden losses.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Data-Driven</h3>
              <p className="text-slate-400">
                Our tips are backed by statistical analysis and expert knowledge.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Instant Access</h3>
              <p className="text-slate-400">
                Pay via M-Pesa and get immediate access to all VIP predictions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Winning?
          </h2>
          <p className="text-xl text-slate-400 mb-8">
            Join our VIP members and get access to premium predictions
          </p>
          <Link
            href="/pricing"
            className="inline-block px-8 py-4 bg-primary-600 hover:bg-primary-500 rounded-xl font-semibold text-white transition glow-green"
          >
            View Pricing Plans
          </Link>
        </div>
      </section>
    </div>
  );
}
