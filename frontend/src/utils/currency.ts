export const CURRENCY_SYMBOLS: Record<string, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$',
  JPY: '¥',
};

export function getCurrencySymbol(currency: string = 'PHP'): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
}

/**
 * Formats a ticket price.
 * If price is 0 or less, returns 'Free'.
 * Otherwise returns formatted currency with symbol (e.g. 'PHP ₱50' or 'USD $10').
 */
export function formatTicketPrice(
  price: number | null | undefined,
  currency: string = 'PHP',
  includeCode: boolean = false
): string {
  if (price === undefined || price === null || Number(price) <= 0) {
    return 'Free';
  }
  const symbol = getCurrencySymbol(currency);
  const numStr = Number(price).toLocaleString();
  return includeCode ? `${currency} ${symbol}${numStr}` : `${symbol}${numStr}`;
}
