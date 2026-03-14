import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, MessageCircle, PlayCircle, Shield, Users, Zap, Send, Mic, MicOff } from "lucide-react";
import heroImage from "@/assets/medical.jpg";
import { useLanguage } from "@/contexts/LanguageContext";

const getSuggestedPrompts = (t: (key: string) => string) => [
  t("home.aiCardPrompt1"),
  t("home.aiCardPrompt2"),
  t("home.aiCardPrompt3"),
  t("home.aiCardPrompt4")
];

const SpeechRecognitionAPI = typeof window !== "undefined" ? (window.SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

export const HeroSection = () => {
  const { t } = useLanguage();
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const demoModalRef = useRef<HTMLDivElement | null>(null);

  // Single hero input — trigger only: opens floating AIAssistant via event (no duplicate chatbot)
  const [voiceInput, setVoiceInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voiceSubmitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openAIWithMessage = (message: string) => {
    const trimmed = (message || voiceInput || "").trim();
    if (!trimmed) return;
    window.dispatchEvent(new CustomEvent("sehatbeat-open-ai", { detail: { message: trimmed } }));
    setVoiceInput("");
  };

  const handleSuggestionClick = (prompt: string) => {
    window.dispatchEvent(new CustomEvent("sehatbeat-open-ai", { detail: { message: prompt } }));
  };

  // Init SpeechRecognition for landing page voice input
  useEffect(() => {
    if (!SpeechRecognitionAPI) return;
    const rec = new SpeechRecognitionAPI();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = (typeof window !== "undefined" && window.localStorage?.getItem("sehatbeat_lang") === "hi") ? "hi-IN" : "en-IN";
    rec.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0]?.transcript ?? "")
        .join(" ")
        .trim();
      if (transcript) setVoiceInput((prev) => (prev ? `${prev} ${transcript}` : transcript).trim());
      const last = event.results[event.results.length - 1];
      if (last?.isFinal && transcript) {
        if (voiceSubmitTimeoutRef.current) clearTimeout(voiceSubmitTimeoutRef.current);
        const finalText = transcript;
        voiceSubmitTimeoutRef.current = setTimeout(() => {
          if (finalText) {
            window.dispatchEvent(new CustomEvent("sehatbeat-open-ai", { detail: { message: finalText } }));
            setVoiceInput("");
          }
          voiceSubmitTimeoutRef.current = null;
        }, 1000);
      }
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    return () => {
      if (voiceSubmitTimeoutRef.current) clearTimeout(voiceSubmitTimeoutRef.current);
      try {
        rec.onresult = null;
        rec.onend = null;
        rec.onerror = null;
        rec.stop();
      } catch { /* ignore */ }
    };
  }, []);

  useEffect(() => {
    if (!isDemoOpen) return;

    const modalNode = demoModalRef.current;
    const focusableSelectors =
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modalNode
      ? (Array.from(
          modalNode.querySelectorAll<HTMLElement>(focusableSelectors)
        ) as HTMLElement[])
      : [];

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    firstElement?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDemoOpen(false);
        return;
      }

      if (event.key === "Tab" && focusableElements.length > 0) {
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDemoOpen]);

  const heroLine1 = t("home.heroLine1");
  const heroLine2 = t("home.heroLine2");

  return (
    <section
      className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ padding: "80px 20px 60px" }}
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Medical professionals in a modern healthcare facility"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>

      <div
        className="relative z-10 w-full flex flex-col items-center"
        style={{ maxWidth: "900px", margin: "0 auto" }}
      >
        <div className="flex flex-col items-center w-full">
            <Badge className="bg-gradient-accent text-accent-foreground px-4 py-2 text-sm animate-float" variant="secondary">
              <Activity className="w-4 h-4 mr-2" />
              {t("home.badge")}
            </Badge>

            <div className="mt-6 w-full flex flex-col items-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-center w-full" style={{ color: "#1a202c" }}>
                {heroLine1}
                <span
                  className="block"
                  style={{
                    background: "linear-gradient(135deg, #0ea5e9 0%, #0d9488 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text"
                  }}
                >
                  {heroLine2}
                </span>
              </h1>

              <p
                className="text-center mx-auto"
                style={{
                  fontSize: "17px",
                  fontWeight: 400,
                  color: "#4a5568",
                  lineHeight: 1.6,
                  maxWidth: "520px",
                  marginTop: "12px",
                  marginBottom: "36px"
                }}
              >
                {t("home.heroSub")}
              </p>
            </div>

            {/* AI Intro Card — single trigger-only input; opens floating AIAssistant (no duplicate chatbot) */}
            <div className="relative w-full flex justify-center">
              <div className="relative mx-auto w-full" style={{ maxWidth: "760px" }}>
                <div className="w-full text-left rounded-[20px] bg-white/90 backdrop-blur-xl p-6 md:pr-40 space-y-6" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 via-sky-400 to-cyan-400 flex items-center justify-center shadow-md">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-foreground">
                    {t("ai.title")}
                  </h2>
                  <p className="mt-1" style={{ fontSize: "14px", color: "#718096", marginTop: "4px" }}>
                    {t("home.aiCardSubtitle")}
                  </p>
                </div>
              </div>

              {/* Single pill input — trigger only: dispatches sehatbeat-open-ai */}
              <div className="bg-white border border-gray-200 shadow-lg rounded-full px-4 py-3 min-h-[52px] flex items-center gap-2 focus-within:ring-2 focus-within:ring-teal-300">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full flex-shrink-0 bg-teal-500 text-white hover:bg-teal-600"
                  onClick={() => openAIWithMessage(voiceInput)}
                  aria-label={t("ai.sendButton")}
                >
                  <Send className="w-4 h-4" />
                </Button>
                <Input
                  type="text"
                  value={voiceInput}
                  onChange={(e) => setVoiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      openAIWithMessage(voiceInput);
                    }
                  }}
                  placeholder={t("home.heroSymptomsPlaceholder")}
                  className="flex-1 border-0 bg-transparent px-2 text-sm placeholder:text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label={t("home.heroSymptomsPlaceholder")}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={`h-9 w-9 rounded-full flex-shrink-0 ${isListening ? "bg-red-500 text-white hover:bg-red-600" : "bg-teal-500 text-white hover:bg-teal-600"}`}
                  onClick={() => {
                    const rec = recognitionRef.current;
                    if (!rec) return;
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
                  aria-label={isListening ? t("ai.stopListening") : t("ai.startVoiceInput")}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              </div>
              {isListening && (
                <p className="text-center text-sm text-red-500 animate-pulse">{t("ai.listening")}</p>
              )}

              <div className="space-y-2">
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#718096", letterSpacing: "0.01em" }}>
                  {t("home.aiCardTryAsking")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {getSuggestedPrompts(t).map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-4 py-2 text-xs md:text-sm text-muted-foreground hover:bg-teal-50 hover:border-teal-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() => handleSuggestionClick(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="rounded-xl border-2 px-5 py-2.5 hover:bg-muted/60 hover:translate-x-1 transition-transform duration-300 flex items-center justify-center gap-2"
                  onClick={() => setIsDemoOpen(true)}
                >
                  <PlayCircle className="w-5 h-5" />
                  {t("home.watchDemo")}
                </Button>
              </div>
                </div>

                <img
                  src="/assets/doctor-avatar.png"
                  alt="SehatBeat AI Doctor"
                  className="absolute pointer-events-none hidden md:block"
                  style={{
                    right: "-128px",
                    bottom: "0",
                    height: "112%",
                    width: "auto",
                    objectFit: "contain",
                    objectPosition: "bottom",
                    zIndex: 10,
                    filter: "drop-shadow(-8px 0 24px rgba(0,0,0,0.10))"
                  }}
                />
              </div>
            </div>
          </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-12 pt-8 mt-8" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:scale-105 transition-transform">
            <Shield className="w-[22px] h-[22px] text-secondary" />
            <span className="text-[14px] font-semibold">{t("home.statsCompliant")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:scale-105 transition-transform">
            <Users className="w-[22px] h-[22px] text-secondary" />
            <span className="text-[14px] font-semibold">{t("home.statsPatients")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:scale-105 transition-transform">
            <Zap className="w-[22px] h-[22px] text-secondary" />
            <span className="text-[14px] font-semibold">{t("home.statsUptime")}</span>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-gradient-primary rounded-full opacity-20 animate-float" />
      <div className="absolute bottom-1/3 right-10 w-16 h-16 bg-gradient-secondary rounded-full opacity-20 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-gradient-accent rounded-full opacity-20 animate-float" style={{ animationDelay: '2s' }} />

      {/* Demo Video Modal */}
      {isDemoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sehatbeat-demo-title"
          onClick={() => setIsDemoOpen(false)}
        >
          <div
            ref={demoModalRef}
            className="relative w-full max-w-3xl bg-background rounded-2xl shadow-strong overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-4 py-3 border-b">
              <h2
                id="sehatbeat-demo-title"
                className="text-sm font-medium text-foreground"
              >
                {t("home.watchDemo")}
              </h2>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={t("common.close")}
                onClick={() => setIsDemoOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="aspect-video w-full bg-gradient-to-br from-blue-900 to-teal-900 flex flex-col items-center justify-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                <PlayCircle className="w-12 h-12 text-white/80" />
              </div>
              <p className="text-white font-semibold text-lg">Demo available at sehat-beat.vercel.app</p>
              <p className="text-white/60 text-sm">Live demo coming soon</p>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};