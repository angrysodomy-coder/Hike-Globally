const CURRENCY_SYMBOL: Record<string, string> = { AUD: 'A$', EUR: '€', GBP: '£', USD: '$' }

export const money = (amount: number, currency = 'USD'): string =>
  `${CURRENCY_SYMBOL[currency] ?? ''}${Math.round(amount).toLocaleString('en-GB')}`

/** "12 Mar 2026" — unambiguous for an international audience, unlike 03/12. */
export const longDate = (iso: null | string | undefined): string => {
  if (!iso) return 'Dates on request'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export const shortDate = (iso: null | string | undefined): string => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export const metres = (m: null | number | undefined): string =>
  typeof m === 'number' ? `${m.toLocaleString('en-GB')} m` : '—'

export const titleCase = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1)

export const nights = (days: number): string => `${days} days / ${Math.max(days - 1, 0)} nights`
