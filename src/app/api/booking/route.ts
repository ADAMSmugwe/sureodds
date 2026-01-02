/**
 * Booking API Endpoint
 * POST /api/booking
 * 
 * Handles lead generation form submissions for odds packages.
 * Stores booking in database and sends notification to admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendBookingNotification } from '@/lib/notifications';

const bookingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(9, 'Invalid phone number'),
  packageName: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
  packagePrice: z.number().positive(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validation = bookingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { fullName, email, phone, packageName, packagePrice } = validation.data;

    // 2. Create the booking
    const booking = await prisma.booking.create({
      data: {
        fullName,
        email,
        phone,
        packageName,
        packagePrice,
        status: 'PENDING',
      },
    });

    // 3. Send notification to admin
    await sendBookingNotification({
      bookingId: booking.id,
      fullName,
      email,
      phone,
      packageName,
      packagePrice,
      createdAt: booking.createdAt,
    });

    // 5. Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking received! Our team will contact you shortly via phone or email with the details.',
      bookingId: booking.id,
    });

  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Failed to process booking. Please try again.' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch bookings (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const bookings = await prisma.booking.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
