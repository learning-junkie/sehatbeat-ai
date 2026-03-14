import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageLanding() {
  const { language, setLanguage } = useLanguage();
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const hasChosen =
      window.localStorage.getItem("sehatbeat-language-chosen") === "true";
    return !hasChosen;
  });
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("sehatbeat-language");
    if (stored === "en" || stored === "hi") {
      setLanguage(stored);
    }
  }, [setLanguage]);

  const fullMessage = language === "hi"
    ? "नमस्ते! मैं आपकी SehatBeat AI डॉक्टर हूं। कृपया अपनी भाषा चुनें।"
    : "Hi! I'm your SehatBeat AI doctor. Please choose your language to continue.";

  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < fullMessage.length) {
        setDisplayedText(fullMessage.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 26);
    return () => clearInterval(interval);
  }, [fullMessage]);

  if (!show) return null;

  const handleLanguageChoice = (lang: "en" | "hi") => {
    window.localStorage.setItem("sehatbeat-language", lang);
    window.localStorage.setItem("sehatbeat-language-chosen", "true");
    setLanguage(lang);
    setIsFadingOut(true);
    setTimeout(() => {
      setShow(false);
    }, 500); // 500ms fade transition
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] min-h-screen flex flex-col items-center justify-center px-5 py-10 transition-opacity duration-500 ease-in-out ${isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      style={{
        background:
          "linear-gradient(160deg, #f0f7ff 0%, #f0fdf4 55%, #faf5ff 100%)",
      }}
    >
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Logo Text & Tagline */}
        <div className="text-center mb-8">
          <h1
            className="mb-2"
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#1a202c",
              letterSpacing: "-0.5px",
            }}
          >
            SehatBeat
          </h1>
          <p style={{ fontSize: "15px", fontWeight: 500, color: "#4a5568" }}>
            Your Health, Simplified
          </p>
          <p
            className="mt-1"
            style={{ fontSize: "13px", fontWeight: 400, color: "#718096" }}
          >
            आपका स्वास्थ्य, सरल बनाया
          </p>
        </div>

        {/* Doctor avatar */}
        <div className="mb-6">
          <div
            className="relative mx-auto flex-shrink-0"
            style={{ width: "156px", height: "156px" }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "linear-gradient(135deg, #dbeafe 0%, #d1fae5 100%)",
                boxShadow: "0 8px 32px rgba(99, 179, 237, 0.25)",
              }}
            />

            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                inset: "-5px",
                border: "2px solid rgba(99, 179, 237, 0.35)",
                animation: "pulse-ring 2.8s ease-out infinite",
                borderRadius: "50%",
              }}
            />

            <img
              src="/assets/doctor-avatar.png"
              alt="SehatBeat AI Doctor"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 animate-float"
              style={{
                width: "136px",
                height: "136px",
                objectFit: "contain",
                objectPosition: "bottom",
              }}
              onError={(e) => {
                e.currentTarget.src =
                  "https://ui-avatars.com/api/?name=Doc&background=0D8ABC&color=fff&size=512";
              }}
            />
          </div>
        </div>

        {/* AI message bubble */}
        <div className="mb-8 w-full flex justify-center px-2">
          <div className="flex items-start gap-3 w-full" style={{ maxWidth: "440px" }}>
            <div
              className="flex-shrink-0 rounded-full flex items-center justify-center"
              style={{
                width: "38px",
                height: "38px",
                background: "linear-gradient(135deg, #667eea 0%, #48bb78 100%)",
                marginTop: "2px",
                boxShadow: "0 2px 8px rgba(102,126,234,0.35)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
              </svg>
            </div>

            <div
              className="relative flex-1 bg-white rounded-2xl px-4 py-3"
              style={{
                borderRadius: "4px 18px 18px 18px",
                boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
                minHeight: "52px",
              }}
            >
              <p className="text-gray-700 leading-relaxed m-0" style={{ fontSize: "14.5px" }}>
                {typeof displayedText !== "undefined" && displayedText.length > 0
                  ? displayedText
                  : (language === "hi"
                    ? "नमस्ते! मैं आपकी SehatBeat AI डॉक्टर हूं। कृपया अपनी भाषा चुनें।"
                    : "Hi! I'm your SehatBeat AI doctor. Please choose your language to continue.")}
                {isTyping && (
                  <span
                    className="inline-block ml-0.5 align-text-bottom bg-indigo-500"
                    style={{
                      width: "2px",
                      height: "15px",
                      animation: "blink 1s step-end infinite",
                    }}
                  />
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mb-5 flex flex-col sm:flex-row w-full gap-4 items-center justify-center">
          <button
            onClick={() => handleLanguageChoice("en")}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(102,126,234,0.18)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            className="w-full sm:w-[160px] flex flex-col items-center justify-center p-5 rounded-2xl bg-white border-2 border-transparent hover:border-indigo-400 focus:border-indigo-500 hover:scale-105 active:scale-95 transition-all focus:outline-none"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <span className="text-3xl mb-1">🇬🇧</span>
            <span className="text-blue-600" style={{ fontSize: "21px", fontWeight: 700 }}>
              English
            </span>
            <span className="text-blue-600/80 mt-1" style={{ fontSize: "11px" }}>
              Continue in English
            </span>
          </button>

          <button
            onClick={() => handleLanguageChoice("hi")}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(102,126,234,0.18)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
            className="w-full sm:w-[160px] flex flex-col items-center justify-center p-5 rounded-2xl bg-white border-2 border-transparent hover:border-teal-400 focus:border-teal-500 hover:scale-105 active:scale-95 transition-all focus:outline-none"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
          >
            <span className="text-3xl mb-1">🇮🇳</span>
            <span className="text-teal-600" style={{ fontSize: "21px", fontWeight: 700 }}>
              हिन्दी
            </span>
            <span className="text-teal-600/80 mt-1" style={{ fontSize: "11px" }}>
              हिन्दी में जारी रखें
            </span>
          </button>
        </div>

        {/* Footer text */}
        <p className="text-xs text-center text-gray-400 leading-relaxed" style={{ maxWidth: "300px" }}>
          Choose your preferred language to begin chatting with SehatBeat AI.
          <br />
          <span className="text-gray-300" style={{ fontSize: "11px" }}>
            You can change this anytime from the chat assistant.
          </span>
        </p>
      </div>
    </div>
  );
}
