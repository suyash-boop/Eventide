import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth"; // adjust path if needed

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ registration: null });
  }
  const registration = await prisma.registration.findFirst({
    where: { userId: session.user.id, eventId: params.id },
    select: { id: true, checkInCode: true }
  });
  return NextResponse.json({ registration });
}