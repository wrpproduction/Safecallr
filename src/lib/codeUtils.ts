/**
 * Utility functions for generating and validating SafeCallr security codes.
 * Security codes consist of numeric digits followed by 1 random uppercase letter at the end.
 */

const UPPERCASE_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Generates a random security code with `digitsCount` numbers and 1 random uppercase letter at the end.
 * Example for 6 digits: "739104K"
 * Example for 4 digits: "4812M"
 */
export function generateSecurityCode(digitsCount: number = 6): string {
  let digits = "";
  for (let i = 0; i < digitsCount; i++) {
    digits += Math.floor(Math.random() * 10).toString();
  }
  const randomLetter = UPPERCASE_LETTERS.charAt(
    Math.floor(Math.random() * UPPERCASE_LETTERS.length)
  );
  return `${digits}${randomLetter}`;
}

/**
 * Validates whether two security codes match (case-insensitive, trimmed).
 */
export function isCodeMatch(code1: string | null | undefined, code2: string | null | undefined): boolean {
  if (!code1 || !code2) return false;
  return code1.trim().toUpperCase() === code2.trim().toUpperCase();
}
