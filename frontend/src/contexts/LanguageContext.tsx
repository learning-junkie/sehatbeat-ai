import React, { createContext, useContext, useState } from "react";

export type Language = "en" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

import { t as translations } from "@/lib/translations";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored =
        window.localStorage.getItem("sehatbeat-language") ??
        window.localStorage.getItem("sehatbeat_language");
      if (stored === "en" || stored === "hi") {
        return stored;
      }
    }
    return "en"; // Default fallback
  });

  const setLanguage = (lang: Language) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sehatbeat-language", lang);
      window.localStorage.setItem("sehatbeat_language", lang);
      // We also update the old key just in case some other code was relying on it
      window.localStorage.setItem("sehatbeat_lang", lang);
    }
    setLanguageState(lang);
  };

  const t = (key: string) => {
    // split key by dot (e.g. "nav.home")
    const parts = key.split(".");
    let current: any = translations[language];
    for (const part of parts) {
      if (current === undefined) break;
      current = current[part];
    }
    return typeof current === "string" ? current : key;
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
