import React, { createContext, useContext, useState, useEffect } from "react";
import { Preferences } from "@capacitor/preferences";
import { db, doc, setDoc } from "../firebase";
import { translations, LanguageType } from "../locales/translations";

interface LanguageContextProps {
  lang: LanguageType;
  changeLanguage: (newLang: LanguageType) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const getSyncDefault = (): LanguageType => {
  if (typeof window === "undefined") {
    return "fr"; // défaut fr côté serveur
  }
  const devLang = navigator.language.substring(0, 2).toLowerCase();
  if (devLang === "fr" || devLang === "en" || devLang === "es") {
    return devLang as LanguageType;
  }
  return "en"; // fallback en
};

export function LanguageProvider({ children, user }: { children: React.ReactNode; user: any }) {
  const [lang, setLang] = useState<LanguageType>(getSyncDefault());

  useEffect(() => {
    const initLanguage = async () => {
      try {
        // Cascade order:
        // (a) champ lang du profil Firestore si connecté
        if (user && user.uid && user.lang) {
          const firestoreLang = user.lang as string;
          if (firestoreLang === "fr" || firestoreLang === "en" || firestoreLang === "es") {
            setLang(firestoreLang as LanguageType);
            return;
          }
        }

        // (b) Preferences local
        const { value } = await Preferences.get({ key: "app_lang" });
        if (value === "fr" || value === "en" || value === "es") {
          setLang(value as LanguageType);
          return;
        }

        // (c) langue du device (already falls back to en if no match)
        setLang(getSyncDefault());
      } catch (err) {
        console.error("[SafeCallr] Language initialization error:", err);
        setLang(getSyncDefault());
      }
    };

    initLanguage();
  }, [user, user?.lang]);

  const changeLanguage = async (newLang: LanguageType) => {
    setLang(newLang);

    // Persist language ONLY when explicitly chosen by user
    try {
      await Preferences.set({ key: "app_lang", value: newLang });
    } catch (err) {
      console.error("[SafeCallr] Failed to save language locally:", err);
    }

    // Persist to Firestore if user is logged in
    if (user && user.uid) {
      try {
        await setDoc(
          doc(db, "users", user.uid),
          { lang: newLang },
          { merge: true }
        );
        console.log("[SafeCallr] Language updated in Firestore to:", newLang);
      } catch (dbErr) {
        console.error("[SafeCallr] Failed to save language in Firestore:", dbErr);
      }
    }
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    try {
      const activeDictionary = translations[lang] || translations.fr;
      const parts = path.split(".");
      let current: any = activeDictionary;

      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          // Fallback to English dictionary if key is missing in active dictionary
          const fallbackDictionary = translations.en;
          let fallbackCurrent: any = fallbackDictionary;
          for (const fallbackPart of parts) {
            if (fallbackCurrent && typeof fallbackCurrent === "object" && fallbackPart in fallbackCurrent) {
              fallbackCurrent = fallbackCurrent[fallbackPart];
            } else {
              fallbackCurrent = null;
              break;
            }
          }
          if (typeof fallbackCurrent === "string") {
            current = fallbackCurrent;
          } else {
            return path; // Return the path if key completely missing
          }
          break;
        }
      }

      if (typeof current !== "string") {
        return path;
      }

      let text = current;
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          text = text.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
        });
      }

      return text;
    } catch (e) {
      console.error("[SafeCallr] Translation lookup error:", e);
      return path;
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
