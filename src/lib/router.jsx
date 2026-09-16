/* eslint-disable react-refresh/only-export-components -- a router module
   legitimately exports components (RouterProvider, Link) alongside hooks and
   helpers; fast-refresh remounts are acceptable for this app shell. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

/* A deliberately tiny History-API router.
 *
 * The site is an SPA served from one document, so deep links like
 * `/destinations` rely on the host rewriting unknown paths to `index.html`
 * (Vite's dev/preview servers do this out of the box). The router keeps the
 * rest of the app anchor-based (`#trips`, `#journal`) exactly as before, while
 * giving full pages their own clean URLs. */

const RouterContext = createContext(null)

export const ROUTES = ['/', '/destinations']

export function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/'
  const trimmed = pathname.replace(/\/+$/, '') || '/'
  return ROUTES.includes(trimmed) ? trimmed : '/'
}

export function parseHref(href) {
  const url = new URL(href, window.location.origin)
  return {
    internal: url.origin === window.location.origin,
    path: normalizePath(url.pathname),
    rawPath: url.pathname,
    hash: url.hash,
    href: url.href,
  }
}

export function RouterProvider({ children }) {
  const [path, setPath] = useState(() => normalizePath(window.location.pathname))
  const pendingHash = useRef('')

  const applyHash = useCallback((hash, smooth = false) => {
    if (!hash) return false
    const id = hash.replace(/^#/, '')
    const target = document.getElementById(id)
    if (!target) return false
    target.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
    return true
  }, [])

  const navigate = useCallback((to, { replace = false, smooth = false } = {}) => {
    const { internal, path: nextPath, rawPath, hash, href } = parseHref(typeof to === 'string' ? to : '#')
    if (!internal) {
      window.location.href = href
      return
    }

    const sameDocumentPath = nextPath === normalizePath(window.location.pathname)

    if (sameDocumentPath && hash) {
      applyHash(hash, smooth)
      return
    }

    if (sameDocumentPath && !hash) {
      window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
      return
    }

    pendingHash.current = hash
    const targetUrl = hash ? `${rawPath}${hash}` : rawPath === '/' ? '/' : rawPath
    if (replace) window.history.replaceState({ path: nextPath }, '', targetUrl)
    else window.history.pushState({ path: nextPath }, '', targetUrl)
    setPath(nextPath)
  }, [applyHash])

  /* Scroll to the top (or the pending anchor) only after the new page has
     actually painted, so anchor offsets are correct. */
  useLayoutEffect(() => {
    const hash = pendingHash.current
    pendingHash.current = ''
    if (hash && applyHash(hash)) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [path, applyHash])

  useEffect(() => {
    const onPopState = () => {
      const nextPath = normalizePath(window.location.pathname)
      pendingHash.current = window.location.hash
      setPath(nextPath)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const value = useMemo(() => ({ path, navigate }), [path, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useRouter() {
  const ctx = useContext(RouterContext)
  if (!ctx) throw new Error('useRouter must be used inside <RouterProvider>')
  return ctx
}

export function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    !event.defaultPrevented
  )
}

/* Anchor that performs client-side navigation for internal hrefs and falls
   back to a real navigation (new tab, cmd-click, external host) otherwise. */
export function Link({ href, children, onClick, ...rest }) {
  const { navigate } = useRouter()

  const handleClick = (event) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    if (!isPlainLeftClick(event)) return

    const { internal, path: nextPath, hash } = parseHref(href)
    if (!internal) return
    event.preventDefault()
    navigate(`${nextPath === '/' && hash ? `/${hash}` : href}`)
  }

  return (
    <a href={href} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}

/* Sets document.title / meta description per page. */
export function usePageMeta({ title, description }) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      let meta = document.querySelector('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'description')
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', description)
    }
  }, [title, description])
}
