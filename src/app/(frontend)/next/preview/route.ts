import { getPayload } from 'payload'
import config from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET(req: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')
  const previewSecret = searchParams.get('previewSecret')

  if (previewSecret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid preview secret', { status: 403 })
  }
  if (!path || !path.startsWith('/')) {
    return new Response('Invalid path', { status: 400 })
  }

  // Only authenticated Payload users may enter preview mode
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) {
    return new Response('You must be logged in to preview', { status: 403 })
  }

  const draft = await draftMode()
  draft.enable()
  redirect(path)
}
