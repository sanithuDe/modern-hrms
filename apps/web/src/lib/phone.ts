/** Keep digits only for phone fields (max 15 digits). */
export function sanitizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 15);
}

export function isValidPhoneDigits(value: string): boolean {
  const digits = value.trim();
  if (!digits) return true;
  return /^\d{7,15}$/.test(digits);
}
