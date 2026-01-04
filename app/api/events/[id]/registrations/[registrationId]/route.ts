import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // updated import
import { prisma } from '@/lib/prisma';
import { RegistrationStatus } from '@prisma/client';

// PATCH /api/events/[id]/registrations/[registrationId] - Update registration status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; registrationId: string }> }
) {
  const { id: eventId, registrationId } = await context.params; // await params

  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const { action } = await request.json();

    if (!['approve', 'reject', 'waitlist'].includes(action)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid action'
      }, { status: 400 });
    }

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

    // Verify event ownership
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: user.id
      }
    });

    if (!event) {
      return NextResponse.json({
        success: false,
        error: 'Event not found or unauthorized'
      }, { status: 404 });
    }

    // Get registration
    const registration = await prisma.registration.findFirst({
      where: {
        id: registrationId,
        eventId: eventId
      }
    });

    if (!registration) {
      return NextResponse.json({
        success: false,
        error: 'Registration not found'
      }, { status: 404 });
    }

    // Check capacity for approval
    if (action === 'approve' && event.maxAttendees) {
      const approvedCount = await prisma.registration.count({
        where: {
          eventId: eventId,
          status: 'APPROVED'
        }
      });

      if (approvedCount >= event.maxAttendees) {
        return NextResponse.json({
          success: false,
          error: 'Event has reached maximum capacity'
        }, { status: 400 });
      }
    }

    // Update registration status - Use Prisma enum types
    const statusMap: Record<string, RegistrationStatus> = {
      approve: RegistrationStatus.APPROVED,
      reject: RegistrationStatus.REJECTED,
      waitlist: RegistrationStatus.WAITLIST
    };

    const updatedRegistration = await prisma.registration.update({
      where: { id: registrationId },
      data: {
        status: statusMap[action],
        updatedAt: new Date()
      }
    });

    // Update event attendee count if approved
    if (action === 'approve' && registration.status !== 'APPROVED') {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          attendeeCount: {
            increment: 1
          }
        }
      });
    } else if (action !== 'approve' && registration.status === 'APPROVED') {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          attendeeCount: {
            decrement: 1
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        registration: {
          id: updatedRegistration.id,
          status: updatedRegistration.status,
          updatedAt: updatedRegistration.updatedAt.toISOString()
        }
      },
      message: `Registration ${action}ed successfully`
    });

  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}