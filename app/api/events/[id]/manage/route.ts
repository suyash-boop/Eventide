import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/events/[id]/manage - Get event with registrations for management
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const eventId = params.id;

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

    // Get event with registrations (only if user is the organizer)
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: user.id
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
                location: true
              }
            },
            answers: {
              include: {
                question: {
                  select: {
                    id: true,
                    text: true,
                    type: true,
                    required: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({
        success: false,
        error: 'Event not found or unauthorized'
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
      organizer: event.organizer
    };

    const transformedRegistrations = event.registrations.map(registration => ({
      id: registration.id,
      status: registration.status,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
      user: registration.user,
      answers: registration.answers.map(answer => ({
        id: answer.id,
        questionId: answer.questionId,
        answer: answer.answer,
        question: answer.question
      }))
    }));

    return NextResponse.json({
      success: true,
      data: {
        event: transformedEvent,
        registrations: transformedRegistrations
      }
    });

  } catch (error) {
    console.error('Error fetching event management data:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}