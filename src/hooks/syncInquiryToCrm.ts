import type { CollectionAfterChangeHook } from 'payload'

/**
 * Push new inquiries to a CRM via a generic webhook (works with HubSpot,
 * Pipedrive, Zapier, Make, n8n — anything that accepts JSON POST).
 *
 * Fail-safe by design: a CRM outage logs an error but NEVER loses the lead —
 * the inquiry is already saved in Payload before this hook runs, and ops can
 * re-sync from the admin panel if needed (the `status` field tracks it).
 */
export const syncInquiryToCrm: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc

  const webhookUrl = process.env.CRM_WEBHOOK_URL
  if (!webhookUrl) return doc

  try {
    let tripTitle: string | null = null
    if (doc.trip) {
      const trip = await req.payload.findByID({
        collection: 'trips',
        id: typeof doc.trip === 'object' ? doc.trip.id : doc.trip,
        depth: 0,
      })
      tripTitle = trip?.title ?? null
    }

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.CRM_WEBHOOK_SECRET
          ? { Authorization: `Bearer ${process.env.CRM_WEBHOOK_SECRET}` }
          : {}),
      },
      body: JSON.stringify({
        event: 'inquiry.created',
        inquiryId: doc.id,
        name: doc.name,
        email: doc.email,
        phone: doc.phone ?? null,
        country: doc.country ?? null,
        tripTitle,
        preferredDate: doc.preferredDate ?? null,
        adults: doc.adults ?? null,
        children: doc.children ?? null,
        message: doc.message,
        source: doc.source ?? null,
        createdAt: doc.createdAt,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) throw new Error(`CRM webhook responded with ${res.status}`)
    req.payload.logger.info(`Inquiry ${doc.id} synced to CRM`)
  } catch (err) {
    req.payload.logger.error({ err, msg: `CRM sync failed for inquiry ${doc.id} — lead is safe in Payload` })
  }
  return doc
}
