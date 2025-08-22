import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in GET profile:', session);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Found user:', user);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in PUT profile:', session);
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    const body = await request.json();
    console.log('Update request body:', body);
    const { name, bio, location, website } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Name is required'
      }, { status: 400 });
    }

    if (website && typeof website === 'string' && website.trim()) {
      // Basic URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      const cleanWebsite = website.trim().toLowerCase();
      
      if (!urlPattern.test(cleanWebsite)) {
        return NextResponse.json({
          success: false,
          error: 'Please enter a valid website URL'
        }, { status: 400 });
      }
    }

    const updateData = {
      name: name.trim(),
      bio: bio?.trim() || null,
      location: location?.trim() || null,
      website: website?.trim() || null,
      updatedAt: new Date()
    };

    console.log('Update data:', updateData);

    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        location: true,
        website: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log('Updated user:', updatedUser);

    return NextResponse.json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}