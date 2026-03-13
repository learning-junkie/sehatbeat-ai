import React, { createContext, useContext, useState } from "react";

export type Language = "en" | "hi";

interface LanguageContextType {
  language: Language | null;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    welcome: "Welcome to SehatBeat",
    choose_language: "Choose your language",
    english: "English",
    hindi: "Hindi",
    
    // AI Assistant translates
    ai_title: "SehatBeat AI",
    ai_online: "Online (AI Active)",
    ai_offline: "Offline Mode (Basic First-Aid)",
    ai_analyzing: "Analyzing with Gemini AI...",
    ai_powered_by: "Powered by Gemini AI",
    ai_local_guidance: "Using local, lightweight guidance",
    voice_not_supported: "Voice not supported",
    voice_not_supported_desc: "Your browser does not support speech recognition. Try Chrome.",
    emergency_detected: "🚨 Emergency Detected",
    emergency_desc: "Call 112 or go to nearest hospital immediately.",
    connection_error: "Connection Error",
    connection_error_desc: "Unable to reach the SehatBeat analysis service. Please try again or check your connection.",
    saved_for_later: "Saved for later",
    saved_for_later_desc: "This question will be sent to SehatBeat AI automatically when your internet returns.",
    offline_mode: "Offline mode",
    offline_mode_desc: "You are offline. Showing saved first-aid guidance. For detailed AI analysis, reconnect to the internet.",
    ai_analyzing_short: "Analyzing with AI...",
    open_ai: "Open SehatBeat AI",
  },
  hi: {
    welcome: "सेहतबीट में आपका स्वागत है",
    choose_language: "अपना भाषा चुनें",
    english: "अंग्रेज़ी",
    hindi: "हिंदी",

    // AI Assistant translates
    ai_title: "सेहतबीट एआई",
    ai_online: "ऑनलाइन (एआई सक्रिय)",
    ai_offline: "ऑफ़लाइन मोड (बुनियादी प्राथमिक उपचार)",
    ai_analyzing: "जेमिनी एआई के साथ विश्लेषण...",
    ai_powered_by: "जेमिनी एआई द्वारा संचालित",
    ai_local_guidance: "स्थानीय, हल्के मार्गदर्शन का उपयोग",
    voice_not_supported: "वॉइस समर्थित नहीं",
    voice_not_supported_desc: "आपका ब्राउज़र स्पीच रिकग्निशन को सपोर्ट नहीं करता।",
    emergency_detected: "🚨 आपातकाल का पता चला",
    emergency_desc: "तुरंत 112 डायल करें या नजदीकी अस्पताल जाएं।",
    connection_error: "कनेक्शन त्रुटि",
    connection_error_desc: "सेहतबीट विश्लेषण सेवा तक पहुंचने में असमर्थ। कृपया पुनः प्रयास करें या अपना कनेक्शन जांचें।",
    saved_for_later: "बाद के लिए सहेजा गया",
    saved_for_later_desc: "इंटरनेट वापस आने पर यह प्रश्न स्वचालित रूप से सेहतबीट एआई को भेजा जाएगा।",
    offline_mode: "ऑफ़लाइन मोड",
    offline_mode_desc: "आप ऑफ़लाइन हैं। सहेजे गए प्राथमिक उपचार मार्गदर्शन दिखा रहे हैं। विस्तृत एआई विश्लेषण के लिए, इंटरनेट से पुनः कनेक्ट करें।",
    ai_analyzing_short: "AI विश्लेषण कर रहा है...",
    open_ai: "सेहतबीट एआई खोलें",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language | null>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("sehatbeat_lang");
      if (stored === "en" || stored === "hi") {
        return stored;
      }
    }
    return null;
  });

  const setLanguage = (lang: Language) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sehatbeat_lang", lang);
    }
    setLanguageState(lang);
  };

  const t = (key: string) => {
    if (!language) return key;
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
