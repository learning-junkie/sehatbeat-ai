import { NextRequest, NextResponse } from "next/server";

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  let symptoms = "";
  let isHindi = false;
  try {
    const body = await req.json();
    symptoms = typeof body.symptoms === "string" ? body.symptoms : String(body.symptoms ?? "");
    isHindi = body.language === "hi";
  } catch {
    isHindi = false;
  }
  console.log("🔥 API HIT:", { symptoms, language: isHindi ? "hi" : "en" });
  console.log("🔑 KEY EXISTS:", !!process.env.GEMINI_API_KEY);

  const fallback = {
    problem: isHindi ? "सेवा अनुपलब्ध" : "Service Unavailable",
    severity: isHindi
      ? "क्षमा करें, मैं केवल स्वास्थ्य संबंधी प्रश्नों में सहायता कर सकता हूं।"
      : "Sorry, I can only help with health-related questions.",
    severityLevel: "info",
    possibleCauses: [],
    possibleConditions: [],
    immediateSteps: [],
    recommendations: [],
    whenToSeekHelp: [],
    specialist: isHindi ? "सामान्य चिकित्सक" : "General Physician",
    doctorDirection: "",
    disclaimer: isHindi
      ? "यह जानकारी केवल सामान्य मार्गदर्शन के लिए है।"
      : "This is for informational purposes only.",
  };

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    console.warn("[analyze-symptoms] GEMINI_API_KEY missing — returning fallback");
    return jsonWithCors(fallback);
  }

  try {
  // ── System prompt ────────────────────────────────────────────────────────────
  const systemPrompt = isHindi
    ? `महत्वपूर्ण: आप SehatBeat AI हैं, एक विशेषज्ञ चिकित्सा सहायक। आप केवल valid JSON object से जवाब दें — कोई अभिवादन नहीं, कोई "मैं कैसे मदद कर सकता हूं" नहीं, कोई सवाल नहीं। सीधे { से शुरू करें और } पर खत्म करें।

जब भी कोई लक्षण बताए, तुरंत विश्लेषण करें। कभी भी "आप कैसे हैं" या "मैं कैसे मदद कर सकता हूं" मत पूछें। हमेशा सीधा चिकित्सा मार्गदर्शन दें।

इसी JSON format में जवाब दें:
{
  "problem": "लक्षणों के आधार पर समस्या का नाम",
  "severity": "गंभीरता का विस्तृत विवरण",
  "severityLevel": "emergency | high | moderate | mild | info",
  "possibleCauses": ["कारण 1", "कारण 2"],
  "possibleConditions": ["संभावित बीमारी 1", "संभावित बीमारी 2"],
  "immediateSteps": ["तुरंत करें 1", "तुरंत करें 2"],
  "recommendations": ["सुझाव 1", "सुझाव 2"],
  "whenToSeekHelp": ["यह होने पर डॉक्टर जाएं"],
  "specialist": "किस विशेषज्ञ से मिलें",
  "doctorDirection": "डॉक्टर के पास कब जाएं, कौन से टेस्ट करवाएं",
  "disclaimer": "यह केवल जानकारी के लिए है। किसी डॉक्टर से परामर्श लें।"
}

टाइपो सुधार: faver=बुखार, hedache=सिरदर्द, pet dard=पेट दर्द। हमेशा समझकर विश्लेषण करें।`
    : `CRITICAL: You are SehatBeat AI, an expert medical triage assistant. You MUST respond ONLY with a valid JSON object — no greetings, no "how can I help", no questions, no preamble, no markdown, no code fences. Start immediately with { and end with }.

When a user describes ANY symptom or health concern, immediately analyze it and return a detailed medical response. NEVER ask follow-up questions. NEVER say "how can I help you". NEVER give generic responses. Always give direct, specific medical guidance.

If the user says "pain in abdomen" — immediately analyze abdominal pain causes, severity, steps.
If the user says "fever" — immediately analyze fever severity, causes, treatment.
If the user says anything health-related — analyze it immediately and completely.

Respond ONLY with this exact JSON structure:
{
  "problem": "specific condition name based on symptoms",
  "severity": "detailed severity description with clinical context",
  "severityLevel": "emergency | high | moderate | mild | info",
  "possibleCauses": ["cause 1", "cause 2", "cause 3"],
  "possibleConditions": ["condition 1", "condition 2", "condition 3"],
  "immediateSteps": ["step 1", "step 2", "step 3"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "whenToSeekHelp": ["warning sign 1", "warning sign 2"],
  "specialist": "specific specialist type e.g. Gastroenterologist",
  "doctorDirection": "when to see doctor, which tests to ask for, what to tell the doctor",
  "disclaimer": "This is informational guidance only. Consult a licensed doctor for diagnosis."
}

severityLevel rules — be specific:
- emergency: chest pain, difficulty breathing, loss of consciousness, severe bleeding, stroke symptoms → doctorDirection must say call 112 NOW
- high: severe pain, high fever above 103F, persistent vomiting → see doctor within 24 hours
- moderate: symptoms lasting 2+ days, moderate pain → see doctor within 3 days
- mild: minor self-limiting symptoms → home care is sufficient

For abdominal pain specifically: identify location (upper/lower/left/right), possible causes (gastritis, appendicitis, IBS, kidney stones etc), red flags to watch for.
For every symptom: be specific, clinical, and actionable. Never be vague.
Typo handling: faver=fever, hedache=headache, stomik=stomach, chst=chest, brekhing=breathing — always interpret and analyze.`;

  // ── Helper: parse AI JSON response ──────────────────────────────────────────
  function parseAIResponse(raw: string) {
    // Extract JSON even if Gemini wraps it in markdown fences or adds extra text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;
    const parsed = JSON.parse(jsonStr);
    // Ensure recommendations mirrors immediateSteps for frontend compatibility
    if (!parsed.recommendations && parsed.immediateSteps) {
      parsed.recommendations = parsed.immediateSteps;
    }
    if (!parsed.possibleConditions) parsed.possibleConditions = [];
    if (!parsed.doctorDirection) parsed.doctorDirection = "";
    return parsed;
  }

  // ── Gemini 1.5 Flash ────────────────────────────────────────────────────────
  try {
    const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nPatient reports: ${symptoms}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      console.log("Gemini status:", geminiRes.status);

      if (!geminiRes.ok) {
        const errorBody = await geminiRes.text().catch(() => "");
        console.error(`[Gemini] Error ${geminiRes.status}:`, errorBody);
        // Return static fallback instead of throwing — never return a 500
        return jsonWithCors(fallback);
      }

      const geminiData = await geminiRes.json();
      const raw: string =
        geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      if (raw) {
        try {
          const parsed = parseAIResponse(raw);
          return jsonWithCors(parsed);
        } catch {
          // JSON parse failed — fall through to static fallback
          console.error("[Gemini] JSON parse failed for raw:", raw.slice(0, 200));
        }
      }
  } catch (error) {
    console.error("[Gemini] API call failed:", error);
    // Gemini failed — fall through to static fallback
  }

  // ── Static fallback ──────────────────────────────────────────────────────────
  return jsonWithCors(fallback);
  } catch (err) {
    console.error("Route error:", err);
    return jsonWithCors(fallback);
  }
}

function jsonWithCors(body: object): NextResponse {
  const res = NextResponse.json(body);
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}
