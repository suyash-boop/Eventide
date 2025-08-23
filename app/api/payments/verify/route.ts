import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      eventId
    } = await request.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'your_secret_key')
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment signature'
      }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Store payment record and create registration
    const result = await prisma.$transaction(async (tx) => {
      // Create registration
      const registration = await tx.registration.create({
        data: {
          userId: user.id,
          eventId: eventId,
          status: 'APPROVED' // Auto-approve paid registrations
        }
      });

      // Store payment record (you might want to create a Payment model)
      // For now, we'll just update the event's attendee count
      await tx.event.update({
        where: { id: eventId },
        data: { attendeeCount: { increment: 1 } }
      });

      return registration;
    });

    return NextResponse.json({
      success: true,
      data: {
        registrationId: result.id,
        paymentId: razorpay_payment_id
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({
      success: false,
      error: 'Payment verification failed'
    }, { status: 500 });
  }
}