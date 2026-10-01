import type { CollectionBeforeChangeHook } from 'payload'
import sharp from 'sharp'

/**
 * Generates a 16px base64 blur placeholder once, at upload time, and stores it
 * on the document.
 *
 * The alternative — generating it per request — means reading the full image
 * off R2 and running sharp inside a serverless function on every cold render.
 * Doing it once on upload costs ~20ms and the result is a ~400-byte string
 * that rides along with the media document for free.
 *
 * On a photography-led site this is the difference between a grey box and a
 * recognisable mountain while the hero loads: a measurable LCP and CLS win.
 *
 * `req.file` is only populated when an actual file is being uploaded, so
 * editing an image's alt text does not regenerate anything.
 */
export const generateBlurDataURL: CollectionBeforeChangeHook = async ({ data, req }) => {
  const file = req.file

  if (!file?.data || !file.mimetype?.startsWith('image/')) return data

  try {
    const buffer = await sharp(file.data)
      .resize(16, 16, { fit: 'inside' })
      .webp({ quality: 40 })
      .toBuffer()

    return { ...data, blurDataUrl: `data:image/webp;base64,${buffer.toString('base64')}` }
  } catch (error) {
    // A broken placeholder must never block an upload. Log and move on.
    req.payload.logger.warn(
      { err: error, filename: file.name },
      'Could not generate blur placeholder',
    )
    return data
  }
}
