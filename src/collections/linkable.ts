/**
 * The collections an editor may point an explicit link field at — a nav item,
 * a CTA button, a card. Deliberately excludes `media` and `users`: a CTA
 * pointing at a user document is never what anyone meant.
 *
 * Rich-text links do NOT use this list. Those are derived by Payload from each
 * collection's `admin.enableRichTextLink` flag, which defaults to true — see
 * the note in `src/fields/defaultLexical.ts`. Two mechanisms, because rich
 * text needs the set to grow automatically as collections are added, whereas a
 * link field needs a concrete `relationTo` array at config time.
 *
 * Every slug here must be registered in `payload.config.ts` before any field
 * using it is added, or Payload throws `InvalidFieldRelationship` at boot.
 */
export const LINKABLE_COLLECTIONS = ['pages', 'posts', 'trips', 'destinations'] as const

export type LinkableCollection = (typeof LINKABLE_COLLECTIONS)[number]
