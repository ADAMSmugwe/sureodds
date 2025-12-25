/**
 * Predictions API
 * GET /api/predictions - Get all predictions (filtered based on subscription)
 * POST /api/predictions - Create prediction (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const predictionSchema = z.object({
  matchName: z.string().min(1),
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  league: z.string().min(1),
  kickOff: z.string().transform((s) => new Date(s)),
  tip: z.string().min(1),
  odds: z.number().positive(),
  isPremium: z.boolean().default(false),
  analysis: z.string().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status'); // PENDING, WON, LOST
    const type = searchParams.get('type'); // free, premium, all
    
    // Build the where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (type === 'free') {
      where.isPremium = false;
    } else if (type === 'premium') {
      where.isPremium = true;
    }

    // Get predictions
    const predictions = await prisma.prediction.findMany({
      where,
      orderBy: { kickOff: 'desc' },
    });

    // Check if user has active subscription
    let hasActiveSubscription = false;
    if (session?.user?.id) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          endDate: { gte: new Date() },
        },
      });
      hasActiveSubscription = !!subscription;
    }

    // If user doesn't have subscription, hide premium tip details
    const processedPredictions = predictions.map((pred) => {
      if (pred.isPremium && !hasActiveSubscription) {
        return {
          ...pred,
          tip: '🔒 VIP Only',
          analysis: null,
          odds: null,
        };
      }
      return pred;
    });

    return NextResponse.json({
      predictions: processedPredictions,
      hasActiveSubscription,
    });

  } catch (error) {
    console.error('Get predictions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = predictionSchema.safeParse(body);
    
    if (!validation.success) {
      console.error('Validation errors:', validation.error.errors);
      return NextResponse.json(
        { error: validation.error.errors[0].message, details: validation.error.errors },
        { status: 400 }
      );
    }

    const prediction = await prisma.prediction.create({
      data: validation.data,
    });

    return NextResponse.json({ prediction }, { status: 201 });

  } catch (error) {
    console.error('Create prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to create prediction' },
      { status: 500 }
    );
  }
}
