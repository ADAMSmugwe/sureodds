/**
 * M-Pesa Callback Endpoint
 * POST /api/mpesa/callback
 * 
 * THIS IS THE MOST CRITICAL ENDPOINT IN THE ENTIRE SYSTEM.
 * Safaricom sends payment confirmation here after user enters PIN.
 * 
 * SECURITY NOTES:
 * - This endpoint is public (Safaricom must access it)
 * - Validate the callback data carefully
 * - Use database transactions to ensure data consistency
 * - Log everything for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseCallback, calculateEndDate } from '@/lib/mpesa';

export async function POST(request: NextRequest) {
  console.log('=== M-PESA CALLBACK RECEIVED ===');
  
  try {
    const body = await request.json();
    
    // Log the raw callback for debugging
    console.log('Callback body:', JSON.stringify(body, null, 2));

    // 1. Parse the callback data
    const callbackData = parseCallback(body);
    console.log('Parsed callback:', callbackData);

    // 2. Find the transaction in our database
    const transaction = await prisma.transaction.findUnique({
      where: { checkoutRequestID: callbackData.checkoutRequestId },
      include: { user: true },
    });

    if (!transaction) {
      console.error('Transaction not found:', callbackData.checkoutRequestId);
      // Still return success to Safaricom - we don't want them retrying
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // 3. Check if transaction was already processed
    if (transaction.status !== 'PENDING') {
      console.log('Transaction already processed:', transaction.id);
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // 4. Handle the result
    if (callbackData.resultCode === 0) {
      // ✅ PAYMENT SUCCESSFUL
      console.log('Payment successful! Processing...');

      // Use a database transaction to ensure atomicity
      await prisma.$transaction(async (tx) => {
        // Update the transaction record
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'SUCCESS',
            mpesaReceipt: callbackData.mpesaReceiptNumber,
            resultDesc: callbackData.resultDesc,
          },
        });

        // Deactivate any existing active subscriptions
        await tx.subscription.updateMany({
          where: {
            userId: transaction.userId,
            isActive: true,
          },
          data: {
            isActive: false,
          },
        });

        // Create new subscription
        const endDate = calculateEndDate(transaction.planType);
        
        await tx.subscription.create({
          data: {
            userId: transaction.userId,
            planType: transaction.planType,
            startDate: new Date(),
            endDate,
            isActive: true,
          },
        });

        console.log('✅ Subscription created for user:', transaction.userId);
        console.log('   Plan:', transaction.planType);
        console.log('   Expires:', endDate);
      });

    } else {
      // ❌ PAYMENT FAILED
      console.log('Payment failed:', callbackData.resultDesc);

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          resultDesc: callbackData.resultDesc,
        },
      });
    }

    // 5. Always return success to Safaricom
    // (They'll keep retrying if we return an error)
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Callback received and processed',
    });

  } catch (error) {
    console.error('Callback processing error:', error);
    
    // Still return success to prevent Safaricom from retrying
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  }
}

// Handle preflight requests (some versions of Safaricom's API send these)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
