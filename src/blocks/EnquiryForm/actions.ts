'use server'

import { headers } from 'next/headers'

import { getPayloadClient } from '@/lib/payload'

export type EnquiryState = {
  error?: string
  fieldErrors?: Record<string, string>
  ok?: boolean
}

/**
 * Per-IP rate limit.
 *
 * In-memory on purpose, and honest about the trade-off: this resets on deploy
 * and is per-instance, so on a multi-region serverless deployment it throttles
 * per lambda rather than globally. It stops the crude flood that arrives
 * within days of a public create endpoint going live (pitfall 14). Anything
 * stronger needs Redis or Vercel's WAF, which is a deploy-time concern.
 */
const HITS = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

const rateLimited = (ip: string): boolean => {
  const now = Date.now()
  const recent = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  HITS.set(ip, recent)

  // Opportunistic cleanup so the map cannot grow without bound.
  if (HITS.size > 5000) {
    for (const [key, times] of HITS) {
      if (times.every((t) => now - t >= WINDOW_MS)) HITS.delete(key)
    }
  }

  return recent.length > MAX_PER_WINDOW
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  // 1. Honeypot. A field hidden from humans; only a bot fills it in.
  //    Return success so the bot does not learn it was caught.
  if (formData.get('website')) return { ok: true }

  // 2. Minimum time-to-submit. A human cannot read and complete this in
  //    under three seconds; a script posts instantly.
  const startedAt = Number(formData.get('startedAt') || 0)
  if (!startedAt || Date.now() - startedAt < 3000) return { ok: true }

  const hdrs = await headers()
  const ip = (hdrs.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (rateLimited(ip)) {
    return { error: 'Too many enquiries from this connection. Please try again later.' }
  }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const consent = formData.get('consent') === 'on'

  const fieldErrors: Record<string, string> = {}
  if (!name) fieldErrors.name = 'Please tell us your name.'
  if (!EMAIL.test(email)) fieldErrors.email = 'Please enter a valid email address.'
  if (!consent) fieldErrors.consent = 'We need your consent to reply.'
  if (Object.keys(fieldErrors).length) return { fieldErrors }

  const tripId = Number(formData.get('trip')) || undefined
  const travellers = Number(formData.get('travellers')) || undefined
  const preferredDate = String(formData.get('preferredDate') ?? '') || undefined

  try {
    const payload = await getPayloadClient()

    await payload.create({
      collection: 'enquiries',
      /**
       * `overrideAccess: false` keeps this honest — it runs the collection's
       * anonymous-create rule rather than bypassing access control just
       * because we happen to be on the server.
       */
      overrideAccess: false,
      context: { disableRevalidate: true },
      data: {
        name,
        consent,
        email,
        country: String(formData.get('country') ?? '') || undefined,
        message: String(formData.get('message') ?? '') || undefined,
        phone: String(formData.get('phone') ?? '') || undefined,
        preferredDate,
        source: String(formData.get('source') ?? 'website'),
        travellers,
        ...(tripId ? { trip: tripId } : {}),
      },
    })

    return { ok: true }
  } catch {
    // Never surface the raw Payload error — it leaks field names and schema.
    return { error: 'Something went wrong sending your enquiry. Please email us directly.' }
  }
}
