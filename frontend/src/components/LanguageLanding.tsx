import React, { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LanguageLanding() {
  const { setLanguage } = useLanguage();
  const [show, setShow] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("sehatbeat_language");
    if (!stored) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const handleSelect = (lang: "en" | "hi") => {
    setLanguage(lang);
    setIsFadingOut(true);
    setTimeout(() => {
      setShow(false);
    }, 500); // 500ms fade transition
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white transition-opacity duration-500 ease-in-out ${
        isFadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-md px-6 flex flex-col items-center">
        {/* Logo Text & Tagline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-2 tracking-tight">
            SehatBeat
          </h1>
          <p className="text-lg font-bold text-slate-700">Your Health, Simplified</p>
          <p className="text-base font-medium text-slate-600 mt-1">आपका स्वास्थ्य, सरल बनाया</p>
        </div>

        {/* Doctor Avatar with Floating Animation and Glow Ring */}
        <div className="relative mb-6 flex justify-center w-[200px] h-[200px] md:w-[280px] md:h-[280px]">
          <div className="w-full h-full rounded-full ring-4 ring-teal-400 ring-offset-4 animate-pulse absolute inset-0 m-auto"></div>
          <img 
            src="/doctor-avatar.png" 
            alt="SehatBeat Doctor Avatar" 
            className="w-full h-full object-contain drop-shadow-2xl animate-float relative z-10"
            onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Doc&background=0D8ABC&color=fff&size=512"; }}
          />
        </div>

        {/* Speech Bubble */}
        <div className="relative bg-white rounded-2xl shadow-lg p-4 mb-10 w-full text-center max-w-sm">
          {/* Triangle Pointer */}
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[12px] border-l-transparent border-r-transparent border-b-white"></div>
          <p className="text-slate-800 font-medium text-sm md:text-base">
            Hi! I'm your SehatBeat AI doctor. Please choose your language to continue.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row w-full gap-4 items-center justify-center mb-6">
          <button 
            onClick={() => handleSelect("en")}
            className="w-full sm:w-[160px] flex flex-col items-center justify-center p-4 rounded-2xl bg-white border-2 border-blue-600 shadow-lg hover:scale-105 active:scale-95 transition-all focus:outline-none"
          >
            <span className="text-3xl mb-1">🇬🇧</span>
            <span className="text-xl font-bold text-blue-600">English</span>
            <span className="text-xs text-blue-600/80 mt-1">Continue in English</span>
          </button>
          
          <button 
            onClick={() => handleSelect("hi")}
            className="w-full sm:w-[160px] flex flex-col items-center justify-center p-4 rounded-2xl bg-white border-2 border-teal-500 shadow-lg hover:scale-105 active:scale-95 transition-all focus:outline-none"
          >
            <span className="text-3xl mb-1">🇮🇳</span>
            <span className="text-xl font-bold text-teal-600">हिन्दी</span>
            <span className="text-xs text-teal-600/80 mt-1">हिन्दी में जारी रखें</span>
          </button>
        </div>

        {/* Footer text */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <p>You can change this anytime from the chat assistant</p>
          <p>आप इसे कभी भी बदल सकते हैं</p>
        </div>
      </div>
    </div>
  );
}
