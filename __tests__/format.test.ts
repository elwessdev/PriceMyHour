import { formatMoney, formatNumber, parseNumber, sanitizeNumericInput } from '../lib/format';

describe('formatMoney', () => {
  it('formats with symbol, thousands separators and 2 decimals', () => {
    expect(formatMoney(1234.5, { code: 'USD', customSymbol: '' })).toBe('$1,234.50');
    expect(formatMoney(0, { code: 'EUR', customSymbol: '' })).toBe('€0.00');
    expect(formatMoney(99.999, { code: 'GBP', customSymbol: '' })).toBe('£100.00');
  });

  it('puts the TND symbol after the amount', () => {
    expect(formatMoney(1500, { code: 'TND', customSymbol: '' })).toBe('1,500.00 DT');
  });

  it('supports custom symbols with a fallback', () => {
    expect(formatMoney(10, { code: 'CUSTOM', customSymbol: 'CHF' })).toBe('CHF 10.00');
    expect(formatMoney(10, { code: 'CUSTOM', customSymbol: '₹' })).toBe('₹10.00');
    expect(formatMoney(10, { code: 'CUSTOM', customSymbol: '  ' })).toBe('¤10.00');
  });

  it('never shows NaN or Infinity', () => {
    expect(formatMoney(NaN, { code: 'USD', customSymbol: '' })).toBe('—');
    expect(formatMoney(Infinity, { code: 'USD', customSymbol: '' })).toBe('—');
    expect(formatNumber(-Infinity)).toBe('—');
  });

  it('formats negatives', () => {
    expect(formatMoney(-12.5, { code: 'USD', customSymbol: '' })).toBe('-$12.50');
  });
});

describe('parseNumber / sanitizeNumericInput', () => {
  it('parses dots and decimal commas', () => {
    expect(parseNumber('12.5')).toBe(12.5);
    expect(parseNumber('12,5')).toBe(12.5);
    expect(parseNumber(' 2000 ')).toBe(2000);
  });

  it('returns NaN for empty or garbage input', () => {
    expect(parseNumber('')).toBeNaN();
    expect(parseNumber('.')).toBeNaN();
    expect(parseNumber('abc')).toBeNaN();
    expect(parseNumber('1.2.3')).toBeNaN();
  });

  it('strips invalid characters while typing', () => {
    expect(sanitizeNumericInput('1,5')).toBe('1.5');
    expect(sanitizeNumericInput('1.2.3')).toBe('1.23');
    expect(sanitizeNumericInput('-12a')).toBe('12');
    expect(sanitizeNumericInput('1 000')).toBe('1000');
  });
});
