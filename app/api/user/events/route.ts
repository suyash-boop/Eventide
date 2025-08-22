import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/user/events - Get user's created events
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

    // Fetch user's events
    const events = await prisma.event.findMany({
      where: { organizerId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    // Transform events
    const transformedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      location: event.location,
      venue: event.venue,
      eventType: event.eventType,
      category: event.category,
      attendeeCount: event.attendeeCount,
      maxAttendees: event.maxAttendees,
      price: event.price,
      organizerId: event.organizerId,
      image: event.image,
      tags: event.tags,
      isPublic: event.isPublic,
      requireApproval: event.requireApproval,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        events: transformedEvents
      }
    });

  } catch (error) {
    console.error('Error fetching user events:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}