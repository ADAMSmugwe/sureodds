import Link from 'next/link';
import prisma from '@/lib/prisma';
import { PredictionCard } from '@/components/PredictionCard';

// Force dynamic rendering - database queries require runtime
export const dynamic = 'force-dynamic';

async function getPredictions() {
  return prisma.prediction.findMany({
    orderBy: { kickOff: 'desc' },
  });
}

export default async function PredictionsPage() {
  const predictions = await getPredictions();
  
  const upcomingPredictions = predictions.filter(
    (p) => new Date(p.kickOff) > new Date()
  );
  const pastPredictions = predictions.filter(
    (p) => new Date(p.kickOff) <= new Date()
  );

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            All Predictions
          </h1>
          <p className="text-xl text-slate-400">
            Browse our latest sports predictions
          </p>
        </div>

        {/* Upcoming */}
        {upcomingPredictions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Upcoming Matches
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingPredictions.map((pred) => (
                <PredictionCard
                  key={pred.id}
                  id={pred.id}
                  matchName={pred.matchName}
                  homeTeam={pred.homeTeam}
                  awayTeam={pred.awayTeam}
                  league={pred.league}
                  kickOff={pred.kickOff}
                  tip={pred.isPremium ? '🔒 VIP Only' : pred.tip}
                  odds={pred.isPremium ? null : pred.odds}
                  isPremium={pred.isPremium}
                  status={pred.status}
                  analysis={pred.isPremium ? null : pred.analysis}
                  isLocked={pred.isPremium}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past Results */}
        {pastPredictions.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-6">
              Past Results
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastPredictions.map((pred) => (
                <PredictionCard
                  key={pred.id}
                  id={pred.id}
                  matchName={pred.matchName}
                  homeTeam={pred.homeTeam}
                  awayTeam={pred.awayTeam}
                  league={pred.league}
                  kickOff={pred.kickOff}
                  tip={pred.tip}
                  odds={pred.odds}
                  isPremium={pred.isPremium}
                  status={pred.status}
                  analysis={pred.analysis}
                  isLocked={false}
                />
              ))}
            </div>
          </section>
        )}

        {predictions.length === 0 && (
          <div className="text-center py-16">
            <p className="text-slate-400 text-lg mb-4">
              No predictions available yet
            </p>
            <Link
              href="/"
              className="text-primary-500 hover:text-primary-400"
            >
              Go back home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
