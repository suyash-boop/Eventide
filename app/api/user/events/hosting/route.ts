import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/user/events/hosting - Get user's hosted events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Hosting events - Session:', session?.user?.email);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true }
    });

    console.log('Found user:', user);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Fetch user's hosted events
    const events = await prisma.event.findMany({
      where: { organizerId: user.id },
      orderBy: { startDate: 'desc' },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: 'APPROVED'
              }
            }
          }
        }
      }
    });

    console.log(`Found ${events.length} events for user ${user.id}`);

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
      attendeeCount: event._count.registrations, // Use _count from registrations
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
    console.error('Error fetching user hosted events:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}