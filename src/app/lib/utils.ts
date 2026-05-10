import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale   = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style:                 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric',
    ...options,
  }).format(new Date(date));
}

/**
 * Formats a date + time using the user's local timezone automatically.
 * Falls back to UTC if the browser doesn't expose a timezone.
 */
export function formatDateTime(date: string | Date): string {
  const tz = typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC';

  return new Intl.DateTimeFormat('en-US', {
    year:     'numeric',
    month:    'short',
    day:      'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    timeZone: tz,
  }).format(new Date(date));
}

export function maskAccountNumber(accountNumber: string): string {
  return `****${accountNumber.slice(-4)}`;
}

export function maskCardNumber(cardNumber: string): string {
  return cardNumber
    .replace(/\s/g, '')
    .replace(/(\d{4})/g, '$1 ')
    .trim()
    .split(' ')
    .map((g, i) => (i < 3 ? '****' : g))
    .join(' ');
}

export function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function getTransactionColor(direction: 'credit' | 'debit'): string {
  return direction === 'credit' ? 'text-emerald-400' : 'text-red-400';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    completed:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    active:       'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    approved:     'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    disbursed:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    pending:      'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    processing:   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    under_review: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    failed:       'bg-red-500/10 text-red-400 border border-red-500/20',
    rejected:     'bg-red-500/10 text-red-400 border border-red-500/20',
    cancelled:    'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
    frozen:       'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    suspended:    'bg-red-500/10 text-red-400 border border-red-500/20',
    not_started:  'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
    defaulted:    'bg-red-500/10 text-red-400 border border-red-500/20',
    reversed:     'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  };
  return map[status] ?? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns the Intl currency symbol for a given currency code.
 * e.g. getCurrencySymbol('EUR') → '€'
 */
export function getCurrencySymbol(currency: string): string {
  try {
    return (0).toLocaleString('en', {
      style:                 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d/g, '').trim();
  } catch {
    return currency;
  }
}

/**
 * Returns the locale best suited to a given currency code.
 */
export function getLocaleForCurrency(currency: string): string {
  const map: Record<string, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    CAD: 'en-CA',
    AUD: 'en-AU',
    NGN: 'en-NG',
    GHS: 'en-GH',
    KES: 'sw-KE',
    ZAR: 'en-ZA',
    INR: 'en-IN',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    BRL: 'pt-BR',
    MXN: 'es-MX',
    AED: 'ar-AE',
    SAR: 'ar-SA',
    CHF: 'de-CH',
    SEK: 'sv-SE',
    NOK: 'nb-NO',
    DKK: 'da-DK',
    SGD: 'en-SG',
    HKD: 'zh-HK',
  };
  return map[currency] ?? 'en-US';
}