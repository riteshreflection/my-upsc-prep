import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { subject } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDoZ-LCW43aQnqRc00JDrt4S6NmAY7sTlk";
    
    console.log("Generate Topics - API Key available:", !!apiKey);
    console.log("API Key length:", apiKey?.length);
    console.log("API Key first 10 chars:", apiKey?.substring(0, 10));
    console.log("Subject:", subject);
    console.log("All env vars:", Object.keys(process.env).filter(key => key.includes('GEMINI')));
    
    if (!apiKey) {
      console.log("No API key found for generate-topics");
      return NextResponse.json({ error: "Gemini API key not set." }, { status: 500 });
    }
    
    const prompt = `List the most important and relevant topics for UPSC preparation under the subject '${subject}'. Format as a JSON array of strings.`;
    
    console.log("Making request to Gemini API for topics...");
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
    
    console.log("Gemini topics response status:", response.status);
    const data = await response.json();
    console.log("Gemini topics response data:", JSON.stringify(data, null, 2));
    
    let topics = [];
    try {
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      text = text.replace(/```json|```/g, "").trim();
      topics = JSON.parse(text);
      console.log("Parsed topics:", topics);
    } catch (e) {
      console.log("Error parsing topics:", e);
      return NextResponse.json({ error: "Failed to parse topics.", content: data, message: e instanceof Error ? e.message : e }, { status: 500 });
    }
    
    return NextResponse.json({ topics });
  } catch (error) {
    console.log("Unexpected error in generate-topics:", error);
    return NextResponse.json({ error: "Internal server error", message: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 