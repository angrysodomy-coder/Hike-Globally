import React from 'react'

/**
 * Emits JSON-LD as a script tag.
 *
 * `dangerouslySetInnerHTML` is the only way to get raw JSON into a
 * `<script type="application/ld+json">` — React would otherwise escape it into
 * invalid JSON. The `<` replacement closes the XSS hole that opens up when CMS
 * copy contains a literal `</script>`.
 */
export function JsonLd({ data }: { data: unknown[] | Record<string, unknown> }) {
  const payload = Array.isArray(data) ? data : [data]

  return (
    <>
      {payload.filter(Boolean).map((item, index) => (
        <script
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, '\\u003c'),
          }}
          key={index}
          type="application/ld+json"
        />
      ))}
    </>
  )
}
