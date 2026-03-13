import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { symptoms, language } = await req.json();
  const isHindi = language === "hi";

  // FIX 1 — Log every incoming request so we can confirm backend receives it
  console.log("SehatBeat API hit:", { symptoms, language });

  // ── Fallbacks ────────────────────────────────────────────────────────────────
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

  // ── System prompt ────────────────────────────────────────────────────────────
  const systemPrompt = isHindi
    ? `आप SehatBeat AI हैं — एक विशेषज्ञ, सहानुभूतिपूर्ण भारतीय चिकित्सा सहायक।
नीचे दिए गए JSON प्रारूप में ही जवाब दें। JSON के बाहर कुछ भी मत लिखें।
महत्वपूर्ण: यदि उपयोगकर्ता ने गलत वर्तनी की है या टाइपो किया है, तो उसे समझकर सही करें और फिर विश्लेषण करें। कभी भी गलत वर्तनी के कारण प्रश्न को अस्वीकार न करें। उदाहरण: faver=fever, hedache=headache, stomik=stomach, chst=chest, brakhing=breathing।

JSON schema:
{
  "problem": "संभावित स्वास्थ्य समस्या",
  "severity": "गंभीरता का विस्तृत विवरण",
  "severityLevel": "emergency | high | moderate | mild | info",
  "possibleCauses": ["कारण 1", "कारण 2"],
  "possibleConditions": ["संभावित बीमारी 1", "संभावित बीमारी 2"],
  "immediateSteps": ["तुरंत करें 1", "तुरंत करें 2"],
  "recommendations": ["सुझाव 1", "सुझाव 2"],
  "whenToSeekHelp": ["यह होने पर डॉक्टर के पास जाएं"],
  "specialist": "किस विशेषज्ञ से मिलें",
  "doctorDirection": "डॉक्टर के पास कब और क्यों जाएं, कौन से टेस्ट करवाएं",
  "disclaimer": "चिकित्सा अस्वीकरण"
}

severityLevel नियम:
- emergency: सीने में दर्द, सांस न आना, बेहोशी, लकवा → doctorDirection में 112 और तुरंत अस्पताल लिखें
- high: तेज बुखार, गंभीर दर्द → 24 घंटे में डॉक्टर
- moderate: 2+ दिन से लक्षण → 3 दिन में डॉक्टर
- mild: हल्के लक्षण → घरेलू उपाय पर्याप्त`

    : `You are SehatBeat AI — an expert, empathetic Indian medical assistant.
Respond ONLY in valid JSON matching the schema below. Nothing outside the JSON.
IMPORTANT: If the user made spelling mistakes or typos, intelligently correct them before analysis. Common corrections: faver/fver=fever, hedache/headche=headache, chst/chset=chest, brakhing/brething=breathing, stomik/stomic=stomach, thoat=throat, coff=cough, diarea=diarrhea, vomit/vommit=vomiting, weekness=weakness, dizznes=dizziness. Never reject or fail a query due to spelling errors — always interpret the most likely intended symptom and analyze it.
Provide thorough, detailed medical analysis in English.

JSON schema (all fields required):
{
  "problem": "Name of the likely health condition",
  "severity": "Detailed severity description with clinical context",
  "severityLevel": "emergency | high | moderate | mild | info",
  "possibleCauses": ["Cause 1", "Cause 2", "Cause 3"],
  "possibleConditions": ["Possible condition 1", "Possible condition 2"],
  "immediateSteps": ["Step 1", "Step 2", "Step 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "whenToSeekHelp": ["Warning sign 1", "Warning sign 2"],
  "specialist": "Specific type of specialist (e.g. Cardiologist, not just Doctor)",
  "doctorDirection": "When and why to see a doctor, which tests to ask for (e.g. CBC, ECG, X-ray), what to tell the doctor",
  "disclaimer": "Medical disclaimer"
}

severityLevel rules:
- emergency: chest pain, breathing difficulty, unconsciousness, stroke, severe bleeding → doctorDirection MUST say call 112 and go to nearest hospital NOW
- high: fever >103F, severe pain, persistent vomiting → see doctor within 24 hours
- moderate: symptoms 2+ days, worsening → see doctor within 3 days
- mild: minor self-limiting symptoms → home remedies sufficient

For doctorDirection always include: urgency timeline, specific tests to request, what to describe to doctor.
For specialist be specific: Cardiologist, Pulmonologist, Gastroenterologist, ENT, Dermatologist, General Physician etc.`;

  // ── Helper: parse AI JSON response ──────────────────────────────────────────
  function parseAIResponse(raw: string) {
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    // Ensure recommendations mirrors immediateSteps for frontend compatibility
    if (!parsed.recommendations && parsed.immediateSteps) {
      parsed.recommendations = parsed.immediateSteps;
    }
    if (!parsed.possibleConditions) parsed.possibleConditions = [];
    if (!parsed.doctorDirection) parsed.doctorDirection = "";
    return parsed;
  }

  // ── Try Gemini first ─────────────────────────────────────────────────────────
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (GEMINI_KEY) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const raw: string =
          geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

        if (raw) {
          try {
            const parsed = parseAIResponse(raw);
            return NextResponse.json(parsed);
          } catch {
            // JSON parse failed — fall through to Perplexity
          }
        }
      }
    } catch (err) {
      // FIX 7 — Log Gemini failures; never let it throw
      console.warn("Gemini call failed, falling back to Perplexity:", err);
    }
  } else {
    // FIX 7 — Warn if key is missing
    console.warn("GEMINI_API_KEY not set — skipping Gemini");
  }

  // ── Fallback: Perplexity ─────────────────────────────────────────────────────
  const PERPLEXITY_KEY = process.env.PERPLEXITY_API_KEY;

  if (PERPLEXITY_KEY) {
    try {
      const response = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: symptoms },
          ],
          max_tokens: 1024,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const raw: string = data.choices?.[0]?.message?.content ?? "";

        if (raw) {
          try {
            const parsed = parseAIResponse(raw);
            return NextResponse.json(parsed);
          } catch {
            // Not valid JSON — wrap plain text response
            return NextResponse.json({
              ...fallback,
              problem: isHindi ? "लक्षण विश्लेषण" : "Symptom Analysis",
              severity: raw,
              severityLevel: "info",
            });
          }
        }
      }
    } catch (err) {
      // FIX 7 — Log Perplexity failures; never let it throw
      console.warn("Perplexity call failed, using static fallback:", err);
    }
  } else {
    // FIX 7 — Warn if Perplexity key is missing
    console.warn("PERPLEXITY_API_KEY not set — using static fallback");
  }

  // ── Static fallback — always returns valid JSON, never a 500 ────────────────
  return NextResponse.json(fallback);
}