'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

/**
 * Rendered only while draftMode is enabled. Listens for Payload admin autosave
 * events (postMessage from the live-preview iframe parent) and refreshes the
 * route so editors see changes in real time.
 */
export const LivePreviewListener: React.FC = () => {
  const router = useRouter()
  return (
    <RefreshRouteOnSave
      refresh={router.refresh}
      serverURL={process.env.NEXT_PUBLIC_SERVER_URL ?? ''}
    />
  )
}
