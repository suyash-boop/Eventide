import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/user/events/registrations - Get user's event registrations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
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

    // Fetch user's registrations
    const registrations = await prisma.registration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          include: {
            organizer: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    });

    // Transform registrations
    const transformedRegistrations = registrations.map(registration => ({
      id: registration.id,
      status: registration.status,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
      event: {
        id: registration.event.id,
        title: registration.event.title,
        description: registration.event.description,
        startDate: registration.event.startDate.toISOString(),
        endDate: registration.event.endDate.toISOString(),
        location: registration.event.location,
        venue: registration.event.venue,
        eventType: registration.event.eventType,
        category: registration.event.category,
        attendeeCount: registration.event.attendeeCount,
        maxAttendees: registration.event.maxAttendees,
        price: registration.event.price,
        organizerId: registration.event.organizerId,
        image: registration.event.image,
        tags: registration.event.tags,
        isPublic: registration.event.isPublic,
        requireApproval: registration.event.requireApproval,
        createdAt: registration.event.createdAt.toISOString(),
        updatedAt: registration.event.updatedAt.toISOString(),
        organizer: registration.event.organizer
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        registrations: transformedRegistrations
      }
    });

  } catch (error) {
    console.error('Error fetching user registrations:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}