import type { Block } from 'payload'

/**
 * The month-by-month "when to go" table — `seasonGuide`.
 *
 * Month is a fixed select rather than free text, so rows can be sorted into
 * calendar order and nobody can type "Sept" in one row and "September" in the
 * next.
 */
export const SeasonMatrixBlock: Block = {
  slug: 'seasonMatrix',
  interfaceName: 'SeasonMatrixBlock',
  labels: { singular: 'Season matrix', plural: 'Season matrices' },
  fields: [
    { name: 'heading', type: 'text', defaultValue: 'When to go' },
    { name: 'intro', type: 'textarea', maxLength: 400 },
    {
      name: 'rows',
      type: 'array',
      maxRows: 12,
      labels: { singular: 'Month', plural: 'Months' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'month',
              type: 'select',
              required: true,
              admin: { width: '33%' },
              options: [
                { label: 'January', value: '01' },
                { label: 'February', value: '02' },
                { label: 'March', value: '03' },
                { label: 'April', value: '04' },
                { label: 'May', value: '05' },
                { label: 'June', value: '06' },
                { label: 'July', value: '07' },
                { label: 'August', value: '08' },
                { label: 'September', value: '09' },
                { label: 'October', value: '10' },
                { label: 'November', value: '11' },
                { label: 'December', value: '12' },
              ],
            },
            {
              name: 'rating',
              type: 'select',
              required: true,
              defaultValue: 'good',
              admin: { width: '33%' },
              options: [
                { label: 'Prime', value: 'prime' },
                { label: 'Good', value: 'good' },
                { label: 'Mixed', value: 'mixed' },
                { label: 'Not recommended', value: 'poor' },
              ],
            },
            { name: 'note', type: 'text', admin: { width: '34%' } },
          ],
        },
      ],
    },
  ],
}
