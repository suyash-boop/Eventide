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
      requireApproval,
      questions = [] // Add questions to the destructuring
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

    // Create the event with questions in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the event
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
        organizerId: user.id,
        attendeeCount: 0
      };

      console.log('Creating event with data:', eventData);

      const event = await tx.event.create({
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

      // Create questions if provided
      if (questions && questions.length > 0) {
        console.log('Creating questions:', questions);
        
        const questionData = questions.map((q: any, index: number) => ({
          id: q.id || `q_${Date.now()}_${index}`,
          eventId: event.id,
          text: q.text,
          type: q.type,
          required: Boolean(q.required),
          options: q.options || [],
          order: q.order !== undefined ? q.order : index
        }));

        await tx.question.createMany({
          data: questionData
        });

        console.log('Questions created successfully');
      }

      return event;
    });

    console.log('Event created successfully:', result.id, 'for organizer:', result.organizer.email);

    // Transform the response
    const transformedEvent = {
      id: result.id,
      title: result.title,
      description: result.description,
      startDate: result.startDate.toISOString(),
      endDate: result.endDate.toISOString(),
      location: result.location,
      venue: result.venue,
      eventType: result.eventType,
      category: result.category,
      attendeeCount: result.attendeeCount,
      maxAttendees: result.maxAttendees,
      price: result.price,
      organizerId: result.organizerId,
      image: result.image,
      tags: result.tags,
      isPublic: result.isPublic,
      requireApproval: result.requireApproval,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      organizer: result.organizer
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
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const eventType = searchParams.get('eventType');
    const sortBy = searchParams.get('sortBy') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where clause
    const where: any = {
      isPublic: true,
      startDate: {
        gte: new Date() // Only show future events
      }
    };

    // Add search functionality
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
        },
        {
          location: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          category: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    if (category) {
      where.category = category;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: 'desc' };
    
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'startDate':
        orderBy = { startDate: 'asc' };
        break;
      case 'price':
        orderBy = { price: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
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
      image: event.image,
      tags: event.tags,
      createdAt: event.createdAt.toISOString(),
      organizer: event.organizer
    }));

    return NextResponse.json({
      success: true,
      data: {
        events: transformedEvents,
        pagination: {
          page,
          limit,
          total: events.length,
          hasMore: events.length === limit
        }
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