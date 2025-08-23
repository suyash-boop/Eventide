import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt || prompt.trim().split(/\s+/).length < 30) {
    return NextResponse.json({ error: "Prompt must be at least 30 words." }, { status: 400 });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  try {
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an assistant that extracts event details from a user's description and returns a JSON object with these fields: title, description, startDate, startTime, endDate, endTime, location, category. Dates and times should be in YYYY-MM-DD and HH:MM (24h) format. If a field is missing, leave it blank.dont use markdown to for json just give it directly.Also extend the description. Example output: {"title":"...","description":"...","startDate":"2025-09-01","startTime":"18:00","endDate":"2025-09-01","endTime":"21:00","location":"...","category":"..."}`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 512,
    });

    let text = chatCompletion.choices?.[0]?.message?.content?.trim();
    console.log("Groq AI raw response:", text); // Debug: log the AI response

    // Remove Markdown code block if present
    if (text?.startsWith("```")) {
      text = text.replace(/```[a-z]*\n?/i, "").replace(/```$/, "").trim();
    }

    let fields = {};
    try {
      fields = JSON.parse(text || "{}");
    } catch (err) {
      console.error("Failed to parse AI response as JSON:", text, err); // Debug: log parse error
      return NextResponse.json({ error: "AI response could not be parsed.", raw: text }, { status: 500 });
    }
    return NextResponse.json({ fields, raw: text }); // Debug: return raw AI response too
  } catch (err) {
    console.error("Groq API error:", err); // Debug: log API error
    return NextResponse.json({ error: "Failed to fill form with AI.", details: String(err) }, { status: 500 });
  }
}