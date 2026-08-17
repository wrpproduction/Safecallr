/**
 * Safe JSON stringify helper that handles circular references, DOM elements,
 * and functions without throwing "Converting circular structure to JSON" errors.
 */
export function safeJsonStringify(obj: any, space?: number | string): string {
  const seen = new WeakSet();

  try {
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          // If it's a DOM node or circular reference
          if (typeof window !== "undefined" && value instanceof Element) {
            return `[DOM Element: ${value.tagName}]`;
          }
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        if (typeof value === "function") {
          return undefined; // skip functions like standard JSON.stringify
        }
        return value;
      },
      space
    );
  } catch (err) {
    try {
      return String(obj);
    } catch {
      return "";
    }
  }
}
