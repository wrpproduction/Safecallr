import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { db, doc, getDoc, collection, query, where, getDocs } from "../../firebase";
import SEOManager from "./SEOManager";

export interface PageMetadata {
  id?: string;
  route: string;
  title: string;
  description: string;
  keywords: string[];
  heroTitle?: string;
  heroSubtitle?: string;
  ogType?: "website" | "article" | "product";
  ogImage?: string;
  canonicalUrl?: string;
  jsonLd?: object;
  customContent?: Record<string, any>;
  updatedAt?: string | number;
}

// Default static fallback metadata for primary landing pages for optimal indexing
const DEFAULT_PAGE_METADATA: Record<string, PageMetadata> = {
  particuliers: {
    route: "/particuliers",
    title: "SafeCallr pour Particuliers - Protection contre les Arnaques Téléphoniques",
    description: "Protégez votre famille et vos proches contre le spoofing vocal, les fausses urgences et le chantage téléphonique grâce à la vérification d'appel SafeCallr en temps réel.",
    keywords: [
      "arnaque téléphonique",
      "protection particuliers",
      "usurpation d'identité au téléphone",
      "vérifier un appel",
      "protéger ses proches",
      "fraude au faux proche",
      "deepfake voix",
      "spoofing vocal",
      "sécurité téléphonique",
      "SafeCallr"
    ],
    heroTitle: "Protégez votre famille des arnaques téléphoniques et usurpations vocales",
    heroSubtitle: "Système d'authentification d'appel instantané et sécurisé pour les particuliers.",
    ogType: "website",
    ogImage: "https://safecallr.com/og-particuliers.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Particuliers - SafeCallr",
      "description": "Protection téléphonique et anti-fraude vocale pour particuliers et familles.",
      "url": "https://safecallr.com/particuliers",
      "publisher": {
        "@type": "Organization",
        "name": "SafeCallr",
        "url": "https://safecallr.com"
      }
    }
  },
  professionnels: {
    route: "/professionnels",
    title: "SafeCallr pour Professionnels - Authentification Vocale Sécurisée pour Indépendants",
    description: "Sécurisez vos échanges téléphoniques professionnels, authentifiez vos clients et protégez votre activité contre les attaques au président et l'usurpation d'identité.",
    keywords: [
      "sécurité téléphonique professionnels",
      "usurpation identité entreprise",
      "authentification appel client",
      "vérification appelant pro",
      "anti-fraude téléphonique",
      "sécurité appel indépendant",
      "SafeCallr professionnels"
    ],
    heroTitle: "Garantissez la confiance dans chacune de vos conversations professionnelles",
    heroSubtitle: "Authentification à double facteur vocale pour libéraux, artisans et consultants.",
    ogType: "website",
    ogImage: "https://safecallr.com/og-professionnels.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "Professionnels - SafeCallr",
      "description": "Solution d'authentification et de vérification d'appels pour les professionnels et indépendants.",
      "url": "https://safecallr.com/professionnels",
      "publisher": {
        "@type": "Organization",
        "name": "SafeCallr",
        "url": "https://safecallr.com"
      }
    }
  },
  entreprises: {
    route: "/entreprises",
    title: "SafeCallr pour Entreprises - Protection Grands Comptes & PME contre la Cyberfraude Vocale",
    description: "Solution d'entreprise contre la fraude au président, le spear-phishing vocal (vishing) et l'usurpation de numéros de téléphone. Intégration API & SSO.",
    keywords: [
      "fraude au président",
      "vishing entreprise",
      "sécurité grands comptes",
      "protection entreprise téléphone",
      "spear phishing vocal",
      "anti-spoofing entreprise",
      "authentification forte voix",
      "SafeCallr entreprises"
    ],
    heroTitle: "Protégez votre organisation contre la cyberfraude et le vishing",
    heroSubtitle: "Plateforme d'authentification vocale centralisée pour PME, ETI et grandes entreprises.",
    ogType: "website",
    ogImage: "https://safecallr.com/og-entreprises.png",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Entreprises - SafeCallr",
      "description": "Protocole de sécurité globale et authentification des communications téléphoniques d'entreprise.",
      "url": "https://safecallr.com/entreprises",
      "publisher": {
        "@type": "Organization",
        "name": "SafeCallr",
        "url": "https://safecallr.com"
      }
    }
  }
};

/**
 * Normalizes a route string to obtain a consistent document ID / lookup key
 */
function normalizeRouteKey(routePath: string): string {
  const clean = routePath.trim().toLowerCase().split("?")[0].split("#")[0];
  if (clean === "/particuliers" || clean.endsWith("/particuliers") || clean === "particuliers") {
    return "particuliers";
  }
  if (clean === "/professionnels" || clean.endsWith("/professionnels") || clean === "professionnels") {
    return "professionnels";
  }
  if (clean === "/entreprises" || clean.endsWith("/entreprises") || clean === "entreprises") {
    return "entreprises";
  }
  // Strip leading slashes for general routes
  return clean.replace(/^\/+|\/+$/g, "") || "home";
}

interface PageContentManagerProps {
  route?: string;
  overrideMetadata?: Partial<PageMetadata>;
  onContentFetched?: (content: PageMetadata) => void;
  children?: React.ReactNode | ((content: PageMetadata, loading: boolean) => React.ReactNode);
}

export default function PageContentManager({
  route,
  overrideMetadata,
  onContentFetched,
  children
}: PageContentManagerProps) {
  let locationPath = "";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const location = useLocation();
    locationPath = location.pathname;
  } catch {
    if (typeof window !== "undefined") {
      locationPath = window.location.pathname;
    }
  }

  const currentRoutePath = route || locationPath || "/";
  const routeKey = normalizeRouteKey(currentRoutePath);

  // Initial state derived from default metadata map or generic fallback
  const fallbackData: PageMetadata = DEFAULT_PAGE_METADATA[routeKey] || {
    route: currentRoutePath,
    title: "SafeCallr - Solution d'Authentification Téléphonique",
    description: "Protégez vos communications téléphoniques contre l'usurpation d'identité et les arnaques vocales.",
    keywords: ["SafeCallr", "sécurité téléphonique", "authentification vocale", "anti-arnaque"],
    ogType: "website"
  };

  const [pageMetadata, setPageMetadata] = useState<PageMetadata>({
    ...fallbackData,
    ...overrideMetadata
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchContentFromFirestore() {
      setLoading(true);

      const baseFallback = DEFAULT_PAGE_METADATA[routeKey] || {
        route: currentRoutePath,
        title: "SafeCallr - Solution d'Authentification Téléphonique",
        description: "Protégez vos communications téléphoniques contre l'usurpation d'identité et les arnaques vocales.",
        keywords: ["SafeCallr", "sécurité téléphonique", "authentification vocale", "anti-arnaque"],
        ogType: "website"
      };

      try {
        let fetchedData: Partial<PageMetadata> | null = null;

        // 1. Try direct doc fetch by routeKey in 'pages_metadata'
        try {
          const docRef = doc(db, "pages_metadata", routeKey);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            fetchedData = docSnap.data() as Partial<PageMetadata>;
          }
        } catch (err) {
          console.log(`[PageContentManager] Direct lookup for '${routeKey}' in pages_metadata:`, err);
        }

        // 2. If not found, try query by route field
        if (!fetchedData) {
          try {
            const pagesRef = collection(db, "pages_metadata");
            const q = query(pagesRef, where("route", "==", currentRoutePath));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
              fetchedData = querySnap.docs[0].data() as Partial<PageMetadata>;
            }
          } catch (err) {
            console.log(`[PageContentManager] Query lookup for route '${currentRoutePath}':`, err);
          }
        }

        if (isMounted) {
          const mergedMetadata: PageMetadata = {
            ...baseFallback,
            ...(fetchedData || {}),
            ...(overrideMetadata || {})
          };

          setPageMetadata(mergedMetadata);
          if (onContentFetched) {
            onContentFetched(mergedMetadata);
          }
        }
      } catch (error) {
        console.warn("[PageContentManager] Error fetching page content from Firestore:", error);
        if (isMounted) {
          const mergedMetadata: PageMetadata = {
            ...baseFallback,
            ...(overrideMetadata || {})
          };
          setPageMetadata(mergedMetadata);
          if (onContentFetched) {
            onContentFetched(mergedMetadata);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchContentFromFirestore();

    return () => {
      isMounted = false;
    };
  }, [routeKey, currentRoutePath, JSON.stringify(overrideMetadata)]);

  return (
    <>
      <SEOManager
        title={pageMetadata.title}
        description={pageMetadata.description}
        keywords={pageMetadata.keywords}
        canonical={pageMetadata.canonicalUrl}
        ogType={pageMetadata.ogType || "website"}
        ogImage={pageMetadata.ogImage || "https://safecallr.com/og-image.png"}
        jsonLd={pageMetadata.jsonLd}
      />
      {typeof children === "function" ? children(pageMetadata, loading) : children}
    </>
  );
}

/**
 * Custom React Hook to fetch page-specific content from Firestore
 */
export function usePageContent(routeKeyOrPath?: string) {
  let locationPath = "";
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const location = useLocation();
    locationPath = location.pathname;
  } catch {
    if (typeof window !== "undefined") {
      locationPath = window.location.pathname;
    }
  }

  const targetPath = routeKeyOrPath || locationPath || "/";
  const routeKey = normalizeRouteKey(targetPath);

  const fallbackData: PageMetadata = DEFAULT_PAGE_METADATA[routeKey] || {
    route: targetPath,
    title: "SafeCallr - Solution d'Authentification Téléphonique",
    description: "Protégez vos communications téléphoniques contre l'usurpation d'identité et les arnaques vocales.",
    keywords: ["SafeCallr", "sécurité téléphonique", "authentification vocale", "anti-arnaque"],
    ogType: "website"
  };

  const [content, setContent] = useState<PageMetadata>(fallbackData);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      const baseFallback = DEFAULT_PAGE_METADATA[routeKey] || {
        route: targetPath,
        title: "SafeCallr - Solution d'Authentification Téléphonique",
        description: "Protégez vos communications téléphoniques contre l'usurpation d'identité et les arnaques vocales.",
        keywords: ["SafeCallr", "sécurité téléphonique", "authentification vocale", "anti-arnaque"],
        ogType: "website"
      };

      try {
        const docRef = doc(db, "pages_metadata", routeKey);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && isMounted) {
          setContent({
            ...baseFallback,
            ...(docSnap.data() as Partial<PageMetadata>)
          });
        } else if (isMounted) {
          setContent(baseFallback);
        }
      } catch (e) {
        if (isMounted) setContent(baseFallback);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [routeKey, targetPath]);

  return { content, loading };
}
