import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // use shared authOptions
import { prisma } from '@/lib/prisma';

// GET /api/events/[id] - Get specific event
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // await params

  try {
    const eventId = id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            location: true,
            website: true
          }
        },
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!event) {
      return NextResponse.json({
        success: false,
        error: 'Event not found'
      }, { status: 404 });
    }

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
      organizer: event.organizer,
      questions: event.questions || [] // Make sure questions are included
    };

    console.log('Event fetched with questions:', transformedEvent.questions); // Debug log

    return NextResponse.json({
      success: true,
      data: {
        event: transformedEvent
      }
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/events/[id] - Update event
export async function PUT(
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

    const eventId = id;

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
    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: user.id
      }
    });

    if (!existingEvent) {
      return NextResponse.json({
        success: false,
        error: 'Event not found or unauthorized'
      }, { status: 404 });
    }

    const body = await req.json();
    
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

    // Update the event
    const updateData = {
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
      updatedAt: new Date()
    };

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
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

    // Transform the response
    const transformedEvent = {
      id: updatedEvent.id,
      title: updatedEvent.title,
      description: updatedEvent.description,
      startDate: updatedEvent.startDate.toISOString(),
      endDate: updatedEvent.endDate.toISOString(),
      location: updatedEvent.location,
      venue: updatedEvent.venue,
      eventType: updatedEvent.eventType,
      category: updatedEvent.category,
      attendeeCount: updatedEvent.attendeeCount,
      maxAttendees: updatedEvent.maxAttendees,
      price: updatedEvent.price,
      organizerId: updatedEvent.organizerId,
      image: updatedEvent.image,
      tags: updatedEvent.tags,
      isPublic: updatedEvent.isPublic,
      requireApproval: updatedEvent.requireApproval,
      createdAt: updatedEvent.createdAt.toISOString(),
      updatedAt: updatedEvent.updatedAt.toISOString(),
      organizer: updatedEvent.organizer
    };

    return NextResponse.json({
      success: true,
      data: { event: transformedEvent },
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE /api/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await context.params;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const event = await prisma.event.findFirst({
      where: { id: eventId, organizerId: user.id }
    });

    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found or unauthorized' }, { status: 404 });
    }

    await prisma.$transaction([
      // prisma.answer.deleteMany({
      //   where: { registration: { eventId } }
      // }),
      prisma.registration.deleteMany({ where: { eventId } }),
      prisma.question.deleteMany({ where: { eventId } }),
      prisma.event.delete({ where: { id: eventId } })
    ]);

    return NextResponse.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}