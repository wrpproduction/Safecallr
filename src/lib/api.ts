import { Capacitor } from "@capacitor/core";

/**
 * Utility to resolve API URLs.
 * 
 * In full-stack deployments where frontend and backend are hosted under the same domain (e.g., Cloud Run),
 * relative paths are used (defaults to current domain).
 * 
 * If running natively via Capacitor (iOS / Android), localhost is not the server,
 * so we resolve against the production backend or VITE_API_URL.
 */
export function getApiUrl(path: string): string {
  let baseUrl = ((import.meta as any).env?.VITE_API_URL as string) || "";
  
  if (!baseUrl && typeof window !== "undefined") {
    if (Capacitor.isNativePlatform() || window.location.hostname === "localhost") {
      baseUrl = "https://safecallr.com";
    }
  }

  if (!baseUrl) {
    return path;
  }

  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
