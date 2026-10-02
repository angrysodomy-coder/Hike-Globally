const collectionPrefixMap = {
  pages: '',
  posts: '/blog',
  trips: '/trips',
} as const

type Args = {
  collection: keyof typeof collectionPrefixMap
  slug: string
}

export const generatePreviewPath = ({ collection, slug }: Args): string => {
  const previewPath =
    collection === 'pages' && slug === 'home'
      ? '/'
      : `${collectionPrefixMap[collection]}/${slug}`

  const params = new URLSearchParams({
    slug,
    collection,
    path: previewPath,
    previewSecret: process.env.PREVIEW_SECRET || '',
  })
  return `/next/preview?${params.toString()}`
}
