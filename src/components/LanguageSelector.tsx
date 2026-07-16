import { useLanguage } from "../contexts/LanguageContext";
import { clsx } from "clsx";

export default function LanguageSelector() {
  const { lang, changeLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-400 select-none bg-surface-container-highest/20 px-2 py-1 rounded-full border border-white/5">
      <button
        onClick={() => changeLanguage("fr")}
        className={clsx(
          "transition-all px-1.5 py-0.5 rounded cursor-pointer",
          lang === "fr" ? "text-primary bg-primary/10 font-bold" : "hover:text-slate-200"
        )}
        aria-label="Switch to French"
      >
        FR
      </button>
      <span className="text-slate-600">|</span>
      <button
        onClick={() => changeLanguage("en")}
        className={clsx(
          "transition-all px-1.5 py-0.5 rounded cursor-pointer",
          lang === "en" ? "text-primary bg-primary/10 font-bold" : "hover:text-slate-200"
        )}
        aria-label="Switch to English"
      >
        EN
      </button>
      <span className="text-slate-600">|</span>
      <button
        onClick={() => changeLanguage("es")}
        className={clsx(
          "transition-all px-1.5 py-0.5 rounded cursor-pointer",
          lang === "es" ? "text-primary bg-primary/10 font-bold" : "hover:text-slate-200"
        )}
        aria-label="Switch to Spanish"
      >
        ES
      </button>
    </div>
  );
}
