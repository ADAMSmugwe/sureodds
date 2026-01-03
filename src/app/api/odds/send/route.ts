import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendDailyOddsEmail } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { odds, title, message } = body;

    if (!odds || odds.length === 0) {
      return NextResponse.json({ error: 'Please add at least one odd/prediction' }, { status: 400 });
    }

    // Find all users with active subscriptions
    const now = new Date();
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: now, // Subscription hasn't expired
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (activeSubscriptions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No active subscribers found',
        sent: 0 
      });
    }

    // Get unique users (in case they have multiple subscriptions)
    const uniqueUsers = new Map();
    activeSubscriptions.forEach(sub => {
      if (!uniqueUsers.has(sub.user.email)) {
        uniqueUsers.set(sub.user.email, {
          email: sub.user.email,
          name: sub.user.name,
          planType: sub.planType,
        });
      }
    });

    // Send emails to all active subscribers
    const emailPromises: Promise<void>[] = [];
    const sentTo: string[] = [];
    const failed: string[] = [];

    for (const [email, userData] of uniqueUsers) {
      emailPromises.push(
        sendDailyOddsEmail({
          email: userData.email,
          name: userData.name,
          odds,
          title: title || `Today's VIP Predictions - ${new Date().toLocaleDateString('en-GB', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}`,
          message: message || '',
        }).then(() => {
          sentTo.push(email);
        }).catch((error) => {
          console.error(`Failed to send to ${email}:`, error);
          failed.push(email);
        })
      );
    }

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      message: `Daily odds sent to ${sentTo.length} subscriber(s)`,
      sent: sentTo.length,
      failed: failed.length,
      details: {
        sentTo,
        failedEmails: failed,
      },
    });

  } catch (error) {
    console.error('Send odds error:', error);
    return NextResponse.json(
      { error: 'Failed to send odds' },
      { status: 500 }
    );
  }
}

// GET - Preview subscribers who will receive the odds
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: now,
        },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    // Get unique users
    const uniqueUsers = new Map();
    activeSubscriptions.forEach(sub => {
      if (!uniqueUsers.has(sub.user.email)) {
        uniqueUsers.set(sub.user.email, {
          email: sub.user.email,
          name: sub.user.name,
          planType: sub.planType,
          endDate: sub.endDate,
        });
      }
    });

    return NextResponse.json({
      count: uniqueUsers.size,
      subscribers: Array.from(uniqueUsers.values()),
    });

  } catch (error) {
    console.error('Get subscribers error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscribers' },
      { status: 500 }
    );
  }
}
