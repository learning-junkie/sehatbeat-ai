import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  X, Send, Bot, User, Minimize2, Maximize2,
  AlertTriangle, CheckCircle, AlertCircle, AlertOctagon,
  Info, Stethoscope, Pill, Activity, Phone, Clock,
  MessageCircle, Sparkles, Mic, MicOff, MapPin,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useNetwork } from "@/hooks/useNetwork";
import offlineHealthCache from "@/lib/offlineHealthCache.json";
import { toast as sonnerToast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import AIAvatar from "./AIAvatar";

type AppLanguage = "en" | "hi";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StructuredResponse {
  problem: string;
  severity: string;
  severityLevel: "emergency" | "high" | "moderate" | "mild" | "info";
  possibleCauses: string[];
  possibleConditions: string[];
  immediateSteps: string[];
  whenToSeekHelp: string[];
  specialist: string;
  doctorDirection: string;
  disclaimer: string;
}

interface Message {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  isThinking?: boolean;
  structuredData?: StructuredResponse;
}

// ─── Helpers for backend + offline cache ────────────────────────────────────────

type OfflineCacheEntry = {
  keywords: string[];
  problem: string;
  severity: string;
  severityLevel: "emergency" | "high" | "moderate" | "mild" | "info";
  immediateSteps: string[];
  whenToSeekHelp: string[];
  specialist: string;
  disclaimer: string;
  possibleCauses?: string[];
};

const OFFLINE_CACHE = offlineHealthCache as Record<string, OfflineCacheEntry>;

function mapSeverityLevel(severityText: string | undefined): StructuredResponse["severityLevel"] {
  if (!severityText) return "info";
  const s = severityText.toLowerCase();
  if (s.includes("emergency") || s.includes("critical") || s.includes("life-threatening")) return "emergency";
  if (s.includes("high") || s.includes("severe")) return "high";
  if (s.includes("moderate")) return "moderate";
  if (s.includes("low") || s.includes("mild")) return "mild";
  return "info";
}

function getStoredLanguage(): AppLanguage {
  if (typeof window === "undefined") return "en";
  try {
    // Prefer new onboarding key, fall back to legacy key if present
    const storedNew = window.localStorage?.getItem("sehatbeat_lang");
    const storedLegacy = window.localStorage?.getItem("sehatbeat_language");
    const stored = storedNew || storedLegacy;
    return stored === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

// ─── API call ──────────────────────────────────────────────────────────────────

async function callNextSymptomAPI(
  message: string,
  language: AppLanguage = "en",
  history: { role: string; content: string }[] = []
): Promise<StructuredResponse> {
  const backendBase =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_BACKEND_URL
      ? String((import.meta as any).env.VITE_BACKEND_URL).replace(/\/+$/, "")
      : "") || "http://localhost:3000";

  const url = `${backendBase}/api/analyze-symptoms`;
  console.log("🚀 Fetching:", url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: message, language, history }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const text = await res.text().catch(() => "");
      const msg =
        (errorData as any).error ||
        (text ? `API ${res.status}: ${text}` : `API ${res.status}`);
      throw new Error(msg);
    }

    let data: {
      analysis?: string;
      severity?: string;
      severityLevel?: string;
      possibleConditions?: string[];
      recommendations?: string[];
      immediateSteps?: string[];
      whenToSeekHelp?: string[];
      specialist?: string;
      doctorDirection?: string;
      doctorNote?: string;
      disclaimer?: string;
      problem?: string;
      possibleCauses?: string[];
    };

    try {
      data = await res.json();
    } catch {
      throw new Error(
        language === "hi"
          ? "AI से अप्रत्याशित प्रतिक्रिया मिली। कृपया पुनः प्रयास करें।"
          : "Received an unexpected response from AI. Please try again."
      );
    }

    return {
      problem:
        data.problem ||
        (language === "hi" ? "लक्षण विश्लेषण" : "Symptom Analysis"),
      severity:
        data.severity ||
        "Overall severity could not be determined precisely.",
      severityLevel: mapSeverityLevel(data.severityLevel || data.severity),
      possibleCauses: data.possibleCauses ?? [],
      possibleConditions: data.possibleConditions ?? [],
      immediateSteps: data.immediateSteps ?? data.recommendations ?? [],
      whenToSeekHelp: data.whenToSeekHelp ?? [],
      specialist:
        data.specialist ||
        (language === "hi"
          ? "सामान्य चिकित्सक"
          : "Nearest doctor or health centre"),
      doctorDirection: data.doctorDirection ?? data.doctorNote ?? "",
      disclaimer:
        data.disclaimer ||
        "This AI-generated triage is informational only and must not replace an in-person consultation with a qualified healthcare professional.",
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        language === "hi"
          ? "AI को जवाब देने में समय लग रहा है। कृपया पुनः प्रयास करें।"
          : "AI is taking longer than usual. Please try again."
      );
    }
    if (error instanceof TypeError && (error.message === "Failed to fetch" || error.message.includes("fetch"))) {
      throw new Error(
        language === "hi"
          ? "सर्वर से कनेक्ट नहीं हो पाया। कृपया जांचें कि बैकएंड चल रहा है (localhost:3000)।"
          : "Could not reach the server. Ensure the backend is running at http://localhost:3000."
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Severity styles ────────────────────────────────────────────────────────────

const SEV_CONFIG = {
  emergency: { border: "border-red-500",    bg: "bg-red-50 dark:bg-red-950/30",       badge: "bg-red-100 text-red-800",       icon: AlertOctagon,  label: "🚨 EMERGENCY", color: "text-red-600"    },
  high:      { border: "border-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", badge: "bg-orange-100 text-orange-800", icon: AlertCircle,   label: "⚠️ URGENT",    color: "text-orange-600" },
  moderate:  { border: "border-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30", badge: "bg-yellow-100 text-yellow-800", icon: AlertTriangle, label: "⚠️ MODERATE",  color: "text-yellow-600" },
  mild:      { border: "border-green-500",  bg: "bg-green-50 dark:bg-green-950/30",   badge: "bg-green-100 text-green-800",   icon: CheckCircle,   label: "✅ MILD",       color: "text-green-600"  },
  info:      { border: "border-blue-400",   bg: "bg-blue-50 dark:bg-blue-950/30",     badge: "bg-blue-100 text-blue-800",     icon: Info,          label: "ℹ️ INFO",       color: "text-blue-600"   },
} as const;

// ─── Structured card ────────────────────────────────────────────────────────────

function StructuredCard({ data, language }: { data: StructuredResponse; language: AppLanguage }) {
  const cfg = SEV_CONFIG[data.severityLevel] ?? SEV_CONFIG.info;
  const SevIcon = cfg.icon;
  const isHi = language === "hi";

  // FIX 2 — Emergency audio + browser notification
  useEffect(() => {
    if (data.severityLevel !== "emergency") return;
    // Audio beep
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      osc.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 500);
    } catch { /* ignore */ }
    // Browser notification
    try {
      if (Notification.permission === "granted") {
        new Notification("🚨 EMERGENCY", { body: "Call 112 immediately or go to nearest hospital" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(p => {
          if (p === "granted") new Notification("🚨 EMERGENCY", { body: "Call 112 immediately or go to nearest hospital" });
        });
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.severityLevel]);
  return (
    <div className="space-y-2.5 text-sm w-full">
      {/* Header */}
      <div className={`rounded-lg p-3 border ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
            <span className="font-bold text-foreground">{data.problem}</span>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <SevIcon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />
          <span className="text-xs text-muted-foreground">{data.severity}</span>
        </div>
      </div>

      {/* FIX 2 — Emergency CTA banner */}
      {data.severityLevel === "emergency" && (
        <div className="bg-red-600 text-white rounded-xl p-4 flex flex-col gap-3 border-2 border-red-400 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 flex-shrink-0" />
            <p className="font-black text-base tracking-wide">🚨 MEDICAL EMERGENCY DETECTED</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href="tel:112"
              className="flex items-center gap-1.5 bg-white text-red-700 font-bold text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <Phone className="w-4 h-4" /> 📞 Call 112 Now
            </a>
            <button
              onClick={() => window.open("https://www.google.com/maps/search/nearest+emergency+hospital+india", "_blank", "noopener,noreferrer")}
              className="flex items-center gap-1.5 bg-red-800 text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-red-900 transition-colors flex-shrink-0"
            >
              <MapPin className="w-4 h-4" /> 🏥 Find Nearest Hospital
            </button>
          </div>
        </div>
      )}

      {/* FIX 2 — High severity banner */}
      {data.severityLevel === "high" && (
        <div className="bg-orange-500 text-white rounded-xl p-3 flex flex-col gap-2 border border-orange-300">
          <p className="font-bold text-sm">⚠️ You should see a doctor urgently</p>
          <button
            onClick={() => window.open(`https://www.google.com/maps/search/nearest+${encodeURIComponent(data.specialist || "doctor")}+doctor+india`, "_blank", "noopener,noreferrer")}
            className="flex items-center gap-1.5 bg-white text-orange-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors w-fit"
          >
            <MapPin className="w-3.5 h-3.5" /> 🗺️ Find Nearest {data.specialist || "Doctor"}
          </button>
        </div>
      )}

      {/* Doctor direction for high/emergency */}
      {data.doctorDirection && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-700 rounded-lg p-3 flex items-start gap-3">
          <MapPin className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">
              See a Doctor Now
            </p>
            <p className="text-xs text-foreground">{data.doctorDirection}</p>
            {/* Google Maps link */}
            <button
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/nearest+${encodeURIComponent(data.specialist || "doctor")}`,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-red-600 underline hover:text-red-800"
            >
              <MapPin className="w-3 h-3" /> Find nearest {data.specialist || "doctor"} on Maps
            </button>
          </div>
        </div>
      )}

      {/* Possible conditions */}
      {data.possibleConditions && data.possibleConditions.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1.5">
            {isHi ? "संभावित बीमारियां" : "Possible Conditions"}
          </p>
          {data.possibleConditions.map((c, i) => (
            <div key={i} className="flex items-start gap-2 mt-1">
              <span className="text-purple-500 font-bold flex-shrink-0 mt-0.5">•</span>
              <span className="text-xs text-foreground">{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* Possible causes */}
      {data.possibleCauses.length > 0 && (
        <div className="bg-muted/60 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{isHi ? "संभावित कारण" : "Possible Causes"}</p>
          {data.possibleCauses.map((c, i) => (
            <div key={i} className="flex items-start gap-2 mt-1">
              <span className="text-primary font-bold flex-shrink-0 mt-0.5">•</span>
              <span className="text-xs text-foreground">{c}</span>
            </div>
          ))}
        </div>
      )}

      {/* Immediate steps */}
      {data.immediateSteps.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Pill className="w-3 h-3" /> {isHi ? "तुरंत करें" : "Immediate Steps"}
          </p>
          {data.immediateSteps.map((s, i) => (
            <div key={i} className="flex items-start gap-2 mt-1">
              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-foreground">{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* When to seek help */}
      {data.whenToSeekHelp.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {isHi ? "डॉक्टर के पास कब जाएं" : "See a Doctor If..."}
          </p>
          {data.whenToSeekHelp.map((w, i) => (
            <div key={i} className="flex items-start gap-2 mt-1">
              <span className="text-orange-500 font-bold flex-shrink-0">!</span>
              <span className="text-xs text-foreground">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Specialist */}
      {data.specialist && data.specialist !== "N/A" && (
        <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
          <Stethoscope className="w-4 h-4 text-purple-600 flex-shrink-0" />
          <div>
            <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">{isHi ? "अनुशंसित विशेषज्ञ" : "Recommended Specialist"}</p>
            <p className="text-xs text-foreground">{data.specialist}</p>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground italic border-t pt-2">⚕️ {data.disclaimer}</p>
    </div>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SUGGESTIONS_EN = [
  "I have a headache and fever",
  "My chest feels tight",
  "Stomach pain since morning",
  "Feeling very tired lately",
  "Sore throat and cough",
];

const SUGGESTIONS_HI = [
  "मुझे सिरदर्द और बुखार है",
  "छाती में जकड़न महसूस हो रही है",
  "सुबह से पेट दर्द है",
  "बहुत थकान हो रही है",
  "गले में खराश और खांसी है",
];

const WELCOME_DATA: StructuredResponse = {
  problem: "Welcome to SehatBeat AI",
  severity: "Your personal AI health companion — powered by Gemini 1.5 Flash",
  severityLevel: "info",
  possibleCauses: [],
  possibleConditions: [],
  immediateSteps: [
    "Describe your symptoms in detail for accurate analysis",
    "Ask about any medicine, condition, or health concern",
    "Get instant triage and specialist recommendations",
  ],
  whenToSeekHelp: [],
  specialist: "N/A",
  doctorDirection: "",
  disclaimer: "I provide informational guidance only. Always consult a licensed doctor for diagnosis and treatment.",
};

function savePendingQuery(query: string) {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    const key = "sehatbeat_pending_queries";
    const existing = JSON.parse(localStorage.getItem(key) || "[]") as { query: string; timestamp: string }[];
    const next = [
      ...existing,
      { query, timestamp: new Date().toISOString() },
    ].slice(-50);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore storage errors in offline mode
  }
}

function buildOfflineResponse(userInput: string): StructuredResponse | null {
  const text = userInput.toLowerCase();
  for (const entry of Object.values(OFFLINE_CACHE)) {
    const match = entry.keywords.some(k => text.includes(k.toLowerCase()));
    if (match) {
      return {
        problem: entry.problem,
        severity: entry.severity,
        severityLevel: entry.severityLevel,
        possibleCauses: entry.possibleCauses ?? [],
        possibleConditions: [],
        immediateSteps: entry.immediateSteps,
        whenToSeekHelp: entry.whenToSeekHelp,
        specialist: entry.specialist,
        doctorDirection: "",
        disclaimer: entry.disclaimer,
      };
    }
  }
  return null;
}

// ─── Main component ─────────────────────────────────────────────────────────────

export const AIAssistant = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", type: "bot", content: "", timestamp: new Date(), structuredData: WELCOME_DATA },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Language switch with chat notice injection
  const handleLanguageSwitch = (newLang: "en" | "hi") => {
    if (newLang === language) return;
    setLanguage(newLang);
    try { window.localStorage?.setItem("sehatbeat_lang", newLang); } catch { /* ignore */ }
    const noticeText =
      newLang === "hi"
        ? "🌐 Switched to Hindi. Future responses will be in Hindi."
        : "🌐 Switched to English. Future responses will be in English.";
    setMessages(prev => [
      ...prev,
      { id: `system-${Date.now()}`, type: "system", content: noticeText, timestamp: new Date() },
    ]);
  };

  // Note: `language` state + `setLanguage` now come from LanguageContext

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isOnline } = useNetwork();
  const wasOnlineRef = useRef<boolean>(isOnline);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (isOpen && !isMinimized) setTimeout(() => inputRef.current?.focus(), 120);
  }, [isOpen, isMinimized]);

  // Initialise browser speech recognition lazily
  useEffect(() => {
    if (typeof window === "undefined") return;
    const AnyWindow = window as unknown as {
      SpeechRecognition?: typeof SpeechRecognition;
      webkitSpeechRecognition?: typeof SpeechRecognition;
    };
    const SR = AnyWindow.SpeechRecognition || AnyWindow.webkitSpeechRecognition;
    if (!SR) {
      recognitionRef.current = null;
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = true; // FIX 4 — show live transcript while speaking
    r.lang = getStoredLanguage() === "hi" ? "hi-IN" : "en-IN";
    r.onresult = event => {
      // Show interim results live; only process final results for auto-send
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) {
        setInput(transcript);
      }
      // FIX 4 — silence detection: if last result is final, auto-send after 1500ms
      const lastResult = event.results[event.results.length - 1];
      if (lastResult?.isFinal) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const finalTranscript = Array.from(event.results)
            .map(r2 => r2[0]?.transcript ?? "")
            .join(" ")
            .trim();
          if (finalTranscript) {
            sendMessage(finalTranscript);
          }
        }, 1500);
      }
    };
    r.onend = () => { setIsListening(false); };
    r.onerror = () => { setIsListening(false); };
    recognitionRef.current = r;

    return () => {
      try {
        r.onresult = null as any;
        r.onend = null as any;
        r.onerror = null as any;
        r.stop();
      } catch {
        // ignore
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update recognition language when user changes app language
  useEffect(() => {
    const rec = recognitionRef.current as SpeechRecognition | null;
    if (!rec) return;
    rec.lang = language === "hi" ? "hi-IN" : "en-IN";
  }, [language]);

  // Safety net: if any message stays in isThinking for >20s, replace with timeout error
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    messages.forEach(msg => {
      if (!msg.isThinking) return;
      const elapsed = Date.now() - msg.timestamp.getTime();
      const remaining = Math.max(0, 20000 - elapsed);
      const timer = setTimeout(() => {
        setMessages(prev =>
          prev.map(m =>
            m.id === msg.id && m.isThinking
              ? {
                  ...m,
                  isThinking: false,
                  content: language === "hi"
                    ? "Gemini बहुत देर ले रहा है। कृपया पुनः प्रयास करें।"
                    : "Gemini is taking too long. Please try again.",
                }
              : m
          )
        );
        setIsLoading(false);
      }, remaining);
      timers.push(timer);
    });
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, language]);

  // When connection comes back, flush any pending queries from localStorage
  useEffect(() => {
    if (!isOnline || wasOnlineRef.current) {
      wasOnlineRef.current = isOnline;
      return;
    }
    wasOnlineRef.current = true;
    const key = "sehatbeat_pending_queries";

    const syncPending = async () => {
      if (typeof window === "undefined" || typeof localStorage === "undefined") return;
      let pending: { query: string; timestamp: string }[] = [];
      try {
        pending = JSON.parse(localStorage.getItem(key) || "[]") as { query: string; timestamp: string }[];
      } catch {
        pending = [];
      }
      if (!pending.length) return;
      localStorage.removeItem(key);

      for (const item of pending) {
        const q = item.query.trim();
        if (!q) continue;
        try {
          const structured = await callNextSymptomAPI(q, getStoredLanguage());
          const id = `${item.timestamp}-${Math.random().toString(36).slice(2)}`;
          setMessages(prev => [
            ...prev,
            { id, type: "bot", content: "", timestamp: new Date(), structuredData: structured },
          ]);
          const topic = q.length > 60 ? `${q.slice(0, 57).trimEnd()}...` : q || "your earlier health question";
          sonnerToast("Your offline question has been answered!", {
            description: `Your offline question about "${topic}" has been analyzed by SehatBeat AI.`,
          });
        } catch {
          savePendingQuery(q);
        }
      }
    };

    void syncPending();
  }, [isOnline]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || isLoading) return;

      const uid = Date.now().toString();
      const tid = (Date.now() + 1).toString();

      setMessages(prev => [
        ...prev,
        { id: uid, type: "user", content: msg, timestamp: new Date() },
      ]);
      setInput("");

      // Offline path
      if (!isOnline) {
        const offlineData = buildOfflineResponse(msg);
        if (offlineData) {
          setMessages(prev => [
            ...prev,
            { id: tid, type: "bot", content: "", timestamp: new Date(), structuredData: offlineData },
          ]);
          toast({
            title: t("ai.offlineTitle"),
            description: t("ai.offlineDesc"),
          });
        } else {
          savePendingQuery(msg);
          setMessages(prev => [
            ...prev,
            {
              id: tid,
              type: "bot",
              content: t("ai.savedDesc"),
              timestamp: new Date(),
            },
          ]);
          toast({
            title: t("ai.savedTitle"),
            description: t("ai.savedDesc"),
          });
        }
        return;
      }

      // Online path
      const conversationHistory = messages
        .filter(m => m.id !== "welcome" && m.type !== "bot" ? true : !!m.content)
        .map(msg => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: msg.content || (msg.structuredData ? JSON.stringify(msg.structuredData) : ""),
        }));

      setMessages(prev => [
        ...prev,
        { id: tid, type: "bot", content: "", timestamp: new Date(), isThinking: true },
      ]);
      setIsLoading(true);

      try {
        const structured = await callNextSymptomAPI(msg, language, conversationHistory);
        setMessages(prev =>
          prev.map(m =>
            m.id === tid
              ? { ...m, isThinking: false, content: "", structuredData: structured }
              : m
          )
        );
        if (structured.severityLevel === "emergency") {
          toast({
            title: t("ai.emergency"),
            description: t("ai.findHospital"),
            variant: "destructive",
          });
        }
      } catch (err) {
        setMessages(prev =>
          prev.map(m =>
            m.id === tid
              ? {
                  ...m,
                  isThinking: false,
                  content: `Unable to connect to AI.\n\n${err instanceof Error ? err.message : String(err)}`,
                }
              : m
          )
        );
        toast({
          title: t("ai.connectionError"),
          description: t("ai.connectionErrorDesc"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, isOnline, language, toast, messages]
  );

  // Listen for events dispatched by SehatBeatAI page (Analyze button)
  useEffect(() => {
    const handler = (e: Event) => {
      const { message } = (e as CustomEvent<{ message: string }>).detail;
      setIsOpen(true);
      setIsMinimized(false);
      if (message) setTimeout(() => sendMessage(message), 350);
    };
    window.addEventListener("sehatbeat-open-ai", handler);
    return () => window.removeEventListener("sehatbeat-open-ai", handler);
  }, [sendMessage]);

  // FIX 6 — When connection comes back, flush pending queries with language-aware notifications
  // (replacing the existing one below — see the existing useEffect at line ~428)

  // Text-to-speech: speak latest bot message (structured or plain)
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") return;
    if (!messages.length) return;
    const last = [...messages].reverse().find(m => m.type === "bot" && !m.isThinking);
    if (!last || last.id === "welcome") return;

    let text = last.content || "";
    if (last.structuredData) {
      const d = last.structuredData;
      const parts: string[] = [
        d.problem,
        d.severity,
        d.immediateSteps.length ? `Immediate steps: ${d.immediateSteps.join("; ")}` : "",
        d.whenToSeekHelp.length ? `See a doctor if: ${d.whenToSeekHelp.join("; ")}` : "",
        d.specialist && d.specialist !== "N/A" ? `Recommended specialist: ${d.specialist}` : "",
        d.doctorDirection || "",
        d.disclaimer,
      ].filter(Boolean);
      text = parts.join(". ");
    }
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    // FIX 5 — Confirm hi-IN for structured responses
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch {
      // ignore speech synthesis errors
    }
  }, [messages, language]);

  // ── Floating button ──────────────────────────────────────────────────────────

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label={t("ai.openAI")}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 lg:bottom-8 lg:right-8 flex items-center justify-center p-0 overflow-hidden border-2 border-white"
      >
        <div className="relative">
          <AIAvatar size="sm" animated={true} />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse z-10" />
        </div>
      </button>
    );
  }

  // ── Chat panel ───────────────────────────────────────────────────────────────

  const suggestions = language === "hi" ? SUGGESTIONS_HI : SUGGESTIONS_EN;

  return (
    <Card className={`fixed z-50 bg-background border shadow-2xl transition-all duration-300 flex flex-col overflow-hidden
      ${isMinimized
        ? "bottom-6 right-6 w-72 h-14 lg:bottom-8 lg:right-8"
        : "bottom-6 right-6 w-[370px] h-[590px] lg:bottom-8 lg:right-8 lg:w-[400px] lg:h-[640px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-teal-500 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AIAvatar size="sm" animated={false} />
            <span
              className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-teal-500 z-10 ${
                isOnline ? "bg-emerald-400" : "bg-amber-300"
              }`}
            />
          </div>
          {!isMinimized && (
            <div>
              <p className="font-bold text-white text-sm leading-tight">{t("ai.title")}</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-white/80 text-[11px] flex items-center gap-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? "bg-emerald-300" : "bg-amber-200"}`} />
                  {isOnline ? t("ai.online") : t("ai.offline")}
                </p>
                <p className="text-white/70 text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {isOnline
                    ? isLoading
                      ? t("ai.analyzing")
                      : t("ai.poweredBy")
                    : t("ai.offlineDesc")}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <button
                    type="button"
                    onClick={() => handleLanguageSwitch("en")}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                      language === "en"
                        ? "bg-white text-blue-700 border-white shadow-sm scale-105"
                        : "bg-white/10 text-white/70 border-white/30 hover:text-white hover:bg-white/20"
                    }`}
                    aria-pressed={language === "en"}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageSwitch("hi")}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all ${
                      language === "hi"
                        ? "bg-white text-blue-700 border-white shadow-sm scale-105"
                        : "bg-white/10 text-white/70 border-white/30 hover:text-white hover:bg-white/20"
                    }`}
                    aria-pressed={language === "hi"}
                  >
                    🇮🇳 हिन्दी
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setIsMinimized(v => !v)} className="text-white hover:bg-white/20 w-8 h-8 p-0">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/20 w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* ── Body: fixed avatar column (left) + scrollable messages (right) ── */}
          <div className="flex flex-1 min-h-0 overflow-hidden">

            {/* Left avatar column — hidden on very small screens */}
            <div className="hidden sm:flex flex-col items-center justify-start pt-5 px-2 flex-shrink-0 w-[76px] border-r border-border/40 bg-gradient-to-b from-blue-50/60 to-teal-50/40 dark:from-blue-950/20 dark:to-teal-950/10">
              <div className="sticky top-5">
                <AIAvatar size="md" animated={true} />
                {/* Online indicator dot */}
                <div className="mt-2 flex items-center justify-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  <span className="text-[9px] text-muted-foreground font-medium">
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
            {/* Right: messages scroll area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {messages.map(msg => {
                  // ── System notice (language switch) ──
                  if (msg.type === "system") {
                    return (
                      <div key={msg.id} className="flex justify-center my-1">
                        <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 dark:text-gray-500 rounded-full px-3 py-1 italic">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }
                  // ── User / bot bubble ──
                  return (
                  <div key={msg.id} className={`flex items-start gap-2.5 ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Show small avatar for bot on mobile (hidden on sm+ where left column shows) */}
                    <div className={`sm:hidden w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${msg.type === "bot" ? "" : "bg-secondary"}`}>
                      {msg.type === "bot"
                        ? <img src="/assets/doctor-avatar.png" alt="AI" className="w-7 h-7 rounded-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                        : <User className="w-4 h-4 text-secondary-foreground" />}
                    </div>
                    {/* On desktop hide the per-message bot icon since the left column handles it */}
                    {msg.type === "user" && (
                      <div className="hidden sm:flex w-7 h-7 rounded-full items-center justify-center flex-shrink-0 bg-secondary">
                        <User className="w-4 h-4 text-secondary-foreground" />
                      </div>
                    )}
                    <div className={`max-w-[84%] rounded-2xl px-3 py-2.5 ${
                      msg.type === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    }`}>
                      {msg.isThinking ? (
                        <div className="flex items-center gap-2 py-1">
                          <div className="flex gap-1">
                            {[0, 1, 2].map(i => (
                              <span key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {t("ai.analyzing")}
                          </span>
                        </div>
                      ) : msg.structuredData ? (
                        <StructuredCard data={msg.structuredData} language={language} />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                      )}
                      {!msg.isThinking && (
                        <span className="text-[11px] opacity-50 mt-1.5 block">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Suggestion chips */}
              {messages.filter(m => m.type === "user").length === 0 && (
                <div className="px-3 pb-2 flex gap-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: "none" }}>
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs whitespace-nowrap bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full px-3 py-1.5 transition-colors flex-shrink-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t flex-shrink-0">
                <div className="flex gap-2 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={`w-9 h-9 rounded-full p-0 flex-shrink-0 ${isListening ? "bg-red-500 text-white hover:bg-red-600 border-red-500" : ""}`}
                    onClick={() => {
                      const rec = recognitionRef.current;
                      if (!rec) {
                        toast({
                          title: t("ai.voiceNotSupported"),
                          description: t("ai.voiceNotSupportedDesc"),
                        });
                        return;
                      }
                      try {
                        if (isListening) {
                          rec.stop();
                          setIsListening(false);
                        } else {
                          rec.start();
                          setIsListening(true);
                        }
                      } catch {
                        setIsListening(false);
                      }
                    }}
                    aria-label={isListening ? "Stop listening" : "Start voice input"}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder={
                      isListening
                        ? language === "hi" ? "सुन रहा है..." : "Listening..."
                        : language === "hi" ? "अपने लक्षण बताएं..." : "Describe your symptoms..."
                    }
                    disabled={isLoading}
                    className="flex-1 text-sm rounded-full h-9 px-4"
                  />
                  <Button
                    onClick={() => sendMessage()}
                    disabled={isLoading || !input.trim()}
                    size="sm"
                    className="w-9 h-9 rounded-full p-0 bg-gradient-to-br from-blue-500 to-teal-500 hover:opacity-90 flex-shrink-0"
                  >
                    {isLoading ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                {isListening && (
                  <p className="text-[11px] text-red-500 mt-1.5 text-center animate-pulse">
                    🎤 {language === "hi" ? "बोलिए..." : "Speak now..."}
                  </p>
                )}
                <p className="text-center text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {language === "hi"
                    ? "यह पेशेवर चिकित्सा सलाह का विकल्प नहीं है"
                    : "Not a substitute for professional medical advice"}
                </p>
              </div>
            </div>{/* end right column */}
          </div>{/* end body flex row */}
        </>
      )}
    </Card>
  );
};