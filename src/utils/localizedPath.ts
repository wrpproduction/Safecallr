import { LanguageType } from "../locales/translations";

export const APP_ROUTE_PREFIXES = [
  "/dashboard",
  "/auth",
  "/register",
  "/me",
  "/admin",
  "/pro",
  "/onboarding",
  "/welcome",
  "/complete-profile",
];

/**
 * Checks if a given pathname belongs to an application route (authenticated / internal flow).
 */
export function isAppRoute(pathname: string): boolean {
  const cleanPath = (pathname.split("?")[0].split("#")[0] || "/").toLowerCase();
  return APP_ROUTE_PREFIXES.some(
    (prefix) => cleanPath === prefix || cleanPath.startsWith(`${prefix}/`)
  );
}

interface LegalRouteMapping {
  fr: string;
  en: string;
  es: string;
  aliases?: string[];
}

const LEGAL_ROUTES: LegalRouteMapping[] = [
  {
    fr: "/mentions-legales",
    en: "/legal-notice",
    es: "/aviso-legal",
  },
  {
    fr: "/cgu",
    en: "/terms",
    es: "/terminos",
    aliases: ["/terms-of-use", "/condiciones-uso"],
  },
  {
    fr: "/confidentialite",
    en: "/privacy",
    es: "/privacidad",
  },
];

/**
 * Returns the localized URL path for the target language.
 * Preserves query params and hash.
 * Returns null for app routes (where URL should not change).
 */
export function getLocalizedPath(
  currentPath: string,
  targetLang: LanguageType,
  search: string = "",
  hash: string = ""
): string | null {
  // Extract pathname, query, and hash if passed as a single string
  let pathname = currentPath;
  let currentSearch = search;
  let currentHash = hash;

  if (pathname.includes("#")) {
    const hashIndex = pathname.indexOf("#");
    if (!currentHash) currentHash = pathname.substring(hashIndex);
    pathname = pathname.substring(0, hashIndex);
  }

  if (pathname.includes("?")) {
    const queryIndex = pathname.indexOf("?");
    if (!currentSearch) currentSearch = pathname.substring(queryIndex);
    pathname = pathname.substring(0, queryIndex);
  }

  // 1. Pages applicatives -> pas de navigation (retourne null)
  if (isAppRoute(pathname)) {
    return null;
  }

  const suffix = `${currentSearch}${currentHash}`;
  const normalizedPath = pathname.endsWith("/") && pathname.length > 1
    ? pathname.slice(0, -1)
    : pathname;

  // 2. Pages légales (correspondance explicite par triplet)
  for (const legal of LEGAL_ROUTES) {
    const allMatches = [legal.fr, legal.en, legal.es, ...(legal.aliases || [])];
    if (allMatches.includes(normalizedPath.toLowerCase())) {
      return `${legal[targetLang]}${suffix}`;
    }
  }

  // 3. Pages publiques préfixables
  // Retirer le préfixe /en ou /es existant s'il y en a un
  let unlocalizedPath = normalizedPath;
  if (unlocalizedPath.startsWith("/en/") || unlocalizedPath === "/en") {
    unlocalizedPath = unlocalizedPath.substring(3) || "/";
  } else if (unlocalizedPath.startsWith("/es/") || unlocalizedPath === "/es") {
    unlocalizedPath = unlocalizedPath.substring(3) || "/";
  }

  if (!unlocalizedPath.startsWith("/")) {
    unlocalizedPath = `/${unlocalizedPath}`;
  }

  if (targetLang === "fr") {
    return `${unlocalizedPath}${suffix}`;
  } else if (targetLang === "en") {
    return unlocalizedPath === "/" ? `/en${suffix}` : `/en${unlocalizedPath}${suffix}`;
  } else if (targetLang === "es") {
    return unlocalizedPath === "/" ? `/es${suffix}` : `/es${unlocalizedPath}${suffix}`;
  }

  // 4. Repli
  const fallback = targetLang === "fr" ? "/" : `/${targetLang}`;
  return `${fallback}${suffix}`;
}
