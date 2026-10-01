import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

/** Clears the draft cookie so the browser goes back to published content. */
export async function GET(): Promise<Response> {
  const draft = await draftMode()
  draft.disable()

  return NextResponse.json({ draftMode: 'disabled' })
}
