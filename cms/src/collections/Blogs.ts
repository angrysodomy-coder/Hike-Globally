import type { CollectionConfig } from 'payload'
import { isAdmin, publishedOrAdmin } from '../access'
import { slugField } from '../fields/slug'

export const Blogs: CollectionConfig = {
  slug: 'blogs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'category', 'publishedDate', '_status', 'updatedAt'],
    description: 'Field notes, guides, and stories from the trail.',
  },
  access: {
    read: publishedOrAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              label: 'Article Title',
              type: 'text',
              required: true,
            },
            slugField('title'),
            {
              name: 'excerpt',
              label: 'Excerpt / Standfirst',
              type: 'textarea',
              required: true,
              admin: {
                description: 'Brief overview displayed on cards and drawer intros.',
              },
            },
            {
              name: 'content',
              label: 'Article Body (Rich Text)',
              type: 'richText',
              admin: {
                description: 'Full rich-text content managed via the Lexical editor.',
              },
            },
            {
              name: 'rawMarkdown',
              label: 'Raw Markdown (Optional)',
              type: 'textarea',
              admin: {
                description: 'For guides with complex tables or verbatim verification.',
              },
            },
          ],
        },
        {
          label: 'Featured Image',
          fields: [
            {
              name: 'featuredImage',
              label: 'Hero / Featured Image',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'imageUrl',
              label: 'Static Image URL Fallback',
              type: 'text',
              admin: {
                description: 'Fallback path (e.g. "/images/journal-kathmandu.webp")',
              },
            },
            {
              name: 'alt',
              label: 'Image Alt Text',
              type: 'text',
            },
          ],
        },
        {
          label: 'Taxonomy & Byline',
          fields: [
            {
              name: 'author',
              label: 'Author Name',
              type: 'text',
              defaultValue: 'Nima Sherpa',
            },
            {
              name: 'category',
              label: 'Category',
              type: 'relationship',
              relationTo: 'categories',
            },
            {
              name: 'categoryName',
              label: 'Category Name (Fallback / Display)',
              type: 'text',
              admin: {
                description: 'Display label for category chip (e.g. "Practical Guide", "Culture").',
              },
            },
            {
              name: 'readTime',
              label: 'Estimated Read Time',
              type: 'text',
              defaultValue: '6 min read',
            },
            {
              name: 'publishedDate',
              label: 'Publication Date',
              type: 'date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                },
              },
            },
            {
              name: 'premium',
              label: 'Premium Comprehensive Guide',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Highlights article as a featured premium deep-dive guide.',
              },
            },
            {
              name: 'tags',
              label: 'Tags',
              type: 'array',
              fields: [
                {
                  name: 'tag',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'metaTitle',
              label: 'Meta Title',
              type: 'text',
            },
            {
              name: 'metaDescription',
              label: 'Meta Description',
              type: 'textarea',
            },
            {
              name: 'ogImage',
              label: 'Open Graph Image',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'canonicalURL',
              label: 'Canonical URL',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
