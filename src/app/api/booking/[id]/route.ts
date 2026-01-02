/**
 * Single Booking API Endpoint
 * PATCH /api/booking/[id] - Update booking status
 * GET /api/booking/[id] - Get single booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendPaymentConfirmationEmail } from '@/lib/notifications';

// Calculate expiration date based on package type
function calculateExpirationDate(packageName: string): Date {
  const now = new Date();
  switch (packageName.toUpperCase()) {
    case 'DAILY':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
    case 'WEEKLY':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    case 'MONTHLY':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Default to 1 day
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { status, sendEmail, notes } = body;

    // Get current booking to check package type
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      status: string;
      notes?: string;
      activatedAt?: Date;
      expiresAt?: Date;
      reminderSent?: boolean;
    } = {
      status,
      ...(notes !== undefined && { notes }),
    };

    // If converting (payment confirmed), set activation and expiration dates
    if (status === 'CONVERTED' && existingBooking.status !== 'CONVERTED') {
      updateData.activatedAt = new Date();
      updateData.expiresAt = calculateExpirationDate(existingBooking.packageName);
      updateData.reminderSent = false; // Reset reminder flag for new subscription
    }

    // Update the booking
    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    // Send confirmation email if payment is confirmed
    if (status === 'CONVERTED' && sendEmail) {
      await sendPaymentConfirmationEmail({
        fullName: booking.fullName,
        email: booking.email,
        phone: booking.phone,
        packageName: booking.packageName,
        packagePrice: booking.packagePrice,
      });
    }

    return NextResponse.json({ success: true, booking });

  } catch (error) {
    console.error('Update booking error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });

  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { error: 'Failed to get booking' },
      { status: 500 }
    );
  }
}
