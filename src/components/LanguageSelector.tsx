import { useLanguage, languageNames, type Language } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const languages: Language[] = ["en", "hi", "kn", "te", "ta"];

const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <Globe className="size-4 text-muted-foreground" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="appearance-none bg-transparent text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none pr-1"
      >
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {languageNames[lang]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
