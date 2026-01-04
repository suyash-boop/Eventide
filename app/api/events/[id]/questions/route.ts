import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Add interface for question data
interface QuestionData {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options: string[];
  order: number;
}

// PUT /api/events/[id]/questions - Update event questions
export async function PUT(
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
    const { questions } = await request.json();

    console.log('Updating questions for event:', eventId);
    console.log('Questions data:', JSON.stringify(questions, null, 2));

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

    // Verify user owns the event
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId: user.id
      }
    });

    if (!event) {
      return NextResponse.json({
        success: false,
        error: 'Event not found or unauthorized'
      }, { status: 404 });
    }

    // Update questions in transaction
    await prisma.$transaction(async (tx) => {
      // Delete existing questions
      await tx.question.deleteMany({
        where: { eventId: eventId }
      });

      // Create new questions if provided
      if (questions && questions.length > 0) {
        const questionData = questions.map((q: QuestionData) => {
          console.log('Processing question:', q);
          
          return {
            id: q.id,
            eventId: eventId,
            text: q.text,
            type: q.type,
            required: Boolean(q.required),
            options: Array.isArray(q.options) ? q.options.filter((opt: string) => opt.trim()) : [],
            order: q.order
          };
        });

        console.log('Creating questions with data:', JSON.stringify(questionData, null, 2));

        await tx.question.createMany({
          data: questionData
        });
      }
    });

    console.log('Questions updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Questions updated successfully'
    });

  } catch (error) {
    console.error('Error updating questions:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET /api/events/[id]/questions - Get event questions
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    const questions = await prisma.question.findMany({
      where: { eventId: eventId },
      orderBy: { order: 'asc' }
    });

    console.log('Retrieved questions:', questions);

    return NextResponse.json({
      success: true,
      data: { questions }
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}