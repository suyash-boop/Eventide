import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_gx221iz91bEkBt',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_secret_key', // Add this to .env
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const { eventId, amount, currency } = await request.json();

    if (!eventId || !amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment details'
      }, { status: 400 });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount, // amount in paisa
      currency: currency || 'INR',
      receipt: `event_${eventId}_${Date.now()}`,
      notes: {
        eventId,
        userEmail: session.user.email
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create payment order'
    }, { status: 500 });
  }
}