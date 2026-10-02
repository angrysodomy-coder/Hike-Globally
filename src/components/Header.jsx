import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { navigation } from '../data/content'
import Logo from './Logo'
import { Link, useRouter } from '../lib/router'

export default function Header({ onBook, navItems }) {
  const { path } = useRouter()
  /* Nav comes from the Payload `header` global when an editor has filled it
     in, and falls back to the hand-authored list in src/data/content.js. */
  const items = navItems && navItems.length > 0 ? navItems : navigation
  const isBlogPage = path.startsWith('/blog/')
  /* Starts `false` so the server-rendered markup matches the first client
     paint; the effect below syncs it on mount (and for restored scroll). */
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const toggleRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-is-open', menuOpen)
    if (!menuOpen) return undefined

    const previousFocus = document.activeElement
    const focusFrame = requestAnimationFrame(() => {
      menuRef.current?.querySelector('nav a')?.focus()
    })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        return
      }

      if (event.key !== 'Tab') return
      const panelItems = menuRef.current
        ? [...menuRef.current.querySelectorAll('a[href], button:not([disabled])')]
        : []
      const focusable = [toggleRef.current, ...panelItems].filter(Boolean)
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(focusFrame)
      document.body.classList.remove('menu-is-open')
      window.removeEventListener('keydown', onKeyDown)
      previousFocus?.focus?.()
    }
  }, [menuOpen])

  const handleBook = () => {
    setMenuOpen(false)
    onBook()
  }

  return (
    <>
      <header className={`site-header ${scrolled || menuOpen || isBlogPage ? 'site-header--solid' : ''} ${menuOpen ? 'site-header--menu-open' : ''}`}>
        <Link className="site-header__logo" href="/" aria-label="Hike Globally home" onClick={() => setMenuOpen(false)}>
          <Logo light={!scrolled && !menuOpen && !isBlogPage} />
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={item.href === path ? 'is-active' : ''}
              aria-current={item.href === path ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="site-header__actions">
          <button className="header-book" type="button" onClick={handleBook}>
            <span>Book a trip</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
          <button
            ref={toggleRef}
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </header>

      <div ref={menuRef} id="mobile-navigation" className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu__visual" aria-hidden="true">
          <img src="/images/hero-himalaya-mobile.webp" alt="" />
          <p>Born in Nepal<br />Made for the world.</p>
        </div>
        <div className="mobile-menu__content">
          <span className="mobile-menu__eyebrow">Explore Hike Globally</span>
          <nav aria-label="Mobile navigation">
            {items.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
                style={{ '--menu-index': index }}
              >
                <span>0{index + 1}</span>
                {item.label}
                <ArrowUpRight size={21} aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="mobile-menu__foot">
            <button type="button" onClick={handleBook} tabIndex={menuOpen ? 0 : -1}>Begin your journey</button>
            <div>
              <a href="mailto:hello@hikeglobally.com" tabIndex={menuOpen ? 0 : -1}>hello@hikeglobally.com</a>
              <span>Kathmandu · Nepal</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
