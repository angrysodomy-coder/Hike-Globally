import type { Option } from 'payload'

/**
 * Shared select vocabularies.
 *
 * The plan writes these lists inline in each place they are used — once in
 * Trips, again in Destinations, again in the TripGrid block's filter group.
 * That is three copies of a set of enum values that MUST stay identical,
 * because the block filters trips by comparing its own stored value against
 * the trip's. The moment someone adds "shoulder" to one list and not the
 * others, the filter silently returns nothing and no type error is raised.
 *
 * In Postgres these also become real enum types, so changing a value later is
 * a migration, not an edit. Define them once.
 */

/** Season values. Used by Trips, Destinations and the TripGrid filter. */
export const SEASON_VALUES = ['spring', 'summer', 'autumn', 'winter'] as const
export type Season = (typeof SEASON_VALUES)[number]

/** Month ranges included — editors should not have to remember Nepal's calendar. */
export const SEASON_OPTIONS: Option[] = [
  { label: 'Spring (Mar–May)', value: 'spring' },
  { label: 'Summer / monsoon (Jun–Aug)', value: 'summer' },
  { label: 'Autumn (Sep–Nov)', value: 'autumn' },
  { label: 'Winter (Dec–Feb)', value: 'winter' },
]

/** Same values, bare labels — for compact filter UIs where the range is noise. */
export const SEASON_OPTIONS_SHORT: Option[] = [
  { label: 'Spring', value: 'spring' },
  { label: 'Summer', value: 'summer' },
  { label: 'Autumn', value: 'autumn' },
  { label: 'Winter', value: 'winter' },
]

export const DIFFICULTY_VALUES = ['easy', 'moderate', 'challenging', 'strenuous'] as const
export type Difficulty = (typeof DIFFICULTY_VALUES)[number]

export const DIFFICULTY_OPTIONS: Option[] = [
  { label: 'Easy', value: 'easy' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Challenging', value: 'challenging' },
  { label: 'Strenuous', value: 'strenuous' },
]

export const TRIP_TYPE_OPTIONS: Option[] = [
  { label: 'Trek', value: 'trek' },
  { label: 'Cultural tour', value: 'tour' },
  { label: 'Expedition', value: 'expedition' },
  { label: 'Peak climb', value: 'peak' },
]

/**
 * Currency is stored next to every price. A bare number with the symbol baked
 * into JSX is pitfall 2 — it breaks the day you sell in euros, and it is the
 * kind of bug that ends in a refund argument.
 */
export const CURRENCY_VALUES = ['USD', 'EUR', 'GBP', 'AUD'] as const
export type Currency = (typeof CURRENCY_VALUES)[number]

export const CURRENCY_OPTIONS: Option[] = [
  { label: 'USD $', value: 'USD' },
  { label: 'EUR €', value: 'EUR' },
  { label: 'GBP £', value: 'GBP' },
  { label: 'AUD $', value: 'AUD' },
]

export const MEAL_OPTIONS: Option[] = [
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
]
