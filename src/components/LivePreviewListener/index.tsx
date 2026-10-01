'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

/**
 * Refreshes the server-rendered route when an editor saves inside the admin
 * live-preview iframe.
 *
 * `router.refresh()` re-runs the Server Components and patches the result in
 * WITHOUT a full reload — scroll position and accordion state survive, which
 * is what makes live preview usable on a page this long.
 *
 * Mounted only when draft mode is on, so it never ships to public visitors.
 */
export function LivePreviewListener() {
  const router = useRouter()

  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL="" />
}
