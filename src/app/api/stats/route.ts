/**
 * User Stats API
 * GET /api/stats - Get platform statistics
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Get predictions stats
    const [total, won, lost, pending] = await Promise.all([
      prisma.prediction.count(),
      prisma.prediction.count({ where: { status: 'WON' } }),
      prisma.prediction.count({ where: { status: 'LOST' } }),
      prisma.prediction.count({ where: { status: 'PENDING' } }),
    ]);

    // Calculate win rate
    const completed = won + lost;
    const winRate = completed > 0 ? Math.round((won / completed) * 100) : 0;

    // Get recent results (last 10 completed)
    const recentResults = await prisma.prediction.findMany({
      where: {
        status: { in: ['WON', 'LOST'] },
      },
      orderBy: { kickOff: 'desc' },
      take: 10,
      select: {
        id: true,
        matchName: true,
        league: true,
        tip: true,
        odds: true,
        status: true,
        kickOff: true,
      },
    });

    return NextResponse.json({
      stats: {
        total,
        won,
        lost,
        pending,
        winRate,
      },
      recentResults,
    });

  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
