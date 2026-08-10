import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Safely parses any date input (Firebase Timestamp, JS Date, string, number, object)
 * into a valid JavaScript Date object, or returns null if invalid.
 */
export function parseToDate(input: any): Date | null {
  if (input === null || input === undefined || input === "") return null;

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  // Firestore Timestamp object with .toDate()
  if (typeof input === "object" && typeof input.toDate === "function") {
    try {
      const d = input.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch (e) {
      // fallback
    }
  }

  // Firestore Timestamp plain object { seconds, nanoseconds } or { _seconds, _nanoseconds }
  if (typeof input === "object") {
    const sec = typeof input.seconds === "number" 
      ? input.seconds 
      : (typeof input._seconds === "number" ? input._seconds : null);
    if (sec !== null && !isNaN(sec)) {
      const d = new Date(sec * 1000);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Numeric timestamp (seconds or milliseconds)
  if (typeof input === "number" && !isNaN(input)) {
    const d = input > 1e11 ? new Date(input) : new Date(input * 1000);
    if (!isNaN(d.getTime())) return d;
  }

  // String representations
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      const d = num > 1e11 ? new Date(num) : new Date(num * 1000);
      if (!isNaN(d.getTime())) return d;
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Safely formats any date input into a string using date-fns.
 * Defaults to "dd/MM/yyyy" (JJ/MM/ANNEE e.g., 17/09/2025).
 * Guaranteed never to throw an "Invalid time value" error.
 */
export function safeFormatDate(
  input: any,
  formatPattern: string = "dd/MM/yyyy",
  fallback: string = "-"
): string {
  const date = parseToDate(input);
  if (!date) return fallback;
  try {
    return format(date, formatPattern, { locale: fr });
  } catch (err) {
    return fallback;
  }
}
