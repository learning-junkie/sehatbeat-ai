import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  X, Send, Bot, User, Minimize2, Maximize2,
  AlertTriangle, CheckCircle, AlertCircle, AlertOctagon,
  Info, Stethoscope, Pill, Activity, Phone, Clock,
  MessageCircle, Sparkles, Mic, MicOff,
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { useNetwork } from "@/hooks/useNetwork";
import offlineHealthCache from "@/lib/offlineHealthCache.json";
import { toast as sonnerToast } from "@/components/ui/sonner";

type AppLanguage = "en" | "hi";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface StructuredResponse {
  problem: string;
  severity: string;
  severityLevel: "emergency" | "high" | "moderate" | "mild" | "info";
  possibleCauses: string[];
  immediateSteps: string[];
  whenToSeekHelp: string[];
  specialist: string;
  disclaimer: string;
}

interface Message {
  id: string;
  type: "user" | "bot";
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
    const stored = window.localStorage?.getItem("sehatbeat_language");
    return stored === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

async function callNextSymptomAPI(
  message: string,
  language: AppLanguage = "en"
): Promise<StructuredResponse> {
  const res = await fetch("/api/analyze-symptoms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symptoms: message, language }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data: {
    analysis: string;
    severity: string;
    recommendations: string[];
  } = await res.json();

  return {
    problem: "Symptom Analysis",
    severity: data.severity || "Overall severity could not be determined precisely.",
    severityLevel: mapSeverityLevel(data.severity),
    possibleCauses: [],
    immediateSteps: data.recommendations ?? [],
    whenToSeekHelp: [],
    specialist: "Nearest doctor or health centre",
    disclaimer:
      "This AI-generated triage is informational only and must not replace an in-person consultation with a qualified healthcare professional, especially if symptoms are severe or worsening.",
  };
}

// ─── Severity styles ────────────────────────────────────────────────────────────

const SEV_CONFIG = {
  emergency: { border: "border-red-500",    bg: "bg-red-50 dark:bg-red-950/30",     badge: "bg-red-100 text-red-800",      icon: AlertOctagon,  label: "🚨 EMERGENCY", color: "text-red-600"    },
  high:      { border: "border-orange-500", bg: "bg-orange-50 dark:bg-orange-950/30", badge: "bg-orange-100 text-orange-800", icon: AlertCircle,   label: "⚠️ URGENT",    color: "text-orange-600" },
  moderate:  { border: "border-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-950/30", badge: "bg-yellow-100 text-yellow-800", icon: AlertTriangle, label: "⚠️ MODERATE",  color: "text-yellow-600" },
  mild:      { border: "border-green-500",  bg: "bg-green-50 dark:bg-green-950/30",  badge: "bg-green-100 text-green-800",  icon: CheckCircle,   label: "✅ MILD",       color: "text-green-600"  },
  info:      { border: "border-blue-400",   bg: "bg-blue-50 dark:bg-blue-950/30",    badge: "bg-blue-100 text-blue-800",    icon: Info,          label: "ℹ️ INFO",       color: "text-blue-600"   },
} as const;

// ─── Structured card ────────────────────────────────────────────────────────────

function StructuredCard({ data }: { data: StructuredResponse }) {
  const cfg = SEV_CONFIG[data.severityLevel] ?? SEV_CONFIG.info;
  const SevIcon = cfg.icon;
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

      {/* Emergency CTA */}
      {data.severityLevel === "emergency" && (
        <div className="bg-red-500 text-white rounded-lg p-3 flex items-center gap-3">
          <Phone className="w-5 h-5 flex-shrink-0 animate-pulse" />
          <div>
            <p className="font-bold text-sm">Call Emergency Services Now</p>
            <p className="text-xs opacity-90">Dial 112 or go to nearest hospital immediately</p>
          </div>
        </div>
      )}

      {/* Possible causes */}
      {data.possibleCauses.length > 0 && (
        <div className="bg-muted/60 rounded-lg p-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Possible Causes</p>
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
            <Pill className="w-3 h-3" /> Immediate Steps
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
            <AlertTriangle className="w-3 h-3" /> See a Doctor If...
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
            <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300">Recommended Specialist</p>
            <p className="text-xs text-foreground">{data.specialist}</p>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground italic border-t pt-2">⚕️ {data.disclaimer}</p>
    </div>
  );
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "I have a headache and fever",
  "My chest feels tight",
  "Stomach pain since morning",
  "Feeling very tired lately",
  "Sore throat and cough",
];

const WELCOME_DATA: StructuredResponse = {
  problem: "Welcome to SehatBeat AI",
  severity: "Your personal AI health companion — powered by Perplexity AI",
  severityLevel: "info",
  possibleCauses: [],
  immediateSteps: [
    "Describe your symptoms in detail for accurate analysis",
    "Ask about any medicine, condition, or health concern",
    "Get instant triage and specialist recommendations",
  ],
  whenToSeekHelp: [],
  specialist: "N/A",
  disclaimer: "I provide informational guidance only. Always consult a licensed doctor for diagnosis and treatment.",
};

function savePendingQuery(query: string) {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    const key = "sehatbeat_pending_queries";
    const existing = JSON.parse(localStorage.getItem(key) || "[]") as { query: string; timestamp: string }[];
    const next = [
      ...existing,
      {
        query,
        timestamp: new Date().toISOString(),
      },
    ].slice(-50); // keep latest 50 only
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
        immediateSteps: entry.immediateSteps,
        whenToSeekHelp: entry.whenToSeekHelp,
        specialist: entry.specialist,
        disclaimer: entry.disclaimer,
      };
    }
  }

  return null;
}

// ─── Main component ─────────────────────────────────────────────────────────────

export const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", type: "bot", content: "", timestamp: new Date(), structuredData: WELCOME_DATA },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState<AppLanguage>(getStoredLanguage);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { isOnline } = useNetwork();
  const wasOnlineRef = useRef<boolean>(isOnline);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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
    r.interimResults = false;
    r.lang = getStoredLanguage() === "hi" ? "hi-IN" : "en-IN";
    r.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) {
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      }
    };
    r.onend = () => {
      setIsListening(false);
    };
    r.onerror = () => {
      setIsListening(false);
    };
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
    };
  }, []);

  // Update recognition language when user changes app language
  useEffect(() => {
    const rec = recognitionRef.current as SpeechRecognition | null;
    if (!rec) return;
    rec.lang = language === "hi" ? "hi-IN" : "en-IN";
  }, [language]);

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
        pending = JSON.parse(localStorage.getItem(key) || "[]") as {
          query: string;
          timestamp: string;
        }[];
      } catch {
        pending = [];
      }

      if (!pending.length) return;

      // Clear the queue early to avoid duplicate sends on rapid reconnects
      localStorage.removeItem(key);

      for (const item of pending) {
        const q = item.query.trim();
        if (!q) continue;

        try {
          const structured = await callNextSymptomAPI(q, getStoredLanguage());
          const id = `${item.timestamp}-${Math.random().toString(36).slice(2)}`;

          setMessages(prev => [
            ...prev,
            {
              id,
              type: "bot",
              content: "",
              timestamp: new Date(),
              structuredData: structured,
            },
          ]);

          const topic =
            q.length > 60
              ? `${q.slice(0, 57).trimEnd()}...`
              : q || "your earlier health question";

          sonnerToast("Your offline question has been answered!", {
            description: `Your offline question about "${topic}" has been analyzed by SehatBeat AI.`,
          });
        } catch (err) {
          // If sending fails, re-queue this query so it isn't lost
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

      // Always show the user message first
      setMessages(prev => [
        ...prev,
        { id: uid, type: "user", content: msg, timestamp: new Date() },
      ]);
      setInput("");

      // If offline, try offline cache first; on miss, store-and-forward
      if (!isOnline) {
        const offlineData = buildOfflineResponse(msg);

        if (offlineData) {
          setMessages(prev => [
            ...prev,
            {
              id: tid,
              type: "bot",
              content: "",
              timestamp: new Date(),
              structuredData: offlineData,
            },
          ]);
          toast({
            title: "Offline mode",
            description:
              "You are offline. Showing saved first-aid guidance. For detailed AI analysis, reconnect to the internet.",
          });
        } else {
          savePendingQuery(msg);
          setMessages(prev => [
            ...prev,
            {
              id: tid,
              type: "bot",
              content:
                "I don't have this saved offline. I have saved your question and will ask the AI as soon as your internet connects.",
              timestamp: new Date(),
            },
          ]);
          toast({
            title: "Saved for later",
            description:
              "This question will be sent to SehatBeat AI automatically when your internet returns.",
          });
        }
        return;
      }

      // Online path: call Perplexity AI
      setMessages(prev => [
        ...prev,
        {
          id: tid,
          type: "bot",
          content: "",
          timestamp: new Date(),
          isThinking: true,
        },
      ]);
      setIsLoading(true);

      try {
        const structured = await callNextSymptomAPI(msg, language);
        setMessages(prev =>
          prev.map(m =>
            m.id === tid
              ? {
                  ...m,
                  isThinking: false,
                  content: "",
                  structuredData: structured,
                }
              : m
          )
        );
        setIsLoading(false);
        if (structured.severityLevel === "emergency") {
          toast({
            title: "🚨 Emergency Detected",
            description: "Call 112 or go to nearest hospital immediately.",
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
                  content: `Unable to connect to AI.\n\n${
                    err instanceof Error ? err.message : String(err)
                  }`,
                }
              : m
          )
        );
        setIsLoading(false);
        toast({
          title: "Connection Error",
          description:
            "Unable to reach the SehatBeat analysis service. Please try again or check your connection.",
          variant: "destructive",
        });
      }
    },
    [input, isLoading, isOnline, toast]
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

  // Text-to-speech: speak latest bot message (structured or plain)
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.speechSynthesis === "undefined") return;
    if (!messages.length) return;
    const last = [...messages].reverse().find(m => m.type === "bot" && !m.isThinking);
    if (!last) return;

    let text = last.content || "";
    if (last.structuredData) {
      const d = last.structuredData;
      const parts: string[] = [
        d.problem,
        d.severity,
        d.immediateSteps.length ? `Immediate steps: ${d.immediateSteps.join("; ")}` : "",
        d.whenToSeekHelp.length ? `See a doctor if: ${d.whenToSeekHelp.join("; ")}` : "",
        d.specialist && d.specialist !== "N/A" ? `Recommended specialist: ${d.specialist}` : "",
        d.disclaimer,
      ].filter(Boolean);
      text = parts.join(". ");
    }
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 1;
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
        aria-label="Open SehatBeat AI"
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 lg:bottom-8 lg:right-8 flex items-center justify-center"
      >
        <div className="relative">
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        </div>
      </button>
    );
  }

  // ── Chat panel ───────────────────────────────────────────────────────────────

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
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span
              className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-teal-500 ${
                isOnline ? "bg-emerald-400" : "bg-amber-300"
              }`}
            />
          </div>
          {!isMinimized && (
            <div>
              <p className="font-bold text-white text-sm leading-tight">SehatBeat AI</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-white/80 text-[11px] flex items-center gap-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isOnline ? "bg-emerald-300" : "bg-amber-200"
                    }`}
                  />
                  {isOnline ? "Online (AI Active)" : "Offline Mode (Basic First-Aid)"}
                </p>
                <p className="text-white/70 text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {isOnline
                    ? isLoading
                      ? "Analyzing with Perplexity..."
                      : "Powered by Perplexity AI"
                    : "Using local, lightweight guidance"}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("en");
                      if (typeof window !== "undefined") {
                        try {
                          window.localStorage?.setItem("sehatbeat_language", "en");
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] border ${
                      language === "en"
                        ? "bg-white text-blue-700 border-white"
                        : "bg-white/10 text-white border-white/40"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("hi");
                      if (typeof window !== "undefined") {
                        try {
                          window.localStorage?.setItem("sehatbeat_language", "hi");
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    className={`px-2 py-0.5 rounded-full text-[10px] border ${
                      language === "hi"
                        ? "bg-white text-blue-700 border-white"
                        : "bg-white/10 text-white border-white/40"
                    }`}
                  >
                    हिन्दी
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
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-2.5 ${msg.type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.type === "bot" ? "bg-gradient-to-br from-blue-500 to-teal-500" : "bg-secondary"}`}>
                  {msg.type === "bot" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-secondary-foreground" />}
                </div>
                {/* Bubble */}
                <div className={`max-w-[84%] rounded-2xl px-3 py-2.5 ${msg.type === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                  {msg.isThinking ? (
                    <div className="flex items-center gap-2 py-1">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">Analyzing with AI...</span>
                    </div>
                  ) : msg.structuredData ? (
                    <StructuredCard data={msg.structuredData} />
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
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestion chips */}
          {messages.filter(m => m.type === "user").length === 0 && (
            <div className="px-3 pb-2 flex gap-2 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: "none" }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs whitespace-nowrap bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full px-3 py-1.5 transition-colors flex-shrink-0">
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
                className={`w-9 h-9 rounded-full p-0 flex-shrink-0 ${
                  isListening ? "bg-red-500 text-white hover:bg-red-600" : ""
                }`}
                onClick={() => {
                  const rec = recognitionRef.current;
                  if (!rec) {
                    toast({
                      title: "Voice not supported",
                      description: "Your browser does not support speech recognition.",
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
                placeholder="Describe your symptoms..."
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
            <p className="text-center text-[11px] text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <MessageCircle className="w-3 h-3" /> Not a substitute for professional medical advice
            </p>
          </div>
        </>
      )}
    </Card>
  );
};