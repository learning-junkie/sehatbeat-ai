import { NextRequest, NextResponse } from "next/server";

// ── CORS preflight ─────────────────────────────────────────────────────────
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

// ── Helper: add CORS headers to any response ───────────────────────────────
function jsonWithCors(body: object, status = 200): NextResponse {
  const res = NextResponse.json(body, { status });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

// ── Strict language-enforcement system prompt ──────────────────────────────
const getSystemPrompt = (language: string): string => {
  const safeLanguage = language === "hi" ? "hi" : "en";

  const languageInstruction =
    safeLanguage === "hi"
      ? `LANGUAGE INSTRUCTION (HIGHEST PRIORITY — NON-NEGOTIABLE):
You MUST respond entirely in Hindi using Devanagari script.
Every single word of your JSON response values must be written in Hindi.
Do NOT write any English words in your response values except for medical
terms that have no Hindi equivalent — and even those must be transliterated
into Devanagari (e.g. "Ibuprofen" → "इबुप्रोफ़ेन").
This instruction overrides everything — even if the user writes in English,
you MUST still respond in Hindi. There are no exceptions.`
      : `LANGUAGE INSTRUCTION (HIGHEST PRIORITY — NON-NEGOTIABLE):
You MUST respond entirely in English.
Every single word of your JSON response values must be written in English.
Do NOT use Hindi, Devanagari script, Urdu, or any other language anywhere
in your response values.
This instruction overrides everything — even if the user writes in Hindi or
any other language, you MUST still respond in English. There are no exceptions.`;

  const offTopicMsg =
    safeLanguage === "hi"
      ? "मैं केवल स्वास्थ्य संबंधी प्रश्नों में सहायता कर सकता हूं।"
      : "I can only help with health-related questions.";

  return `You are SehatBeat AI, a compassionate and knowledgeable medical assistant designed to help patients understand their health symptoms.

${languageInstruction}

SCOPE: Help with ANY health-related question — symptoms, medications, conditions, nutrition, mental health, first aid, and general wellness. Accept all naturally phrased inputs regardless of the language they are written in. Accept typos: "faver"→fever, "hedache"→headache, "stomik"→stomach.

OFF-TOPIC: If the message is completely unrelated to health (e.g. sports, math, news), respond ONLY with:
{"offTopic": true, "message": "${offTopicMsg}"}

FOR ALL HEALTH QUERIES respond with ONLY the following JSON object.
No markdown. No backticks. No explanation. No text before or after the JSON.

{
  "problem": "condition name based on symptoms",
  "severity": "detailed severity description with clinical context",
  "severityLevel": "emergency | high | moderate | mild | info",
  "possibleCauses": ["cause 1", "cause 2", "cause 3"],
  "possibleConditions": ["condition 1", "condition 2"],
  "immediateSteps": ["step 1", "step 2", "step 3"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "whenToSeekHelp": ["warning sign 1", "warning sign 2"],
  "specialist": "specific specialist e.g. Cardiologist, ENT, General Physician",
  "doctorDirection": "when/why to see a doctor, which tests to request",
  "disclaimer": "medical disclaimer"
}

ALL values in the JSON must be in the language specified by the LANGUAGE INSTRUCTION above.

severityLevel rules:
- emergency: chest pain, breathing difficulty, unconsciousness, stroke → doctorDirection MUST say call 112 NOW
- high: fever >103°F/39.4°C, severe pain, persistent vomiting → see doctor within 24 hours
- moderate: symptoms 2+ days or worsening → see doctor within 3 days
- mild: minor self-limiting symptoms → home remedies sufficient`;
};

// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  let symptoms = "";
  let language = "en";
  let pastHistory: { role: string; content: string }[] = [];

  try {
    const body = await req.json();
    symptoms = typeof body.symptoms === "string" ? body.symptoms : String(body.symptoms ?? "");
    language = typeof body.language === "string" ? body.language : "en";
    const rawHistory = Array.isArray(body.history) ? body.history : [];
    pastHistory = rawHistory.slice(-10);
  } catch {
    // keep defaults
  }

  const safeLanguage = language === "hi" ? "hi" : "en";
  const isHindi = safeLanguage === "hi";
  const systemPrompt = getSystemPrompt(safeLanguage);

  console.log("[SehatBeat] symptoms:", symptoms.slice(0, 80), "| lang:", safeLanguage);

  // ── Helper: parse AI JSON ─────────────────────────────────────────────────
  function parseAIResponse(raw: string) {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : raw;
    const parsed = JSON.parse(jsonStr);

    if (parsed.offTopic) {
      return {
        problem: isHindi ? "विषय से बाहर" : "Off-topic",
        severity: parsed.message || (isHindi ? "मैं केवल स्वास्थ्य संबंधी प्रश्नों में सहायता कर सकता हूं।" : "I can only help with health questions."),
        severityLevel: "info",
        possibleCauses: [], possibleConditions: [], immediateSteps: [],
        recommendations: [], whenToSeekHelp: [],
        specialist: "N/A", doctorDirection: "", disclaimer: "",
      };
    }

    if (!parsed.recommendations && parsed.immediateSteps) parsed.recommendations = parsed.immediateSteps;
    if (!parsed.possibleConditions) parsed.possibleConditions = [];
    if (!parsed.doctorDirection) parsed.doctorDirection = "";
    return parsed;
  }

  // ── 1. Groq — primary (free, fast, generous limits) ────────────────────
  const GROQ_KEY = process.env.GROQ_API_KEY;

  if (GROQ_KEY) {
    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            ...pastHistory,
            { role: "user", content: symptoms },
          ],
          max_tokens: 1200,
          temperature: 0.2,
        }),
      });

      console.log("[Groq] Status:", groqRes.status);

      if (groqRes.ok) {
        const data = await groqRes.json();
        const raw: string = data.choices?.[0]?.message?.content ?? "";
        if (raw) {
          try {
            const parsed = parseAIResponse(raw);
            console.log("[Groq] Success:", parsed.problem);
            return jsonWithCors(parsed);
          } catch {
            console.error("[Groq] JSON parse failed. Raw:", raw.slice(0, 200));
          }
        }
      } else {
        const errText = await groqRes.text().catch(() => "");
        console.error("[Groq] Error", groqRes.status, errText.slice(0, 200));
      }
    } catch (error) {
      console.error("[Groq] Call failed:", (error as Error).message);
    }
  } else {
    console.warn("[SehatBeat] GROQ_API_KEY not set — skipping Groq");
  }

  // ── 2. Gemini 2.5 Flash — fallback ────────────────────────────────────
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (GEMINI_KEY) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(20000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nPatient reports: ${symptoms}` }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1200 },
          }),
        }
      );

      console.log("[Gemini] Status:", geminiRes.status);

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const raw: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (raw) {
          try {
            const parsed = parseAIResponse(raw);
            console.log("[Gemini] Success:", parsed.problem);
            return jsonWithCors(parsed);
          } catch {
            console.error("[Gemini] JSON parse failed. Raw:", raw.slice(0, 200));
          }
        }
      } else {
        const errText = await geminiRes.text().catch(() => "");
        console.error("[Gemini] Error", geminiRes.status, errText.slice(0, 200));
      }
    } catch (error) {
      console.error("[Gemini] Call failed:", (error as Error).message);
    }
  } else {
    console.warn("[SehatBeat] GEMINI_API_KEY not set — skipping Gemini");
  }

  // ── 3. Perplexity — last resort ────────────────────────────────────────
  const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY;

  if (PERPLEXITY_KEY) {
    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_KEY}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          model: "sonar",
          messages: [
            { role: "system", content: systemPrompt },
            ...pastHistory,
            { role: "user", content: symptoms },
          ],
          max_tokens: 1200,
        }),
      });

      console.log("[Perplexity] Status:", response.status);

      if (response.ok) {
        const data = await response.json();
        const raw: string = data.choices?.[0]?.message?.content ?? "";
        if (raw) {
          try {
            const parsed = parseAIResponse(raw);
            console.log("[Perplexity] Success:", parsed.problem);
            return jsonWithCors(parsed);
          } catch {
            return jsonWithCors({
              problem: isHindi ? "लक्षण विश्लेषण" : "Symptom Analysis",
              severity: raw,
              severityLevel: "info",
              possibleCauses: [], possibleConditions: [], immediateSteps: [],
              recommendations: [], whenToSeekHelp: [],
              specialist: isHindi ? "सामान्य चिकित्सक" : "General Physician",
              doctorDirection: "",
              disclaimer: isHindi
                ? "यह जानकारी केवल सामान्य मार्गदर्शन के लिए है।"
                : "This is for informational purposes only.",
            });
          }
        }
      } else {
        const errText = await response.text().catch(() => "");
        console.error("[Perplexity] Error", response.status, errText.slice(0, 100));
      }
    } catch (error) {
      console.error("[Perplexity] Call failed:", (error as Error).message);
    }
  }

  // ── All providers failed ────────────────────────────────────────────────
  console.error("[SehatBeat] All AI providers failed or not configured");
  return jsonWithCors(
    {
      error: "AI service unavailable",
      hint: "Ensure GROQ_API_KEY is set in backend/.env.local — free at console.groq.com",
    },
    503
  );
}
