import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  const { event } = await req.json();
  if (!event) {
    return NextResponse.json({ error: "Missing event details" }, { status: 400 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an assistant that writes engaging LinkedIn posts for users who attended an event. Write a first-person post celebrating the experience, mentioning the event title, location, and a positive takeaway. Keep it professional, concise, and suitable for LinkedIn.`
        },
        {
          role: "user",
          content: `Event details:\nTitle: ${event.title}\nDescription: ${event.description}\nLocation: ${event.location}\nStart: ${event.startDate}\nEnd: ${event.endDate}`
        }
      ],
      max_tokens: 300,
    });

    const post = chatCompletion.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ post });
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate post." }, { status: 500 });
  }
}