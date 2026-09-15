import { useEffect, useState } from 'react'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { navigation } from '../data/content'
import Logo from './Logo'

export default function Header({ onBook }) {
  const [scrolled, setScrolled] = useState(() => window.scrollY > 40)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-is-open', menuOpen)
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('menu-is-open')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const handleBook = () => {
    setMenuOpen(false)
    onBook()
  }

  return (
    <>
      <header className={`site-header ${scrolled || menuOpen ? 'site-header--solid' : ''} ${menuOpen ? 'site-header--menu-open' : ''}`}>
        <a className="site-header__logo" href="#home" aria-label="Hike Globally home" onClick={() => setMenuOpen(false)}>
          <Logo light={!scrolled && !menuOpen} />
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a key={item.label} href={item.href}>{item.label}</a>
          ))}
        </nav>

        <div className="site-header__actions">
          <button className="header-book" type="button" onClick={handleBook}>
            <span>Book a trip</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </button>
          <button
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

      <div id="mobile-navigation" className={`mobile-menu ${menuOpen ? 'mobile-menu--open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu__visual" aria-hidden="true">
          <img src="/images/hero-himalaya-mobile.webp" alt="" />
          <p>Born in Nepal<br />Made for the world.</p>
        </div>
        <div className="mobile-menu__content">
          <span className="mobile-menu__eyebrow">Explore Hike Globally</span>
          <nav aria-label="Mobile navigation">
            {navigation.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
                style={{ '--menu-index': index }}
              >
                <span>0{index + 1}</span>
                {item.label}
                <ArrowUpRight size={21} aria-hidden="true" />
              </a>
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
