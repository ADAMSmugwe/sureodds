import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendDailyOddsEmail, sendFreePicksEmail } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    // Check admin authorization
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { odds, title, message, sendType } = body; // sendType: 'free' or 'vip'

    if (!odds || odds.length === 0) {
      return NextResponse.json({ error: 'Please add at least one odd/prediction' }, { status: 400 });
    }

    let targetUsers: Map<string, { email: string; name: string | null }> = new Map();

    if (sendType === 'free') {
      // Free picks - send to ALL users in the database
      const allUsers = await prisma.user.findMany({
        where: {
          email: {
            not: undefined,
          },
        },
        select: {
          email: true,
          name: true,
        },
      });

      allUsers.forEach(user => {
        if (!targetUsers.has(user.email)) {
          targetUsers.set(user.email, {
            email: user.email,
            name: user.name,
          });
        }
      });

      if (targetUsers.size === 0) {
        return NextResponse.json({ 
          success: true, 
          message: 'No users found in the database',
          sent: 0 
        });
      }
    } else {
      // VIP odds - send only to active subscribers
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
      activeSubscriptions.forEach(sub => {
        if (!targetUsers.has(sub.user.email)) {
          targetUsers.set(sub.user.email, {
            email: sub.user.email,
            name: sub.user.name,
          });
        }
      });
    }

    // Send emails to target users
    const emailPromises: Promise<void>[] = [];
    const sentTo: string[] = [];
    const failed: string[] = [];

    const defaultTitle = sendType === 'free' 
      ? `Today's Free Picks - ${new Date().toLocaleDateString('en-GB', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}`
      : `Today's VIP Predictions - ${new Date().toLocaleDateString('en-GB', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}`;

    for (const [email, userData] of targetUsers) {
      const emailFn = sendType === 'free' ? sendFreePicksEmail : sendDailyOddsEmail;
      
      emailPromises.push(
        emailFn({
          email: userData.email,
          name: userData.name,
          odds,
          title: title || defaultTitle,
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

    const typeLabel = sendType === 'free' ? 'Free picks' : 'VIP odds';
    return NextResponse.json({
      success: true,
      message: `${typeLabel} sent to ${sentTo.length} user(s)`,
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

    const { searchParams } = new URL(req.url);
    const sendType = searchParams.get('type') || 'vip'; // 'free' or 'vip'

    let targetUsers: Array<{ email: string; name: string | null; planType?: string; endDate?: Date }> = [];

    if (sendType === 'free') {
      // Get ALL users for free picks
      const allUsers = await prisma.user.findMany({
        select: {
          email: true,
          name: true,
        },
      });
      targetUsers = allUsers.map(user => ({
        email: user.email,
        name: user.name,
      }));
    } else {
      // Get only active subscribers for VIP
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
      targetUsers = Array.from(uniqueUsers.values());
    }

    // Get today's predictions based on type
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const predictions = await prisma.prediction.findMany({
      where: {
        isPremium: sendType === 'vip', // VIP = premium only, Free = non-premium
        kickOff: {
          gte: today,
        },
      },
      orderBy: {
        kickOff: 'asc',
      },
    });

    return NextResponse.json({
      count: targetUsers.length,
      subscribers: targetUsers,
      predictions: predictions.map(p => ({
        id: p.id,
        match: `${p.homeTeam} vs ${p.awayTeam}`,
        league: p.league,
        kickoff: new Date(p.kickOff).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        kickoffDate: p.kickOff,
        tip: p.tip,
        odds: p.odds.toString(),
        status: p.status,
      })),
    });

  } catch (error) {
    console.error('Get subscribers error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscribers' },
      { status: 500 }
    );
  }
}
