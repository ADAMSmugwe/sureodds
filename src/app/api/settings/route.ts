/**
 * Settings API Endpoint
 * GET /api/settings - Get all settings (public for prices)
 * PATCH /api/settings - Update settings (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Default prices if not set in database
const DEFAULT_PRICES = {
  PRICE_DAILY: '50',
  PRICE_WEEKLY: '250',
  PRICE_MONTHLY: '800',
};

export async function GET() {
  try {
    // Try to get settings from database
    let settings: Array<{ key: string; value: string }> = [];
    
    try {
      settings = await prisma.setting.findMany();
    } catch (dbError) {
      // Table might not exist yet, use defaults
      console.log('Settings table not available, using defaults');
    }
    
    // Convert to object
    const settingsObj: Record<string, string> = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });

    // Merge with defaults and return flat object
    return NextResponse.json({
      daily: parseInt(settingsObj.PRICE_DAILY || DEFAULT_PRICES.PRICE_DAILY),
      weekly: parseInt(settingsObj.PRICE_WEEKLY || DEFAULT_PRICES.PRICE_WEEKLY),
      monthly: parseInt(settingsObj.PRICE_MONTHLY || DEFAULT_PRICES.PRICE_MONTHLY),
    });
  } catch (error) {
    console.error('Get settings error:', error);
    // Return defaults on error
    return NextResponse.json({
      daily: parseInt(DEFAULT_PRICES.PRICE_DAILY),
      weekly: parseInt(DEFAULT_PRICES.PRICE_WEEKLY),
      monthly: parseInt(DEFAULT_PRICES.PRICE_MONTHLY),
    });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { daily, weekly, monthly } = body;

    // Validate prices
    if (daily !== undefined && (isNaN(daily) || daily < 1)) {
      return NextResponse.json({ error: 'Invalid daily price' }, { status: 400 });
    }
    if (weekly !== undefined && (isNaN(weekly) || weekly < 1)) {
      return NextResponse.json({ error: 'Invalid weekly price' }, { status: 400 });
    }
    if (monthly !== undefined && (isNaN(monthly) || monthly < 1)) {
      return NextResponse.json({ error: 'Invalid monthly price' }, { status: 400 });
    }

    // Update settings using upsert
    const updates = [];

    if (daily !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'PRICE_DAILY' },
          update: { value: String(daily) },
          create: { key: 'PRICE_DAILY', value: String(daily) },
        })
      );
    }

    if (weekly !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'PRICE_WEEKLY' },
          update: { value: String(weekly) },
          create: { key: 'PRICE_WEEKLY', value: String(weekly) },
        })
      );
    }

    if (monthly !== undefined) {
      updates.push(
        prisma.setting.upsert({
          where: { key: 'PRICE_MONTHLY' },
          update: { value: String(monthly) },
          create: { key: 'PRICE_MONTHLY', value: String(monthly) },
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({ 
      success: true,
      message: 'Prices updated successfully' 
    });

  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
