import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { subject } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not set." }, { status: 500 });
  }
  const prompt = `List the most important and relevant topics for UPSC preparation under the subject '${subject}'. Format as a JSON array of strings.`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ]
    }),
  });
  const data = await response.json();
  let topics = [];
  try {
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json|```/g, "").trim();
    topics = JSON.parse(text);
  } catch (e) {
    return NextResponse.json({ error: "Failed to parse topics.", content: data, message: e instanceof Error ? e.message : e }, { status: 500 });
  }
  return NextResponse.json({ topics });
} 