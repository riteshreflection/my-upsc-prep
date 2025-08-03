import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { topics, numQuestions = 10 } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDoZ-LCW43aQnqRc00JDrt4S6NmAY7sTlk";
    
    console.log("Generate Test - API Key available:", !!apiKey);
    console.log("API Key length:", apiKey?.length);
    console.log("API Key first 10 chars:", apiKey?.substring(0, 10));
    console.log("Topics:", topics);
    console.log("NumQuestions:", numQuestions);
    console.log("All env vars:", Object.keys(process.env).filter(key => key.includes('GEMINI')));
    
    if (!apiKey) {
      console.log("No API key found for generate-test");
      return NextResponse.json({ error: "Gemini API key not set." }, { status: 500 });
    }
    const prompt = `Generate ${numQuestions} UPSC Prelims MCQ questions in the multi-statement format. Each question should start with 'Consider the following statements:' and list 2–4 statements as an array. The options should be in the format: (a) 1 only, (b) 1 and 2, (c) 2 and 3, (d) 1, 2 and 3. Provide the correct answer and a detailed explanation. Format as JSON: [{question, statements: [..], options: [..], answer, explanation}]. Cover the following topics: ${topics.join(", ")}.`;
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
    const data = await response.json();

    // Debug: log the full Gemini response
    console.log("Gemini raw response:", JSON.stringify(data, null, 2));

    let questions = [];
    try {
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // Remove markdown code block if present
      text = text.replace(/```json|```/g, "").trim();
      questions = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ error: "Failed to parse questions.", content: data, message: e instanceof Error ? e.message : e }, { status: 500 });
    }
    return NextResponse.json({ questions });
  } catch (e) {
    console.error("Error in POST /generate-test:", e);
    return NextResponse.json({ error: "Failed to generate questions.", message: e instanceof Error ? e.message : e }, { status: 500 });
  }
}