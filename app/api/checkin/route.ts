import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { checkInCode, eventId } = await req.json();
  if (!checkInCode || !eventId) {
    return NextResponse.json({ error: "Missing code or event" }, { status: 400 });
  }

  const registration = await prisma.registration.findFirst({
    where: { checkInCode, eventId },
  });
  if (!registration) {
    return NextResponse.json({ error: "Invalid or mismatched QR code" }, { status: 404 });
  }
  if (registration.checkedIn) {
    return NextResponse.json({ error: "Already checked in" }, { status: 409 });
  }

  await prisma.registration.update({
    where: { id: registration.id },
    data: { checkedIn: true },
  });

  return NextResponse.json({ success: true });
}