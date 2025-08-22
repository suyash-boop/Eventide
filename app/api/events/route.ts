import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EventType } from '@prisma/client';

// Mock auth function - replace with real auth
function validateAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token || token === 'invalid') {
    return null;
  }
  
  // Mock user - in real app, decode JWT and get actual user
  return {
    id: 'user-1',
    name: 'Current User',
    email: 'user@example.com'
  };
}

// GET /api/events - Fetch all events with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const search = searchParams.get('search')?.toLowerCase() || '';
    const category = searchParams.get('category') || 'all';
    const eventType = searchParams.get('eventType') || 'all';
    const sortBy = searchParams.get('sortBy') || 'date';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({
        success: false,
        error: 'Invalid pagination parameters'
      }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      isPublic: true
    };

    // Add search filter
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { organizer: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Add category filter
    if (category !== 'all') {
      where.category = category;
    }

    // Add event type filter
    if (eventType !== 'all') {
      where.eventType = eventType as EventType;
    }

    // Build order by clause
    let orderBy: any;
    switch (sortBy) {
      case 'date':
        orderBy = { startDate: 'asc' };
        break;
      case 'popular':
        orderBy = { attendeeCount: 'desc' };
        break;
      case 'price-low':
        orderBy = { price: 'asc' };
        break;
      case 'price-high':
        orderBy = { price: 'desc' };
        break;
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { startDate: 'asc' };
    }

    // Get total count for pagination
    const totalEvents = await prisma.event.count({ where });

    // Fetch events with pagination
    const events = await prisma.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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

    // Transform data to match API interface
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
      organizer: event.organizer.name || 'Unknown',
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
        events: transformedEvents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalEvents / limit),
          totalEvents,
          hasNext: page * limit < totalEvents,
          hasPrev: page > 1
        },
        filters: {
          search,
          category,
          eventType,
          sortBy
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

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    // Validate auth token
    const user = validateAuthToken(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Please login to create events'
      }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      { field: 'title', message: 'Event title is required' },
      { field: 'description', message: 'Event description is required' },
      { field: 'startDate', message: 'Start date is required' },
      { field: 'startTime', message: 'Start time is required' },
      { field: 'endDate', message: 'End date is required' },
      { field: 'endTime', message: 'End time is required' },
      { field: 'location', message: 'Event location is required' },
      { field: 'category', message: 'Event category is required' }
    ];

    const validationErrors: string[] = [];

    requiredFields.forEach(({ field, message }) => {
      if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
        validationErrors.push(message);
      }
    });

    // Validate dates
    const startDateTime = new Date(`${body.startDate}T${body.startTime}`);
    const endDateTime = new Date(`${body.endDate}T${body.endTime}`);
    const now = new Date();

    if (isNaN(startDateTime.getTime())) {
      validationErrors.push('Invalid start date/time');
    }
    if (isNaN(endDateTime.getTime())) {
      validationErrors.push('Invalid end date/time');
    }
    if (startDateTime <= now) {
      validationErrors.push('Start date must be in the future');
    }
    if (endDateTime <= startDateTime) {
      validationErrors.push('End date must be after start date');
    }

    // Validate other fields
    if (body.title && body.title.length > 100) {
      validationErrors.push('Title must be less than 100 characters');
    }
    if (body.description && body.description.length > 2000) {
      validationErrors.push('Description must be less than 2000 characters');
    }
    if (body.capacity && (isNaN(parseInt(body.capacity)) || parseInt(body.capacity) < 1)) {
      validationErrors.push('Capacity must be a positive number');
    }
    if (body.price && (isNaN(parseFloat(body.price)) || parseFloat(body.price) < 0)) {
      validationErrors.push('Price must be a non-negative number');
    }

    // Validate category
    const validCategories = ['Technology', 'Business', 'Arts', 'Sports', 'Education', 'Health', 'Music', 'Food', 'Other'];
    if (body.category && !validCategories.includes(body.category)) {
      validationErrors.push('Invalid category');
    }

    // Validate event type
    const validEventTypes = ['IN_PERSON', 'ONLINE', 'HYBRID'];
    if (body.eventType && !validEventTypes.includes(body.eventType)) {
      validationErrors.push('Invalid event type');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 });
    }

    // Ensure user exists in database (create if not exists)
    const dbUser = await prisma.user.upsert({
      where: { 
        email: user.email 
      },
      update: {
        name: user.name
      },
      create: {
        email: user.email,
        name: user.name
      }
    });

    console.log('Creating event with user:', dbUser.id);

    // Create new event in database
    const newEvent = await prisma.event.create({
      data: {
        title: body.title.trim(),
        description: body.description.trim(),
        startDate: startDateTime,
        endDate: endDateTime,
        location: body.location.trim(),
        venue: body.venue?.trim() || null,
        eventType: (body.eventType || 'IN_PERSON') as EventType,
        category: body.category,
        maxAttendees: body.capacity ? parseInt(body.capacity) : null,
        price: body.price ? parseFloat(body.price) : 0,
        image: body.image || null,
        isPublic: body.isPublic !== false,
        requireApproval: body.requireApproval === true,
        organizerId: dbUser.id, // Use the database user ID
        tags: body.tags || []
      },
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

    console.log('Event created successfully:', newEvent.id);

    // Transform response
    const transformedEvent = {
      id: newEvent.id,
      title: newEvent.title,
      description: newEvent.description,
      startDate: newEvent.startDate.toISOString(),
      endDate: newEvent.endDate.toISOString(),
      location: newEvent.location,
      venue: newEvent.venue,
      eventType: newEvent.eventType,
      category: newEvent.category,
      attendeeCount: newEvent.attendeeCount,
      maxAttendees: newEvent.maxAttendees,
      price: newEvent.price,
      organizer: newEvent.organizer.name || 'Unknown',
      organizerId: newEvent.organizerId,
      image: newEvent.image,
      tags: newEvent.tags,
      isPublic: newEvent.isPublic,
      requireApproval: newEvent.requireApproval,
      createdAt: newEvent.createdAt.toISOString(),
      updatedAt: newEvent.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        event: transformedEvent,
        message: 'Event created successfully'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating event:', error);
    console.error('Error details:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON data'
      }, { status: 400 });
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any;
      if (prismaError.code === 'P2002') {
        return NextResponse.json({
          success: false,
          error: 'A unique constraint failed'
        }, { status: 400 });
      }
      if (prismaError.code === 'P2003') {
        return NextResponse.json({
          success: false,
          error: 'Foreign key constraint failed'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.toString() : undefined
    }, { status: 500 });
  }
}