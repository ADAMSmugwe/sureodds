/**
 * M-Pesa STK Push Initiation Endpoint
 * POST /api/mpesa/stkpush
 * 
 * This endpoint triggers the M-Pesa payment prompt on the user's phone.
 * After the user enters their PIN, Safaricom will call our /api/mpesa/callback endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { 
  initiateStkPush, 
  formatPhoneNumber, 
  getPlanPrice 
} from '@/lib/mpesa';
import { z } from 'zod';

const stkPushSchema = z.object({
  phone: z.string().min(9, 'Invalid phone number'),
  planType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Check if user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please log in to make a payment' },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const validation = stkPushSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { phone, planType } = validation.data;
    const amount = getPlanPrice(planType);
    const formattedPhone = formatPhoneNumber(phone);

    // 3. Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        endDate: { gte: new Date() },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { 
          error: 'You already have an active subscription',
          subscriptionEnd: existingSubscription.endDate 
        },
        { status: 400 }
      );
    }

    // 4. Check for any pending transactions for this user
    const pendingTransaction = await prisma.transaction.findFirst({
      where: {
        userId: session.user.id,
        status: 'PENDING',
        createdAt: {
          // Only check transactions from the last 5 minutes
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
    });

    if (pendingTransaction) {
      return NextResponse.json(
        { 
          error: 'You have a pending payment. Please check your phone or wait a moment.',
          checkoutRequestId: pendingTransaction.checkoutRequestID
        },
        { status: 400 }
      );
    }

    // 5. Initiate STK Push
    const stkResponse = await initiateStkPush({
      phone: formattedPhone,
      amount,
      accountReference: `SureOdds-${planType}`,
      transactionDesc: `VIP ${planType} Subscription`,
    });

    // 6. Check if STK Push was successful
    if (stkResponse.ResponseCode !== '0') {
      return NextResponse.json(
        { error: stkResponse.ResponseDescription || 'Failed to initiate payment' },
        { status: 400 }
      );
    }

    // 7. Create a pending transaction record
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        merchantRequestID: stkResponse.MerchantRequestID,
        checkoutRequestID: stkResponse.CheckoutRequestID,
        amount,
        phone: formattedPhone,
        planType,
        status: 'PENDING',
      },
    });

    // 8. Update user's phone if not set
    if (!session.user.phone) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phone: formattedPhone },
      });
    }

    // 9. Return success response
    return NextResponse.json({
      success: true,
      message: stkResponse.CustomerMessage,
      checkoutRequestId: stkResponse.CheckoutRequestID,
    });

  } catch (error: any) {
    console.error('STK Push error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
