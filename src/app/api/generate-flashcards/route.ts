import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { topic, numCards = 5 } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key not set." }, { status: 500 });
  }
  const prompt = `Generate ${numCards} flash cards for UPSC preparation on the topic: '${topic}'. Each card should have a question and a concise answer/explanation. Format as JSON: [{question, answer}].`;
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
  let cards = [];
  try {
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/```json|```/g, "").trim();
    cards = JSON.parse(text);
  } catch (e) {
    return NextResponse.json({ error: "Failed to parse flash cards.", content: data, message: e instanceof Error ? e.message : e }, { status: 500 });
  }
  return NextResponse.json({ cards });
} 