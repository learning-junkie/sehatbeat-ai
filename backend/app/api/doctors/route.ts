import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function jsonWithCors(body: object): NextResponse {
  const res = NextResponse.json(body);
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

const GEMINI_PROMPT = `Generate a JSON array of 15 Indian doctors across different specializations. Each doctor must have: id (unique string), name (Indian doctor name with Dr. prefix), specialization (e.g. Cardiologist, Neurologist, Dermatologist, Pediatrician, Orthopedist, Gynecologist, Ophthalmologist, Gastroenterologist, ENT, Psychiatrist), qualifications (e.g. MBBS, MD Cardiology), hospital (real Indian hospital name), city (Indian city), rating (between 4.0 and 5.0), experience (years, between 5 and 25), patients (number like 1000+, 2000+), consultationFee (in INR, realistic), available (today or next week), languages (array, always include Hindi, optionally English), distance (km away, between 0.5 and 10), verified (true). Return ONLY valid JSON array starting with [ and ending with ]. No markdown.`;

export async function GET(): Promise<NextResponse> {
  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return jsonWithCors({ doctors: [] });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: GEMINI_PROMPT }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      return jsonWithCors({ doctors: [] });
    }

    const data = await geminiRes.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : "[]";
    const doctors = JSON.parse(jsonStr);
    return jsonWithCors({ doctors: Array.isArray(doctors) ? doctors : [] });
  } catch {
    return jsonWithCors({ doctors: [] });
  }
}
