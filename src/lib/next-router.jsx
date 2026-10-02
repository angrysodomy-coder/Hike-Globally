'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { usePathname, useRouter as useNextRouter } from 'next/navigation'
import { RouterContext, parseHref } from './router'

/* ---------------------------------------------------------------------------
   NextRouterProvider
   ---------------------------------------------------------------------------
   The site used to be a Vite SPA driven by a tiny History-API router
   (`src/lib/router.jsx`). It now runs on the Next.js App Router, but every
   section component still talks to `useRouter()` / `<Link>` from that module.

   Rather than rewrite ~30 components, this provider fills the *same* context
   with Next's pathname + navigation, so:

     - `path`     → usePathname()
     - `navigate` → router.push / router.replace, with the hash-scroll and
                    scroll-to-top behaviour the old router guaranteed.

   The original History-API `RouterProvider` stays in place for the jsdom smoke
   tests in `scripts/`, which mount sections outside of Next.
--------------------------------------------------------------------------- */

export function NextRouterProvider({ children }) {
  const pathname = usePathname()
  const nextRouter = useNextRouter()
  const pendingHash = useRef('')

  const applyHash = useCallback((hash, smooth = false) => {
    if (!hash) return false
    const id = hash.replace(/^#/, '')
    const target = document.getElementById(id)
    if (!target) return false
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
    return true
  }, [])

  const navigate = useCallback(
    (to, { replace = false, smooth = false } = {}) => {
      const { internal, rawPath, hash, href } = parseHref(typeof to === 'string' ? to : '#')

      if (!internal) {
        window.location.href = href
        return
      }

      const samePath = (rawPath.replace(/\/+$/, '') || '/') === (pathname.replace(/\/+$/, '') || '/')

      // Anchor on the page we are already on — never re-render, just scroll.
      if (samePath && hash) {
        applyHash(hash, smooth)
        return
      }

      if (samePath && !hash) {
        window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
        return
      }

      pendingHash.current = hash
      const target = hash ? `${rawPath}${hash}` : rawPath
      if (replace) nextRouter.replace(target)
      else nextRouter.push(target)
    },
    [applyHash, nextRouter, pathname],
  )

  /* Resolve a hash that arrived with a cross-page navigation once the new
     route has painted (Next restores scroll itself for the plain case). */
  useEffect(() => {
    const hash = pendingHash.current
    if (!hash) return
    pendingHash.current = ''
    const raf = requestAnimationFrame(() => applyHash(hash))
    return () => cancelAnimationFrame(raf)
  }, [pathname, applyHash])

  const value = useMemo(() => ({ path: pathname || '/', navigate }), [pathname, navigate])

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export default NextRouterProvider
