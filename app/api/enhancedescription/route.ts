import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  const { description } = await req.json();
  if (!description) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an assistant that rewrites event descriptions to be more engaging and clear, keeping the original intent.",
        },
        {
          role: "user",
          content: `Enhance this event description:\n${description}`,
        },
      ],
      max_tokens: 512,
    });

    const enhanced = chatCompletion.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ enhanced });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to enhance description." }, { status: 500 });
  }
}