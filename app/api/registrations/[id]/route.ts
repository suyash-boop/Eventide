import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // changed import
import { prisma } from '@/lib/prisma';

// DELETE /api/registrations/[id] - Cancel event registration
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const registrationId = id;

    // Get user from database
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

    // Check if registration exists and belongs to user
    const registration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        userId: user.id
      },
      include: {
        event: true
      }
    });

    if (!registration) {
      return NextResponse.json({
        success: false,
        error: 'Registration not found'
      }, { status: 404 });
    }

    // Check if event hasn't started yet
    if (new Date(registration.event.startDate) <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Cannot cancel registration for events that have already started'
      }, { status: 400 });
    }

    // Delete registration and update attendee count
    await prisma.$transaction([
      prisma.registration.delete({
        where: { id: registrationId }
      }),
      prisma.event.update({
        where: { id: registration.event.id },
        data: {
          attendeeCount: {
            decrement: registration.status === 'APPROVED' ? 1 : 0
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled successfully'
    });

  } catch (error) {
    console.error('Error canceling registration:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}