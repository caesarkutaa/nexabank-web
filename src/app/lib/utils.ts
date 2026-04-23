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
    style:    'currency',
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

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year:     'numeric',
    month:    'short',
    day:      'numeric',
    hour:     '2-digit',
    minute:   '2-digit',
    timeZone: 'America/New_York',
  }).format(new Date(date));
}

export function maskAccountNumber(accountNumber: string): string {
  return `****${accountNumber.slice(-4)}`;
}

export function maskCardNumber(cardNumber: string): string {
  return cardNumber.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim()
    .split(' ')
    .map((g, i) => (i < 3 ? '****' : g))
    .join(' ');
}

export function getInitials(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function getTransactionColor(direction: 'credit' | 'debit'): string {
  return direction === 'credit' ? 'text-green-600' : 'text-red-500';
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    completed:   'bg-green-100 text-green-800',
    active:      'bg-green-100 text-green-800',
    approved:    'bg-green-100 text-green-800',
    pending:     'bg-yellow-100 text-yellow-800',
    processing:  'bg-blue-100 text-blue-800',
    under_review:'bg-blue-100 text-blue-800',
    failed:      'bg-red-100 text-red-800',
    rejected:    'bg-red-100 text-red-800',
    cancelled:   'bg-gray-100 text-gray-800',
    frozen:      'bg-blue-100 text-blue-800',
    suspended:   'bg-red-100 text-red-800',
    not_started: 'bg-gray-100 text-gray-800',
  };
  return map[status] ?? 'bg-gray-100 text-gray-800';
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}...` : str;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}