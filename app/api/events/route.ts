import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Creating event - Session:', session?.user?.email);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    // Get the actual user from database using the session email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true }
    });

    console.log('Found user for event creation:', user);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    const body = await request.json();
    console.log('Event creation request body:', body);
    
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      venue,
      eventType,
      category,
      maxAttendees,
      price,
      image,
      tags,
      isPublic,
      requireApproval
    } = body;

    // Validate required fields
    if (!title || !description || !startDate || !endDate || !location || !eventType || !category) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return NextResponse.json({
        success: false,
        error: 'End date must be after start date'
      }, { status: 400 });
    }

    if (start <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Start date must be in the future'
      }, { status: 400 });
    }

    // Create the event with the correct organizerId
    const eventData = {
      title: title.trim(),
      description: description.trim(),
      startDate: start,
      endDate: end,
      location: location.trim(),
      venue: venue?.trim() || null,
      eventType,
      category,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      price: price ? parseFloat(price) : 0,
      image: image?.trim() || null,
      tags: Array.isArray(tags) ? tags : [],
      isPublic: Boolean(isPublic),
      requireApproval: Boolean(requireApproval),
      organizerId: user.id, // Use the actual user ID from the database
      attendeeCount: 0
    };

    console.log('Creating event with data:', eventData);

    const event = await prisma.event.create({
      data: eventData,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    console.log('Event created successfully:', event.id, 'for organizer:', event.organizer.email);

    // Transform the response
    const transformedEvent = {
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
      updatedAt: event.updatedAt.toISOString(),
      organizer: event.organizer
    };

    return NextResponse.json({
      success: true,
      data: { event: transformedEvent },
      message: 'Event created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET /api/events - Get all public events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      isPublic: true,
      startDate: {
        gte: new Date()
      }
    };

    if (category) {
      where.category = category;
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      },
      take: limit,
      skip: offset
    });

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
      updatedAt: event.updatedAt.toISOString(),
      organizer: event.organizer
    }));

    return NextResponse.json({
      success: true,
      data: {
        events: transformedEvents,
        total: events.length
      }
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}