import type { Block } from 'payload'

/** The inline booking-enquiry form — the `BookingDrawer` as a page section. */
export const EnquiryFormBlock: Block = {
  slug: 'enquiryForm',
  interfaceName: 'EnquiryFormBlock',
  labels: { singular: 'Enquiry form', plural: 'Enquiry forms' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'Plan your journey' },
    { name: 'intro', type: 'textarea', maxLength: 400 },
    {
      name: 'trip',
      type: 'relationship',
      relationTo: 'trips',
      maxDepth: 1,
      admin: { description: 'Pre-selects this trip on the form. Leave empty for a general enquiry.' },
    },
    {
      name: 'consentText',
      type: 'text',
      required: true,
      defaultValue: 'I agree to be contacted about this enquiry.',
      admin: {
        description:
          'Shown beside the required consent checkbox. Keep it specific — blanket marketing consent bundled into an enquiry is not valid consent.',
      },
    },
    {
      name: 'successMessage',
      type: 'text',
      required: true,
      defaultValue: 'Thank you — one of our guides will be in touch within one working day.',
    },
  ],
}
