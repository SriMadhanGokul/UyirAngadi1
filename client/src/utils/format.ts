import type { Listing } from '../types';

/** ₹1,25,000 style Indian grouping. */
export function formatPrice(price: number | undefined | null): string {
  if (price === undefined || price === null || Number.isNaN(price)) return '—';
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(price)}`;
}

export function formatDate(value?: string, language = 'en'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language.startsWith('ta') ? 'ta-IN' : 'en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatYear(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : String(date.getFullYear());
}

/**
 * Builds a human readable age. Falls back gracefully when only one unit is set.
 * Returns null when the age is unknown so callers can hide the field.
 */
export function formatAge(
  age: Listing['age'] | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string
): string | null {
  if (!age) return null;
  const years = age.years ?? 0;
  const months = age.months ?? 0;
  if (years === 0 && months === 0) return null;
  if (years > 0 && months > 0) return t('listing.yearsMonths', { years, months });
  if (years > 0) return t('listing.years', { count: years });
  return t('listing.months', { count: months });
}

/** Digits only — phone numbers are stored as 10-digit strings in the API. */
export function cleanPhone(phone?: string): string {
  return (phone || '').replace(/\D/g, '');
}

export function telLink(phone?: string): string {
  return `tel:+91${cleanPhone(phone).slice(-10)}`;
}

export function whatsAppLink(phone: string | undefined, message: string): string {
  const number = cleanPhone(phone).slice(-10);
  return `https://wa.me/91${number}?text=${encodeURIComponent(message)}`;
}

/** "3 days ago" style relative time for dashboard tables. */
export function timeAgo(value?: string, language = 'en'): string {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.round((Date.now() - then) / 1000);
  const rtf = new Intl.RelativeTimeFormat(language.startsWith('ta') ? 'ta' : 'en', {
    numeric: 'auto',
  });
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    if (seconds >= secs) return rtf.format(-Math.floor(seconds / secs), unit);
  }
  return rtf.format(-seconds, 'second');
}

/** "Tirunelveli, Tamil Nadu" — village/taluk are never shown to protect privacy. */
export function formatPublicLocation(listing: Listing): string {
  return [listing.location?.district, listing.location?.village]
    .filter(Boolean)
    .join(', ');
}

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

export function formatBoolean(value: unknown, language = 'en'): string {
  if (value === true) return language.startsWith('ta') ? 'ஆம்' : 'Yes';
  if (value === false) return language.startsWith('ta') ? 'இல்லை' : 'No';
  return String(value ?? '');
}

/** Builds a URL-safe slug for SEO-friendly routes. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** True for exactly 10 digits (Indian mobile, without the +91 prefix). */
export function isValidPhone(value: string): boolean {
  return /^[6-9]\d{9}$/.test((value || '').replace(/\D/g, '').slice(-10));
}

/** True for a 6-digit OTP code. */
export function isValidOtp(value: string): boolean {
  return /^\d{6}$/.test((value || '').trim());
}

/** "98765•••••" — shows the last 2 digits so users can confirm the number. */
export function maskPhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length < 4) return phone;
  return `${digits.slice(0, 5)}•••••${digits.slice(-2)}`;
}


/** Creates preview URLs for newly selected files. */
export function makeObjectUrls(files: File[]): string[] {
  return files.map((file) => URL.createObjectURL(file));
}

/** Revokes preview URLs to avoid leaking memory on low-end devices. */
export function revokeObjectUrls(urls: string[]): void {
  urls.forEach((url) => {
    if (url.startsWith('blob:')) URL.revokeObjectURL(url);
  });
}
