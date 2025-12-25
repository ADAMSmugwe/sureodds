'use client';

import { Lock, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface PredictionCardProps {
  id: string;
  matchName: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  kickOff: string | Date;
  tip: string;
  odds: number | null;
  isPremium: boolean;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  analysis?: string | null;
  isLocked?: boolean;
  onUnlockClick?: () => void;
}

export function PredictionCard({
  matchName,
  homeTeam,
  awayTeam,
  league,
  kickOff,
  tip,
  odds,
  isPremium,
  status,
  analysis,
  isLocked = false,
  onUnlockClick,
}: PredictionCardProps) {
  const kickOffDate = new Date(kickOff);
  const isUpcoming = kickOffDate > new Date();

  const statusConfig = {
    PENDING: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    WON: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
    LOST: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
    VOID: { icon: Clock, color: 'text-slate-500', bg: 'bg-slate-500/10' },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="bg-dark-100 rounded-xl border border-slate-800 overflow-hidden hover:border-slate-700 transition">
      {/* Header */}
      <div className="px-4 py-3 bg-dark-200 flex items-center justify-between">
        <span className="text-sm text-slate-400">{league}</span>
        <div className="flex items-center gap-2">
          {isPremium && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-500 text-xs rounded-full">
              VIP
            </span>
          )}
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${statusConfig[status].bg} ${statusConfig[status].color}`}>
            <StatusIcon size={12} />
            {status}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="text-center mb-4">
          <p className="text-lg font-semibold text-white">
            {homeTeam} <span className="text-slate-500">vs</span> {awayTeam}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {format(kickOffDate, 'EEE, MMM d • h:mm a')}
          </p>
        </div>

        {/* Tip Section */}
        {isLocked ? (
          <button
            onClick={onUnlockClick}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 text-slate-400 transition"
          >
            <Lock size={18} />
            <span>Join VIP to Unlock</span>
          </button>
        ) : (
          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-3 text-center">
            <p className="text-primary-400 font-semibold text-lg">{tip}</p>
            {odds && (
              <p className="text-slate-400 text-sm mt-1">@ {odds.toFixed(2)}</p>
            )}
          </div>
        )}

        {/* Analysis */}
        {analysis && !isLocked && (
          <p className="mt-3 text-sm text-slate-400 text-center">{analysis}</p>
        )}
      </div>
    </div>
  );
}
