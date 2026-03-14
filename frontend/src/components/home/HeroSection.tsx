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

  const heroText = t("home.hero");
  const heroParts = heroText.includes(",") ? heroText.split(",") : [heroText, ""];
  const heroLine1 = heroParts[0].trim();
  const heroLine2 = heroParts.slice(1).join(",").trim();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Medical professionals in a modern healthcare facility"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Left: Text Content */}
            <div className="flex-1 text-center md:text-left space-y-8">
          {/* Badge */}
          <Badge className="bg-gradient-accent text-accent-foreground px-4 py-2 text-sm animate-float" variant="secondary">
            <Activity className="w-4 h-4 mr-2" />
            {t("home.badge")}
          </Badge>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              {heroLine1}{heroLine2 ? "," : ""}
              {heroLine2 && (
                <span className="block text-transparent bg-clip-text bg-gradient-hero">
                  {heroLine2}
                </span>
              )}
            </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto md:mx-0 leading-relaxed">
            {t("home.heroSub")}
          </p>
          </div>

          {/* AI Intro Card — single trigger-only input; opens floating AIAssistant (no duplicate chatbot) */}
          <div className="mt-6">
            <div className="mx-auto max-w-3xl w-full text-left">
              <div className="rounded-2xl border border-border/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-black/5 p-6 md:p-8 space-y-6">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 via-sky-400 to-cyan-400 flex items-center justify-center shadow-md">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-foreground">
                      {t("ai.title")}
                    </h2>
                    <p className="mt-1 text-sm md:text-base text-muted-foreground">
                      {t("home.aiCardSubtitle")}
                    </p>
                  </div>
                </div>

                {/* Single pill input — trigger only: dispatches sehatbeat-open-ai */}
                <div className="bg-white border border-gray-200 shadow-lg rounded-full px-4 py-3 flex items-center gap-2">
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
                    className="flex-1 border-0 bg-transparent px-2 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
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
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {t("home.aiCardTryAsking")}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getSuggestedPrompts(t).map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-2 text-xs md:text-sm text-muted-foreground hover:bg-background hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                    className="w-full sm:w-auto rounded-xl border-2 hover:bg-muted/60 transition-all duration-300 flex items-center justify-center gap-2"
                    onClick={() => setIsDemoOpen(true)}
                  >
                    <PlayCircle className="w-5 h-5" />
                    {t("home.watchDemo")}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-6 justify-center md:justify-start items-center pt-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-secondary" />
              <span>{t("home.statsCompliant")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4 text-secondary" />
              <span>{t("home.statsPatients")}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-secondary" />
              <span>{t("home.statsUptime")}</span>
            </div>
          </div>
            </div>{/* end left column */}

            {/* Right: Doctor Avatar */}
            <div className="hidden md:flex flex-shrink-0 items-center justify-center">
              <img
                src="/assets/doctor-avatar.png"
                alt="SehatBeat AI Doctor"
                className="h-[420px] w-auto object-contain animate-float"
                style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))" }}
              />
            </div>
            {/* Mobile: show doctor avatar below text */}
            <div className="flex md:hidden justify-center w-full">
              <img
                src="/assets/doctor-avatar.png"
                alt="SehatBeat AI Doctor"
                className="h-[280px] w-auto object-contain animate-float"
                style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))" }}
              />
            </div>
          </div>{/* end flex row */}
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