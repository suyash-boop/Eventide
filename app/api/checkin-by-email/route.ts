import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { email, eventId } = await req.json();
  if (!email || !eventId) {
    return NextResponse.json({ error: "Missing email or eventId" }, { status: 400 });
  }

  const registration = await prisma.registration.findFirst({
    where: {
      event: { id: eventId },
      user: { email }
    }
  });

  if (!registration) {
    return NextResponse.json({ error: "No registration found for this email and event." }, { status: 404 });
  }
  if (registration.checkedIn) {
    return NextResponse.json({ error: "Already checked in." }, { status: 409 });
  }

  await prisma.registration.update({
    where: { id: registration.id },
    data: { checkedIn: true }
  });

  return NextResponse.json({ success: true });
}