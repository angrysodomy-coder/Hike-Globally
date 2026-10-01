import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { type NextRequest, NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

/**
 * Draft-mode gateway for the admin "Preview" button and the live-preview iframe.
 *
 * Draft mode sets a cookie that makes every subsequent request render
 * unpublished content, so this endpoint is a genuine authorisation boundary,
 * not a convenience. It enforces three checks in order:
 *
 *   1. `previewSecret` matches the server-side env var. Stops a stranger who
 *      guesses the URL.
 *   2. `path` is root-relative. Without this, `?path=https://evil.com` turns
 *      the endpoint into an open redirect that leaks the draft cookie.
 *   3. There is a real, logged-in Payload user on the incoming cookies.
 *      The secret alone is shared and leaks easily — this is what actually
 *      keeps embargoed pricing off the public internet.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  const previewSecret = searchParams.get('previewSecret')

  if (!process.env.PREVIEW_SECRET || previewSecret !== process.env.PREVIEW_SECRET) {
    return new NextResponse('Invalid preview secret', { status: 403 })
  }

  // Reject protocol-relative (`//evil.com`) and absolute URLs alike.
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return new NextResponse('Invalid preview path', { status: 400 })
  }

  const payload = await getPayloadClient()

  let user
  try {
    user = (await payload.auth({ headers: req.headers })).user
  } catch {
    return new NextResponse('Could not verify session', { status: 403 })
  }

  if (!user) {
    return new NextResponse('You must be logged in to preview drafts', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(path)
}
