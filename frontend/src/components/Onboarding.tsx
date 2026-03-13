import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const DOCTOR_AVATAR_SRC = "/doctor-avatar.png"; // We can reuse this or simple icon

export default function Onboarding() {
  const { setLanguage } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioStartedRef = useRef(false);

  const stopAudio = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const playAudio = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    stopAudio(); // Clear any existing speech
    setIsPlaying(true);
    
    const enUtterance = new SpeechSynthesisUtterance("Welcome to SehatBeat. Choose your language.");
    enUtterance.lang = "en-IN";
    
    const hiUtterance = new SpeechSynthesisUtterance("SehatBeat mein aapka swagat hai. Apna bhasha chune.");
    hiUtterance.lang = "hi-IN";
    
    hiUtterance.onend = () => {
      setIsPlaying(false);
    };
    
    hiUtterance.onerror = () => {
      setIsPlaying(false);
    };
    
    window.speechSynthesis.speak(enUtterance);
    window.speechSynthesis.speak(hiUtterance);
  };

  useEffect(() => {
    if (hasInteracted && !audioStartedRef.current) {
      audioStartedRef.current = true;
      playAudio();
    }
  }, [hasInteracted]);

  const handleLanguageSelect = (lang: "en" | "hi") => {
    stopAudio();
    setLanguage(lang);
  };

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col bg-slate-900 overflow-hidden"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
    >
      {/* Skip Audio Button */}
      <div className="absolute top-4 right-4 z-[110]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            stopAudio();
          }}
          className="bg-slate-800/80 hover:bg-slate-700 text-white px-5 py-3 rounded-full border border-slate-600 font-bold text-lg shadow-lg active:scale-95 transition-all"
        >
          Skip Audio
        </button>
      </div>

      {/* Doctor Avatar - absolute center with glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[105] pointer-events-none">
        <div className={`w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-8 border-white bg-white transition-all duration-300 ${isPlaying ? 'animate-pulse shadow-[0_0_80px_rgba(255,255,255,0.9)] scale-110' : 'shadow-[0_0_30px_rgba(0,0,0,0.5)]'}`}>
          <img 
            src={DOCTOR_AVATAR_SRC} 
            alt="Doctor" 
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Doc&background=0D8ABC&color=fff&size=256"; }}
          />
        </div>
      </div>

      {/* Tappable Halves */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleInteraction();
          handleLanguageSelect("en");
        }}
        className="flex-1 w-full h-[50vh] bg-blue-600 hover:bg-blue-500 active:bg-blue-700 flex flex-col items-center justify-start pt-20 transition-colors focus:outline-none"
      >
        <span className="text-white text-6xl md:text-8xl font-black tracking-tight drop-shadow-2xl">
          English
        </span>
      </button>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          handleInteraction();
          handleLanguageSelect("hi");
        }}
        className="flex-1 w-full h-[50vh] bg-green-600 hover:bg-green-500 active:bg-green-700 flex flex-col items-center justify-end pb-20 transition-colors focus:outline-none"
      >
        <span className="text-white text-6xl md:text-8xl font-black tracking-tight drop-shadow-2xl">
          हिंदी
        </span>
      </button>

      {/* Tap to start hint */}
      {!hasInteracted && (
        <div className="absolute top-[70%] left-1/2 -translate-x-1/2 z-[110] pointer-events-none text-center bg-black/60 px-6 py-4 rounded-3xl backdrop-blur-md">
          <p className="text-white text-xl md:text-2xl font-bold animate-bounce drop-shadow-lg">
            Tap anywhere to listen<br/>सुनने के लिए कहीं भी टैप करें
          </p>
        </div>
      )}
    </div>
  );
}
