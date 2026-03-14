import { NextRequest, NextResponse } from "next/server";

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

  const isHindi = language === "hi";
  console.log("[SehatBeat] symptoms:", symptoms.slice(0, 80), "| lang:", language);

  // ── System prompt ───────────────────────────────────────────────────────────
  const systemPrompt = `You are SehatBeat AI, a compassionate medical assistant for patients in India.

LANGUAGE RULE: Auto-detect the user's language and respond in the SAME language.
- Hindi (Devanagari) → respond in Hindi
- Romanized Hindi / Hinglish → respond in Hindi or English naturally
- English → respond in English

SCOPE: Help with any health question — symptoms, medications, conditions, nutrition, mental health, first aid, wellness.
Accept casual phrasing: "I have a headache", "mujhe bukhar hai", "मुझे सिरदर्द है", "feeling tired".
Do not be overly literal — understand intent. Accept typos: "faver"→fever, "hedache"→headache.

OFF-TOPIC: Only if completely unrelated to health (e.g. sports, math, politics), respond:
{"offTopic": true, "message": "${isHindi ? "मैं केवल स्वास्थ्य संबंधी प्रश्नों में सहायता कर सकता हूं।" : "I can only help with health-related questions."}"}

FOR ALL HEALTH QUERIES: Respond ONLY with valid JSON — no markdown, no code fences, no preamble.

JSON schema (respond in user's language):
{
  "problem": "condition name",
  "severity": "detailed severity description",
  "severityLevel": "emergency | high | moderate | mild | info",
  "possibleCauses": ["cause 1", "cause 2"],
  "possibleConditions": ["condition 1", "condition 2"],
  "immediateSteps": ["step 1", "step 2"],
  "recommendations": ["rec 1", "rec 2"],
  "whenToSeekHelp": ["warning 1", "warning 2"],
  "specialist": "specific specialist type",
  "doctorDirection": "when/why to see a doctor, which tests to ask for",
  "disclaimer": "medical disclaimer"
}

severityLevel rules:
- emergency: chest pain, no breathing, unconsciousness → mention 112 in doctorDirection
- high: fever >103°F, severe pain → see doctor within 24 hours
- moderate: symptoms 2+ days → see doctor within 3 days
- mild: minor symptoms → home remedies`;

  // ── Helper: parse AI JSON ───────────────────────────────────────────────────
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

  // ── 1. Try Groq (free, fast, generous limits) ─────────────────────────────
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
            return NextResponse.json(parsed);
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
    console.warn("[SehatBeat] GROQ_API_KEY not set");
  }

  // ── 2. Fallback: Gemini 2.5 Flash ─────────────────────────────────────────
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
            return NextResponse.json(parsed);
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
    console.warn("[SehatBeat] GEMINI_API_KEY not set");
  }

  // ── 3. Fallback: Perplexity ────────────────────────────────────────────────
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
            return NextResponse.json(parsed);
          } catch {
            return NextResponse.json({
              problem: isHindi ? "लक्षण विश्लेषण" : "Symptom Analysis",
              severity: raw,
              severityLevel: "info",
              possibleCauses: [], possibleConditions: [], immediateSteps: [],
              recommendations: [], whenToSeekHelp: [],
              specialist: isHindi ? "सामान्य चिकित्सक" : "General Physician",
              doctorDirection: "",
              disclaimer: isHindi ? "यह जानकारी केवल सामान्य मार्गदर्शन के लिए है।" : "This is for informational purposes only.",
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

  // ── No provider worked ─────────────────────────────────────────────────────
  console.error("[SehatBeat] All AI providers failed or not configured");
  return NextResponse.json(
    {
      error: "AI service unavailable",
      hint: "Add GROQ_API_KEY to backend/.env.local — free at console.groq.com",
    },
    { status: 503 }
  );
}