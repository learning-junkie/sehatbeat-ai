import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { symptoms, language } = await req.json();
  const text = String(symptoms || "").toLowerCase();
  const isHindi = language === "hi";

  // STEP 1: classify severity based on keywords
  const criticalKeywords = [
    "chest pain",
    "severe chest",
    "breath",
    "difficulty breathing",
    "cant breathe",
    "can't breathe",
    "shortness of breath",
    "severe bleeding",
    "a lot of blood",
    "unconscious",
    "fainted",
    "not waking",
    "snake bite",
    "snakebite",
    "dog bite",
    "animal bite",
    "high fever 2 days",
    "high fever 48",
    "fever 2 days",
    "fever 3 days",
    "fever 4 days",
    "very high fever",
    "seizure",
    "fits",
    "stroke",
    "sudden weakness one side",
    "head injury",
    "road accident",
  ];

  const minorKeywords = [
    "cold",
    "common cold",
    "cough",
    "runny nose",
    "sore throat",
    "mild fever",
    "headache",
    "mild headache",
    "tired",
    "fatigue",
    "body pain",
    "body ache",
    "small cut",
    "minor cut",
    "scratch",
  ];

  const isCritical = criticalKeywords.some((k) => text.includes(k));
  const isMinor = !isCritical && minorKeywords.some((k) => text.includes(k));

  // If text is empty, or we are unsure, treat as critical as per constraints
  const finalSeverity: "critical" | "minor" =
    !text || (!isCritical && !isMinor) ? "critical" : isCritical ? "critical" : "minor";

  // STEP 2: respond based on severity
  if (finalSeverity === "critical") {
    const msg = isHindi
      ? "यह गंभीर स्थिति हो सकती है। कृपया तुरंत नज़दीकी स्वास्थ्य केंद्र या अस्पताल जाएँ। घर पर इलाज करने की कोशिश न करें।"
      : "This may be serious. Please go to the nearest healthcare center or hospital immediately. Do not rely on home treatment.";

    return NextResponse.json({
      problem: isHindi ? "संभावित आपात स्थिति" : "Possible emergency",
      severity: isHindi ? "उच्च गंभीरता" : "High severity",
      severityLevel: "emergency",
      possibleCauses: [],
      possibleConditions: [],
      immediateSteps: [],
      recommendations: [msg],
      whenToSeekHelp: [],
      specialist: isHindi ? "नज़दीकी अस्पताल" : "Nearest hospital or clinic",
      doctorDirection: msg,
      disclaimer: isHindi
        ? "मैं सिर्फ प्रारंभिक सलाह दे सकता/सकती हूँ। कृपया तुरंत डॉक्टर से संपर्क करें।"
        : "I can only provide basic triage. Please see a doctor immediately.",
    });
  }

  // MINOR: simple, safe first-aid (max ~3 steps, simple language)
  let steps: string[] = [];
  if (text.includes("cold") || text.includes("cough") || text.includes("sore throat")) {
    steps = isHindi
      ? [
          "दिन में 2–3 बार गुनगुना पानी पिएँ।",
          "आराम करें और धूल, धुआँ और ठंडी चीज़ों से बचें।",
          "3 दिन से ज़्यादा या साँस में तकलीफ हो तो डॉक्टर को दिखाएँ।",
        ]
      : [
          "Drink warm water 2–3 times a day.",
          "Rest and avoid dust, smoke and very cold foods.",
          "If it lasts more than 3 days or breathing worsens, see a doctor.",
        ];
  } else if (text.includes("headache")) {
    steps = isHindi
      ? [
          "शांत, अँधेरे कमरे में आराम करें।",
          "दिन भर में पर्याप्त पानी पिएँ।",
          "तेज़ या अचानक अलग तरह का सिरदर्द हो तो तुरंत डॉक्टर से मिलें।",
        ]
      : [
          "Rest in a quiet, dark room.",
          "Drink enough water through the day.",
          "If pain is very severe or very different from usual, see a doctor quickly.",
        ];
  } else if (text.includes("cut") || text.includes("scratch")) {
    steps = isHindi
      ? [
          "कटे हुए हिस्से को साफ पानी से 5–10 मिनट तक धोएँ।",
          "साफ कपड़े या पट्टी से हल्का दबाव देकर ढकें।",
          "अगर गहरा कट हो या खून बंद न हो तो तुरंत डॉक्टर के पास जाएँ।",
        ]
      : [
          "Rinse the cut with clean running water for 5–10 minutes.",
          "Cover with a clean cloth or bandage with gentle pressure.",
          "If the cut is deep or bleeding does not stop, go to a doctor.",
        ];
  } else {
    // Generic minor advice, still short and safe
    steps = isHindi
      ? [
          "हल्के लक्षण हों तो आराम करें और पर्याप्त पानी पिएँ।",
          "भारी काम और धूप से कुछ समय के लिए बचें।",
          "लक्षण 2–3 दिन से ज़्यादा रहें या बढ़ें तो डॉक्टर को दिखाएँ।",
        ]
      : [
          "For mild symptoms, rest and drink enough clean water.",
          "Avoid heavy work and strong sun for a while.",
          "If symptoms last more than 2–3 days or get worse, see a doctor.",
        ];
  }

  return NextResponse.json({
    problem: isHindi ? "हल्के लक्षण" : "Minor symptoms",
    severity: isHindi ? "कम गंभीरता" : "Low severity",
    severityLevel: "mild",
    possibleCauses: [],
    possibleConditions: [],
    immediateSteps: steps,
    recommendations: steps,
    whenToSeekHelp: [],
    specialist: isHindi ? "सामान्य चिकित्सक" : "General doctor if needed",
    doctorDirection: isHindi
      ? "यदि लक्षण 2–3 दिन से ज़्यादा रहें, अचानक बढ़ जाएँ या नए गंभीर लक्षण आएँ तो नज़दीकी डॉक्टर को तुरंत दिखाएँ।"
      : "If symptoms last beyond 2–3 days, suddenly worsen, or new serious signs appear, visit a nearby doctor promptly.",
    disclaimer: isHindi
      ? "यह केवल प्रारंभिक सलाह है, डॉक्टर की जाँच का विकल्प नहीं है।"
      : "This is only basic first-aid guidance and not a replacement for a doctor.",
  });
}