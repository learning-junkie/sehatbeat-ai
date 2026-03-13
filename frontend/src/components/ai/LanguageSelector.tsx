type AppLanguage = "en" | "hi";

interface Props {
  language: AppLanguage;
  onChange: (lang: AppLanguage) => void;
}

export function LanguageSelector({ language, onChange }: Props) {
  return (
    <div className="flex gap-1 bg-muted rounded-lg p-1">
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
          language === "en"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-transparent text-muted-foreground border-muted-foreground/30"
        }`}
      >
        🇬🇧 English
      </button>
      <button
        type="button"
        onClick={() => onChange("hi")}
        className={`px-2 py-0.5 rounded-full text-[10px] border transition-colors ${
          language === "hi"
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-transparent text-muted-foreground border-muted-foreground/30"
        }`}
      >
        🇮🇳 हिन्दी
      </button>
    </div>
  );
}