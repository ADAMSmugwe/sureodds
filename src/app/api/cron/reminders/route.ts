/**
 * Cron Job API for Subscription Reminders
 * 
 * This endpoint should be called by a cron service (like Vercel Cron, GitHub Actions, or cron-job.org)
 * to check for expiring/expired subscriptions and send reminder emails.
 * 
 * Call: GET /api/cron/reminders?secret=YOUR_CRON_SECRET
 * 
 * Timing logic:
 * - Daily package: Send reminder when expires (after 1 day)
 * - Weekly package: Send reminder when expires (after 7 days)
 * - Monthly package: Send reminder when expires (after 30 days)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendExpiryReminderEmail } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    // Verify the cron secret to prevent unauthorized access
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    
    // Use a secret to protect this endpoint
    const cronSecret = process.env.CRON_SECRET || 'sureodds-cron-2024';
    
    if (secret !== cronSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    
    // Find all converted bookings that:
    // 1. Have an expiration date
    // 2. Are expired or expiring within 6 hours
    // 3. Haven't had a reminder sent yet
    const expiringBookings = await prisma.booking.findMany({
      where: {
        status: 'CONVERTED',
        expiresAt: {
          not: null,
          lte: new Date(now.getTime() + 6 * 60 * 60 * 1000), // Expires within 6 hours or already expired
        },
        reminderSent: false,
      },
    });

    console.log(`\n========================================`);
    console.log(`📧 CRON: Checking expiring subscriptions`);
    console.log(`📅 Time: ${now.toLocaleString()}`);
    console.log(`🔍 Found ${expiringBookings.length} expiring/expired subscriptions`);
    console.log(`========================================\n`);

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const booking of expiringBookings) {
      try {
        // Send reminder email
        await sendExpiryReminderEmail({
          fullName: booking.fullName,
          email: booking.email,
          phone: booking.phone,
          packageName: booking.packageName,
          packagePrice: booking.packagePrice,
          expiresAt: booking.expiresAt!,
        });

        // Mark reminder as sent
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true },
        });

        results.push({ email: booking.email, success: true });
        console.log(`✅ Reminder sent to ${booking.email} (${booking.packageName})`);

      } catch (error) {
        console.error(`❌ Failed to send reminder to ${booking.email}:`, error);
        results.push({ 
          email: booking.email, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        total: expiringBookings.length,
        sent: successful,
        failed: failed,
      },
      results,
    });

  } catch (error) {
    console.error('Cron reminders error:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}

// Also support POST for some cron services
export async function POST(request: NextRequest) {
  return GET(request);
}
