import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// POST /api/events/[id]/register - Register for an event
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    const eventId = params.id;
    const body = await request.json();
    const { answers = [] } = body;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        maxAttendees: true,
        requireApproval: true,
        isPublic: true,
        organizerId: true,
        attendeeCount: true,
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

    // Validation checks
    const validationErrors = [];

    // Check if event is public or user has access
    if (!event.isPublic && event.organizerId !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'This event is private'
      }, { status: 403 });
    }

    // Check if user is trying to register for their own event
    if (event.organizerId === user.id) {
      return NextResponse.json({
        success: false,
        error: 'You cannot register for your own event'
      }, { status: 400 });
    }

    // Check if event has already started
    if (new Date(event.startDate) <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Registration is closed - event has already started'
      }, { status: 400 });
    }

    // Check if event has ended
    if (new Date(event.endDate) <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Cannot register for past events'
      }, { status: 400 });
    }

    // Check if user already registered
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId: eventId,
        userId: user.id
      }
    });

    if (existingRegistration) {
      return NextResponse.json({
        success: false,
        error: 'You are already registered for this event',
        data: {
          registrationStatus: existingRegistration.status
        }
      }, { status: 400 });
    }

    // Check capacity (only for approved registrations)
    if (event.maxAttendees) {
      const approvedRegistrations = await prisma.registration.count({
        where: {
          eventId: eventId,
          status: 'APPROVED'
        }
      });

      if (approvedRegistrations >= event.maxAttendees) {
        // If event requires approval, put on waitlist
        // If not, reject registration
        if (!event.requireApproval) {
          return NextResponse.json({
            success: false,
            error: 'Event is at full capacity'
          }, { status: 400 });
        }
      }
    }

    // Validate required questions
    const requiredQuestions = event.questions.filter(q => q.required);
    for (const question of requiredQuestions) {
      const answer = answers.find((a: any) => a.questionId === question.id);
      if (!answer || !answer.answer || answer.answer.trim() === '') {
        validationErrors.push(`Answer required for: ${question.text}`);
      }
    }

    // Validate answer formats based on question type
    for (const answer of answers) {
      const question = event.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      if (answer.answer && answer.answer.trim() !== '') {
        switch (question.type) {
          case 'EMAIL':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(answer.answer)) {
              validationErrors.push(`Invalid email format for: ${question.text}`);
            }
            break;
          case 'PHONE':
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(answer.answer.replace(/\s|-|\(|\)/g, ''))) {
              validationErrors.push(`Invalid phone format for: ${question.text}`);
            }
            break;
          case 'SELECT':
          case 'RADIO':
            if (question.options && !question.options.includes(answer.answer)) {
              validationErrors.push(`Invalid option selected for: ${question.text}`);
            }
            break;
          case 'CHECKBOX':
            try {
              const selectedOptions = JSON.parse(answer.answer);
              if (!Array.isArray(selectedOptions)) {
                throw new Error('Invalid format');
              }
              for (const option of selectedOptions) {
                if (question.options && !question.options.includes(option)) {
                  validationErrors.push(`Invalid option selected for: ${question.text}`);
                }
              }
            } catch {
              validationErrors.push(`Invalid format for: ${question.text}`);
            }
            break;
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 });
    }

    // Determine initial status
    let initialStatus: 'PENDING' | 'APPROVED' | 'WAITLIST' = 'APPROVED';
    
    if (event.requireApproval) {
      initialStatus = 'PENDING';
    } else if (event.maxAttendees) {
      const approvedCount = await prisma.registration.count({
        where: {
          eventId: eventId,
          status: 'APPROVED'
        }
      });
      
      if (approvedCount >= event.maxAttendees) {
        initialStatus = 'WAITLIST';
      }
    }

    // Create registration in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create registration
      const registration = await tx.registration.create({
        data: {
          userId: user.id,
          eventId: eventId,
          status: initialStatus,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create answers if provided
      if (answers.length > 0) {
        const answerData = answers
          .filter((answer: any) => answer.questionId && answer.answer)
          .map((answer: any) => ({
            registrationId: registration.id,
            questionId: answer.questionId,
            answer: answer.answer.toString()
          }));

        if (answerData.length > 0) {
          await tx.answer.createMany({
            data: answerData
          });
        }
      }

      // Update event attendee count if approved
      if (initialStatus === 'APPROVED') {
        await tx.event.update({
          where: { id: eventId },
          data: {
            attendeeCount: {
              increment: 1
            }
          }
        });
      }

      return registration;
    });

    // Prepare response message
    let message = '';
    switch (initialStatus) {
      case 'APPROVED':
        message = 'Successfully registered for the event!';
        break;
      case 'PENDING':
        message = 'Registration submitted! Waiting for organizer approval.';
        break;
      case 'WAITLIST':
        message = 'Added to waitlist. You\'ll be notified if a spot opens up.';
        break;
    }

    return NextResponse.json({
      success: true,
      data: {
        registrationId: result.id,
        status: initialStatus,
        message: message
      },
      message: message
    }, { status: 201 });

  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET /api/events/[id]/register - Check registration status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
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

    // Check if user is registered
    const registration = await prisma.registration.findFirst({
      where: {
        eventId: eventId,
        userId: user.id
      },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    if (!registration) {
      return NextResponse.json({
        success: true,
        data: {
          isRegistered: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isRegistered: true,
        registration: {
          id: registration.id,
          status: registration.status,
          createdAt: registration.createdAt.toISOString(),
          answers: registration.answers.map(answer => ({
            questionId: answer.questionId,
            questionText: answer.question.text,
            answer: answer.answer
          }))
        }
      }
    });

  } catch (error) {
    console.error('Error checking registration:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}