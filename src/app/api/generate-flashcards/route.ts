import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { topic, numCards = 5 } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDoZ-LCW43aQnqRc00JDrt4S6NmAY7sTlk";
    
    console.log("Generate Flashcards - API Key available:", !!apiKey);
    console.log("API Key length:", apiKey?.length);
    console.log("API Key first 10 chars:", apiKey?.substring(0, 10));
    console.log("Topic:", topic);
    console.log("NumCards:", numCards);
    console.log("All env vars:", Object.keys(process.env).filter(key => key.includes('GEMINI')));
    
    if (!apiKey) {
      console.log("No API key found for generate-flashcards");
      return NextResponse.json({ error: "Gemini API key not set." }, { status: 500 });
    }
    
    const prompt = `Generate ${numCards} flash cards for UPSC preparation on the topic: '${topic}'. Each card should have a question and a concise answer/explanation. Format as JSON: [{question, answer}].`;
    
    console.log("Making request to Gemini API...");
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      }),
    });
    
    console.log("Gemini response status:", response.status);
    const data = await response.json();
    console.log("Gemini response data:", JSON.stringify(data, null, 2));
    
    let cards = [];
    try {
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      text = text.replace(/```json|```/g, "").trim();
      cards = JSON.parse(text);
      console.log("Parsed cards:", cards);
    } catch (e) {
      console.log("Error parsing cards:", e);
      return NextResponse.json({ error: "Failed to parse flash cards.", content: data, message: e instanceof Error ? e.message : e }, { status: 500 });
    }
    
    return NextResponse.json({ cards });
  } catch (error) {
    console.log("Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 