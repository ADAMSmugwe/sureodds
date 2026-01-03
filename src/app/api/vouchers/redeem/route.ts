import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendSubscriptionActivatedEmail } from '@/lib/notifications';

// POST - Redeem a voucher code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Please log in to redeem a voucher' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Voucher code is required' }, { status: 400 });
    }

    // Find the voucher
    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Invalid voucher code' }, { status: 400 });
    }

    if (voucher.isRedeemed) {
      return NextResponse.json({ error: 'This voucher has already been used' }, { status: 400 });
    }

    if (new Date() > voucher.expiresAt) {
      return NextResponse.json({ error: 'This voucher has expired' }, { status: 400 });
    }

    // Calculate subscription duration based on plan type
    const now = new Date();
    let endDate = new Date(now);
    
    switch (voucher.planType) {
      case 'DAILY':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'WEEKLY':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'MONTHLY':
        endDate.setDate(endDate.getDate() + 30);
        break;
      default:
        return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Create subscription and mark voucher as redeemed in a transaction
    const [subscription, updatedVoucher] = await prisma.$transaction([
      prisma.subscription.create({
        data: {
          userId: session.user.id,
          planType: voucher.planType,
          startDate: now,
          endDate,
          isActive: true,
        },
      }),
      prisma.voucher.update({
        where: { id: voucher.id },
        data: {
          isRedeemed: true,
          redeemedBy: session.user.id,
          redeemedAt: now,
        },
      }),
    ]);

    // Send confirmation email
    sendSubscriptionActivatedEmail({
      email: session.user.email!,
      name: session.user.name || session.user.email!,
      planType: voucher.planType,
      endDate,
    }).catch(console.error);

    return NextResponse.json({
      message: 'Voucher redeemed successfully!',
      subscription: {
        planType: subscription.planType,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    console.error('Error redeeming voucher:', error);
    return NextResponse.json({ error: 'Failed to redeem voucher' }, { status: 500 });
  }
}
