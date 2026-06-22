/**
 * Utility to resolve API URLs.
 * 
 * In full-stack deployments where frontend and backend are hosted under the same domain (e.g., Cloud Run),
 * relative paths are used (defaults to current domain).
 * 
 * If the frontend is hosted statically on a platform like Vercel or Firebase Hosting,
 * and the backend Express server runs on Google Cloud Run, you can define the VITE_API_URL
 * environment variable to point to your Cloud Run active endpoint (e.g., https://safecallr-app-xxx.run.app).
 */
export function getApiUrl(path: string): string {
  const baseUrl = ((import.meta as any).env?.VITE_API_URL as string) || "";
  
  if (!baseUrl) {
    return path;
  }

  const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
