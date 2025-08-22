import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/events/[id] - Fetch single event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            location: true,
            website: true
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({
        success: false,
        error: 'Event not found'
      }, { status: 404 });
    }

    // Get related events (same category, excluding current event)
    const relatedEvents = await prisma.event.findMany({
      where: {
        AND: [
          { id: { not: eventId } },
          { category: event.category },
          { isPublic: true }
        ]
      },
      take: 3,
      select: {
        id: true,
        title: true,
        startDate: true,
        image: true,
        category: true,
        location: true
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Transform event data - return organizer as object for details page
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
      // Return organizer as object for the details page
      organizer: {
        name: event.organizer.name || 'Unknown Organizer',
        image: event.organizer.image,
        bio: event.organizer.bio,
        location: event.organizer.location,
        website: event.organizer.website,
        verified: false // Add this if you have a verified field
      },
      organizerId: event.organizerId,
      image: event.image,
      tags: event.tags,
      isPublic: event.isPublic,
      requireApproval: event.requireApproval,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      relatedEvents: relatedEvents.map(rel => ({
        id: rel.id,
        title: rel.title,
        startDate: rel.startDate.toISOString(),
        image: rel.image,
        category: rel.category,
        location: rel.location
      }))
    };

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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    const body = await request.json();
    
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({
        success: false,
        error: 'Event not found'
      }, { status: 404 });
    }

    // Update event
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...body,
        updatedAt: new Date()
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

    // Transform response
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
      organizer: updatedEvent.organizer.name || 'Unknown',
      organizerId: updatedEvent.organizerId,
      image: updatedEvent.image,
      tags: updatedEvent.tags,
      isPublic: updatedEvent.isPublic,
      requireApproval: updatedEvent.requireApproval,
      createdAt: updatedEvent.createdAt.toISOString(),
      updatedAt: updatedEvent.updatedAt.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        event: transformedEvent,
        message: 'Event updated successfully'
      }
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
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json({
        success: false,
        error: 'Event not found'
      }, { status: 404 });
    }

    // Delete event
    await prisma.event.delete({
      where: { id: eventId }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Event deleted successfully'
      }
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}