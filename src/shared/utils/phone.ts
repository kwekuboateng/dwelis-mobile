/**
 * Mirror backend normalizePhoneE164 (Ghana default country code 233).
 * Synced from dwelis-frontend/app/utils/phone.ts
 */
export function normalizePhoneE164(phone: string, defaultCountryCode = '233'): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('+')) {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return null;
    return `+${digits}`;
  }

  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = defaultCountryCode + digits.slice(1);
  } else if (!digits.startsWith(defaultCountryCode)) {
    digits = defaultCountryCode + digits;
  }

  if (digits.length < 10 || digits.length > 15) return null;
  return `+${digits}`;
}

export function normalizeIdentifierForLogin(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  return normalizePhoneE164(trimmed) ?? trimmed;
}
