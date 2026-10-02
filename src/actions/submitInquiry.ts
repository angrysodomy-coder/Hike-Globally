'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

export type InquiryFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
  /** Field-level errors keyed by input name. */
  errors?: Partial<Record<'name' | 'email' | 'message' | 'adults', string>>
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const str = (fd: FormData, key: string, max = 500): string =>
  String(fd.get(key) ?? '')
    .trim()
    .slice(0, max)

export async function submitInquiry(
  _prevState: InquiryFormState,
  formData: FormData,
): Promise<InquiryFormState> {
  // Honeypot: real users never fill this hidden field. Bots do.
  // Return a fake success so bots don't learn they were caught.
  if (str(formData, 'website')) {
    return { status: 'success', message: 'Thank you! We will be in touch within 24 hours.' }
  }

  const name = str(formData, 'name', 120)
  const email = str(formData, 'email', 200)
  const phone = str(formData, 'phone', 50)
  const country = str(formData, 'country', 100)
  const message = str(formData, 'message', 5000)
  const tripRaw = str(formData, 'trip', 20)
  const preferredDate = str(formData, 'preferredDate', 30)
  const adults = Number.parseInt(str(formData, 'adults', 4), 10)
  const children = Number.parseInt(str(formData, 'children', 4), 10)

  const errors: InquiryFormState['errors'] = {}
  if (name.length < 2) errors.name = 'Please enter your name.'
  if (!EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.'
  if (message.length < 10) errors.message = 'Please tell us a little more (at least 10 characters).'
  if (!Number.isFinite(adults) || adults < 1) errors.adults = 'At least 1 adult is required.'

  if (Object.keys(errors).length > 0) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors }
  }

  const tripId = /^\d+$/.test(tripRaw) ? Number.parseInt(tripRaw, 10) : null
  const headerList = await headers()
  const source = headerList.get('referer') ?? '/contact'

  try {
    const payload = await getPayload({ config })

    // Validate the trip id actually exists & is published before linking it
    let validTripId: number | null = null
    if (tripId !== null) {
      const trip = await payload.find({
        collection: 'trips',
        where: { and: [{ id: { equals: tripId } }, { _status: { equals: 'published' } }] },
        limit: 1,
        depth: 0,
        pagination: false,
      })
      validTripId = trip.docs[0]?.id ?? null
    }

    await payload.create({
      collection: 'inquiries',
      // Public `create` access is closed; the server action is the only door.
      overrideAccess: true,
      data: {
        name,
        email,
        phone: phone || null,
        country: country || null,
        trip: validTripId,
        preferredDate: preferredDate || null,
        adults,
        children: Number.isFinite(children) && children >= 0 ? children : 0,
        message,
        status: 'new',
        source,
      },
    })

    return { status: 'success', message: 'Thank you! We will be in touch within 24 hours.' }
  } catch (err) {
    console.error('Inquiry submission failed:', err)
    return {
      status: 'error',
      message: 'Something went wrong on our side. Please try again or email us directly.',
    }
  }
}
