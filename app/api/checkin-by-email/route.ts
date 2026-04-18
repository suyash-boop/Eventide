import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, eventId } = await req.json();
    const attendeeEmail = typeof email === "string" ? email.trim() : "";
    if (!attendeeEmail || !eventId) {
      return NextResponse.json({ error: "Missing email or eventId" }, { status: 400 });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizer: { email: session.user.email },
      },
      select: { id: true },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found or unauthorized" }, { status: 403 });
    }

    const registration = await prisma.registration.findFirst({
      where: {
        eventId,
        user: {
          email: {
            equals: attendeeEmail,
            mode: "insensitive",
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json({ error: "No registration found for this email and event." }, { status: 404 });
    }
    if (registration.status !== "APPROVED") {
      return NextResponse.json({ error: "Registration is not approved." }, { status: 400 });
    }
    if (registration.checkedIn) {
      return NextResponse.json({ error: "Already checked in." }, { status: 409 });
    }

    await prisma.registration.update({
      where: { id: registration.id },
      data: { checkedIn: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error checking in attendee by email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
