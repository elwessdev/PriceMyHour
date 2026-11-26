export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'TND' | 'CUSTOM';

export interface CurrencyOption {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** Whether the symbol goes after the number (e.g. "120.00 DT"). */
  suffix: boolean;
}

export const CURRENCIES: readonly CurrencyOption[] = [
  { code: 'USD', label: 'USD', symbol: '$', suffix: false },
  { code: 'EUR', label: 'EUR', symbol: '€', suffix: false },
  { code: 'GBP', label: 'GBP', symbol: '£', suffix: false },
  { code: 'TND', label: 'TND', symbol: 'DT', suffix: true },
  { code: 'CUSTOM', label: 'Custom', symbol: '', suffix: false },
];

export interface CurrencySetting {
  code: CurrencyCode;
  customSymbol: string;
}

export function currencyFor(setting: CurrencySetting): { symbol: string; suffix: boolean } {
  const option = CURRENCIES.find((c) => c.code === setting.code) ?? CURRENCIES[0]!;
  if (option.code === 'CUSTOM') {
    const symbol = setting.customSymbol.trim().slice(0, 4);
    return { symbol: symbol || '¤', suffix: false };
  }
  return { symbol: option.symbol, suffix: option.suffix };
}

/** Formats a number with thousands separators and a fixed number of decimals. */
export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  const fixed = Math.abs(value).toFixed(decimals);
  const [whole = '0', frac] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = value < 0 && Number(fixed) !== 0 ? '-' : '';
  return sign + (frac ? `${grouped}.${frac}` : grouped);
}

/** Formats money with the selected currency symbol and 2 decimals. Never returns NaN/Infinity. */
export function formatMoney(value: number, currency: CurrencySetting, decimals = 2): string {
  if (!Number.isFinite(value)) return '—';
  const { symbol, suffix } = currencyFor(currency);
  const n = formatNumber(value, decimals);
  if (suffix) return `${n} ${symbol}`;
  // Multi-character custom symbols read better with a space ("CHF 10.00").
  const sep = symbol.length > 1 ? ' ' : '';
  return n.startsWith('-') ? `-${symbol}${sep}${n.slice(1)}` : `${symbol}${sep}${n}`;
}

/**
 * Parses user-typed numeric text. Accepts "1,5" as a decimal comma and
 * strips spaces. Returns NaN for empty or invalid input.
 */
export function parseNumber(text: string): number {
  const cleaned = text.replace(/\s/g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '.' || cleaned === '-') return NaN;
  if (!/^-?\d*\.?\d*$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

/** Keeps only characters valid in a decimal number while the user types. */
export function sanitizeNumericInput(text: string): string {
  let out = text.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const firstDot = out.indexOf('.');
  if (firstDot !== -1) {
    out = out.slice(0, firstDot + 1) + out.slice(firstDot + 1).replace(/\./g, '');
  }
  return out.slice(0, 12);
}

export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
