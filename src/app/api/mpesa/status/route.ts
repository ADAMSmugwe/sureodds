/**
 * Check Payment Status Endpoint
 * GET /api/mpesa/status?checkoutRequestId=xxx
 * 
 * Frontend polls this endpoint to check if payment was successful.
 * This is how we "unlock" the dashboard after payment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get the checkoutRequestId from query params
    const { searchParams } = new URL(request.url);
    const checkoutRequestId = searchParams.get('checkoutRequestId');

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: 'Missing checkoutRequestId' },
        { status: 400 }
      );
    }

    // 3. Find the transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        checkoutRequestID: checkoutRequestId,
        userId: session.user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // 4. If successful, also get the new subscription
    let subscription = null;
    if (transaction.status === 'SUCCESS') {
      subscription = await prisma.subscription.findFirst({
        where: {
          userId: session.user.id,
          isActive: true,
          endDate: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 5. Return the status
    return NextResponse.json({
      status: transaction.status,
      mpesaReceipt: transaction.mpesaReceipt,
      resultDesc: transaction.resultDesc,
      subscription: subscription ? {
        planType: subscription.planType,
        endDate: subscription.endDate,
      } : null,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
