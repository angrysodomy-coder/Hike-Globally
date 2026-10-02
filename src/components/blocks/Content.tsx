import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Page } from '@/payload-types'

type Props = Extract<Page['layout'][number], { blockType: 'content' }>

export const Content: React.FC<Props> = ({ content, width }) => (
  <section className="mx-auto px-6 py-12">
    <div
      className={
        width === 'full'
          ? 'cms-prose mx-auto max-w-6xl'
          : 'cms-prose mx-auto max-w-3xl'
      }
    >
      <RichText data={content} />
    </div>
  </section>
)
