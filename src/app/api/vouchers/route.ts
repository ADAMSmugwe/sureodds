import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { sendVoucherEmail } from '@/lib/notifications';

// Generate a random voucher code
function generateVoucherCode(planType: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${planType.toUpperCase()}-${code}`;
}

// GET - List all vouchers (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'all', 'active', 'redeemed', 'expired'

    let where: any = {};
    
    if (status === 'active') {
      where = {
        isRedeemed: false,
        expiresAt: { gte: new Date() },
      };
    } else if (status === 'redeemed') {
      where = { isRedeemed: true };
    } else if (status === 'expired') {
      where = {
        isRedeemed: false,
        expiresAt: { lt: new Date() },
      };
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vouchers);
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

// POST - Create new voucher (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, planType } = await request.json();

    if (!email || !planType) {
      return NextResponse.json({ error: 'Email and plan type are required' }, { status: 400 });
    }

    // Validate plan type
    if (!['DAILY', 'WEEKLY', 'MONTHLY'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Generate unique code
    let code = generateVoucherCode(planType);
    let exists = await prisma.voucher.findUnique({ where: { code } });
    while (exists) {
      code = generateVoucherCode(planType);
      exists = await prisma.voucher.findUnique({ where: { code } });
    }

    // Set expiry (7 days from now for the voucher code itself)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create voucher
    const voucher = await prisma.voucher.create({
      data: {
        code,
        planType,
        email,
        expiresAt,
      },
    });

    // Send email with the voucher code
    await sendVoucherEmail({
      email,
      code,
      planType,
      expiresAt,
    });

    return NextResponse.json(voucher, { status: 201 });
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 });
  }
}
