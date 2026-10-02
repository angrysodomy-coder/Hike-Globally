/**
 * Centralised formatting. Departure dates are rendered in the OPERATOR's
 * timezone, pinned explicitly — never the visitor's — so a "15 Mar" departure
 * never displays as 14 Mar for someone browsing from the US.
 */
const OPERATOR_TZ = 'Asia/Kathmandu'

export const formatPrice = (amount: number, currency: string): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeZone: OPERATOR_TZ,
  }).format(new Date(iso))

export const formatDateRange = (startIso: string, endIso: string): string =>
  `${formatDate(startIso)} – ${formatDate(endIso)}`

export const seatsLeft = (seatsTotal?: number | null, seatsBooked?: number | null): number | null =>
  typeof seatsTotal === 'number' ? Math.max(0, seatsTotal - (seatsBooked ?? 0)) : null
