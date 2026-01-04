import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Add interfaces for type safety
interface AnswerData {
  questionId: string;
  answer: string;
}

// POST /api/events/[id]/register - Register for event
export async function POST(
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
    const { answers } = await request.json();

    console.log('Registration attempt for event:', eventId);
    console.log('User:', session.user.email);
    console.log('Answers received:', answers);

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

    // Get event and check if it exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
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

    // Check if event is public or user has access
    if (!event.isPublic) {
      return NextResponse.json({
        success: false,
        error: 'This event is private'
      }, { status: 403 });
    }

    // Check if event has started
    if (new Date(event.startDate) <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Registration is closed for this event'
      }, { status: 400 });
    }

    // Check if user is already registered
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId
        }
      }
    });

    if (existingRegistration) {
      return NextResponse.json({
        success: false,
        error: 'You are already registered for this event'
      }, { status: 400 });
    }

    // Check capacity
    if (event.maxAttendees && event.attendeeCount >= event.maxAttendees) {
      return NextResponse.json({
        success: false,
        error: 'This event is at full capacity'
      }, { status: 400 });
    }

    // Validate required questions
    if (event.questions && event.questions.length > 0) {
      const answersMap = new Map((answers as AnswerData[])?.map((a: AnswerData) => [a.questionId, a.answer]) || []);
      
      for (const question of event.questions) {
        if (question.required) {
          const answer = answersMap.get(question.id);
          if (!answer || answer.trim() === '') {
            return NextResponse.json({
              success: false,
              error: `Please answer the required question: ${question.text}`
            }, { status: 400 });
          }
        }
      }
    }

    // Create registration with answers in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the registration
      const registration = await tx.registration.create({
        data: {
          userId: user.id,
          eventId: eventId,
          status: event.requireApproval ? 'PENDING' : 'APPROVED'
        }
      });

      console.log('Registration created:', registration.id);

      // Create answers if provided - Use registrationAnswer instead of answer
      if (answers && answers.length > 0) {
        const answerData = (answers as AnswerData[])
          .filter((answer: AnswerData) => answer.answer && answer.answer.trim() !== '')
          .map((answer: AnswerData) => ({
            registrationId: registration.id,
            questionId: answer.questionId,
            answer: answer.answer.trim()
          }));

        if (answerData.length > 0) {
          await tx.registrationAnswer.createMany({
            data: answerData
          });
          console.log('Answers created:', answerData.length);
        }
      }

      // Update attendee count if automatically approved
      if (!event.requireApproval) {
        await tx.event.update({
          where: { id: eventId },
          data: { attendeeCount: { increment: 1 } }
        });
        console.log('Attendee count updated');
      }

      return registration;
    });

    console.log('Registration completed successfully');

    const message = event.requireApproval 
      ? 'Registration submitted! You will receive an email once the organizer reviews your application.'
      : 'Registration successful! You will receive a confirmation email shortly.';

    return NextResponse.json({
      success: true,
      message,
      data: {
        registrationId: result.id,
        status: result.status
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Registration failed. Please try again.'
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

    // Check registration status
    const registration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: user.id,
          eventId: eventId
        }
      },
      include: {
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
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        isRegistered: !!registration,
        registration: registration || null
      }
    });

  } catch (error) {
    console.error('Error checking registration status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check registration status'
    }, { status: 500 });
  }
}