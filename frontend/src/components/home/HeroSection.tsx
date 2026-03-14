import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Activity, MessageCircle, PlayCircle, Shield, Users, Zap } from "lucide-react";
import heroImage from "@/assets/medical.jpg";
import AIChatbot from "@/components/AIChatbot";
import { useLanguage } from "@/contexts/LanguageContext";

const getSuggestedPrompts = (t: (key: string) => string) => [
  t("home.aiCardPrompt1"),
  t("home.aiCardPrompt2"),
  t("home.aiCardPrompt3"),
  t("home.aiCardPrompt4")
];

export const HeroSection = () => {
  const { t } = useLanguage();
  const [chatQuestion, setChatQuestion] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const demoModalRef = useRef<HTMLDivElement | null>(null);

  const handleAskAI = (event: React.FormEvent) => {
    event.preventDefault();
    if (!chatQuestion.trim()) return;
    setIsChatOpen(true);
  };

  const handleSuggestionClick = (prompt: string) => {
    setChatQuestion(prompt);
    setIsChatOpen(true);
  };

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

          {/* AI Chat Intro Card */}
          <div className="mt-6">
            <div className="mx-auto max-w-3xl w-full text-left">
              <div className="rounded-2xl border border-border/60 bg-white/80 backdrop-blur-xl shadow-xl shadow-black/5 p-6 md:p-8 space-y-6">
                {/* AI Header */}
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

                {/* Chat-style Composer */}
                <form
                  onSubmit={handleAskAI}
                  className="space-y-3"
                  aria-label="Start a conversation with SehatBeat AI"
                >
                  <div className="rounded-2xl border border-border/70 bg-muted/40 px-3 py-2 sm:px-4 sm:py-3 shadow-sm flex items-center gap-3">
                    <Input
                      type="text"
                      aria-label={t("home.aiCardPlaceholder")}
                      placeholder={t("home.aiCardPlaceholder")}
                      value={chatQuestion}
                      onChange={(e) => setChatQuestion(e.target.value)}
                      className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base"
                    />
                    {/* Desktop / tablet button */}
                    <Button
                      type="submit"
                      size="lg"
                      className="hidden sm:inline-flex h-11 px-5 rounded-xl bg-gradient-primary text-primary-foreground shadow-strong hover:shadow-medium transition-all duration-300 hover:scale-[1.02] whitespace-nowrap"
                    >
                      {t("home.getStarted")} →
                    </Button>
                    {/* Mobile icon-only button */}
                    <Button
                      type="submit"
                      size="icon"
                      className="inline-flex sm:hidden h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground shadow-strong hover:shadow-medium transition-all duration-300"
                      aria-label="Ask SehatBeat AI"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </div>
                </form>

                {/* Suggested Prompts */}
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

                {/* Demo Button */}
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
                SehatBeat AI – Demo
              </h2>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Close demo video"
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

      {/* Global AI Chatbot Modal */}
      <AIChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </section>
  );
};