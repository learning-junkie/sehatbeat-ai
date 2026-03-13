import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, AlertTriangle } from "lucide-react";

// TODO: wire this to the real doctor avatar asset once available
const DOCTOR_AVATAR_SRC = "/doctor-avatar.png";

interface OnboardingProps {
  onComplete?: (lang: "en" | "hi") => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "hi" | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const queueRef = useRef<string[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cancelSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    queueRef.current = [];
    currentUtteranceRef.current = null;
    setIsSpeaking(false);
  };

  const playNextInQueue = (lang: "en" | "hi") => {
    if (!queueRef.current.length) {
      setIsSpeaking(false);
      return;
    }

    const nextText = queueRef.current.shift();
    if (!nextText) {
      setIsSpeaking(false);
      return;
    }

    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextText);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      playNextInQueue(lang);
    };
    utterance.onerror = () => {
      playNextInQueue(lang);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const speakSequence = (lines: string[], lang: "en" | "hi") => {
    cancelSpeech();
    if (!lines.length) return;
    queueRef.current = [...lines];
    playNextInQueue(lang);
  };

  const handleEmergency = () => {
    // Emergency interrupt: immediately stop audio and reset choice
    cancelSpeech();
    setSelectedLanguage(null);
    // Draw attention to language buttons via a quick shake.
    setShouldShake(true);
    window.setTimeout(() => setShouldShake(false), 300);
  };

  const handleSelectLanguage = (lang: "en" | "hi") => {
    // Extra safety: kill any pending speech before handoff.
    cancelSpeech();
    setSelectedLanguage(lang);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("sehatbeat_lang", lang);
    }

    if (onComplete) {
      onComplete(lang);
    }
  };

  useEffect(() => {
    if (!hasStarted || !selectedLanguage) return;

    const englishIntro = [
      "Welcome to SehatBeat.",
      "I am your AI health assistant.",
      "You can talk to me about symptoms, medicines, and daily reminders."
    ];

    const hindiIntro = [
      "सेहतबीट में आपका स्वागत है।",
      "मैं आपका एआई हेल्थ असिस्टेंट हूँ।",
      "आप मुझसे लक्षणों, दवाइयों और रोज़मर्रा के रिमाइंडर्स के बारे में बात कर सकते हैं।"
    ];

    const lines = selectedLanguage === "hi" ? hindiIntro : englishIntro;
    speakSequence(lines, selectedLanguage);
  }, [hasStarted, selectedLanguage]);

  const speakingGlowClass = isSpeaking
    ? "shadow-[0_0_60px_rgba(59,130,246,0.5)] ring-4 ring-blue-400/60 animate-pulse"
    : "shadow-lg ring-2 ring-blue-200/40";

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-gradient-to-br from-sky-50 via-blue-50 to-emerald-50">
      {/* Top bar with emergency interrupt */}
      <header className="flex items-center justify-end px-6 py-4">
        <Button
          type="button"
          variant="destructive"
          className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold shadow-md shadow-red-500/30"
          onClick={handleEmergency}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Skip / Emergency</span>
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-between px-4 pb-6 pt-2">
        {/* Center avatar */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className={`relative h-40 w-40 md:h-52 md:w-52 rounded-full bg-white overflow-hidden flex items-center justify-center transition-all duration-300 ${speakingGlowClass}`}
          >
            <img
              src={DOCTOR_AVATAR_SRC}
              alt="SehatBeat doctor assistant"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Bottom language choice section */}
        <section className="w-full max-w-5xl">
          <div className="mb-4 text-center">
            <p className="text-sm md:text-base font-medium text-slate-800">
              Choose your preferred language to continue
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[50vh] md:h-[45vh]">
            {/* English button */}
            <button
              type="button"
              onClick={() => handleSelectLanguage("en")}
              className={`group relative flex flex-col items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300/80 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] ${
                shouldShake ? "sehatbeat-shake-once" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl md:text-3xl font-semibold">English</span>
                <Volume2 className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <p className="text-xs md:text-sm text-blue-100 max-w-xs text-center">
                Talk to SehatBeat AI in English about symptoms, medicines, and reminders.
              </p>
            </button>

            {/* Hindi button */}
            <button
              type="button"
              onClick={() => handleSelectLanguage("hi")}
              className={`group relative flex flex-col items-center justify-center rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-500/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/80 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] ${
                shouldShake ? "sehatbeat-shake-once" : ""
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl md:text-3xl font-semibold">हिंदी</span>
                <Volume2 className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <p className="text-xs md:text-sm text-emerald-100 max-w-xs text-center">
                SehatBeat AI से हिंदी में बात करें — लक्षण, दवाइयाँ और रिमांडर्स के बारे में।
              </p>
            </button>
          </div>
        </section>
      </main>

      {/* Tap-to-start overlay to comply with browser audio policies */}
      {!hasStarted && (
        <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <button
            type="button"
            className="rounded-2xl bg-white px-8 py-4 text-base md:text-lg font-semibold text-slate-900 shadow-xl shadow-black/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
            onClick={() => setHasStarted(true)}
          >
            Tap to Start Audio Experience
          </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;

