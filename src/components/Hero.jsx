import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, CalendarDays, Compass, MapPin, Search } from 'lucide-react'
import Noise from './Noise'

const months = [
  'October 2026', 'November 2026', 'December 2026', 'January 2027',
  'February 2027', 'March 2027', 'April 2027', 'May 2027', 'September 2027', 'October 2027',
]

export default function Hero({ onFind }) {
  const mediaRef = useRef(null)
  const videoRef = useRef(null)
  const [finder, setFinder] = useState({ destination: '', when: '', type: '' })

  useEffect(() => {
    const media = mediaRef.current
    const video = videoRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!media || reducedMotion) return undefined

    let frame = null
    const update = () => {
      frame = null
      const y = Math.min(window.scrollY, window.innerHeight)
      // Keep subtle parallax for video as well
      media.style.setProperty('--hero-shift', `${y * 0.12}px`)
      media.style.setProperty('--hero-scale', `${1.035 + y / 18000}`)
      if (video) {
        video.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(${1.035 + y / 18000})`
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Ensure video plays (autoplay policies)
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const tryPlay = () => {
      const attempt = v.play()
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {})
    }
    tryPlay()
    // retry on visibility
    document.addEventListener('visibilitychange', tryPlay)
    return () => document.removeEventListener('visibilitychange', tryPlay)
  }, [])

  const updateFinder = (event) => {
    const { name, value } = event.target
    setFinder((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onFind(finder)
    document.querySelector('#trips')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="home" className="hero hero--video hero--left-bottom" aria-labelledby="hero-title">
      <div className="hero__media" ref={mediaRef}>
        {/* Video Background */}
        <video
          ref={videoRef}
          className="hero__video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/images/hero-himalaya.webp"
          aria-hidden="true"
          // Provide multiple sources for resilience
        >
          {/* Primary requested URL */}
          <source src="https://www.pexels.com/download/video/29633606/" type="video/mp4" media="(min-width: 621px) and (prefers-reduced-motion: no-preference)" />
          {/* Fallback CDN mirrors that commonly host pexels 29633606 - hiking aerial */}
          <source src="https://videos.pexels.com/video-files/29633606/12727782_1920_1080_30fps.mp4" type="video/mp4" media="(min-width: 621px) and (prefers-reduced-motion: no-preference)" />
          <source src="https://www.pexels.com/video/29633606/download/" type="video/mp4" media="(min-width: 621px) and (prefers-reduced-motion: no-preference)" />
        </video>
        {/* Fallback image if video fails */}
        <img
          className="hero__fallback"
          src="/images/hero-himalaya.webp"
          alt=""
          aria-hidden="true"
        />
      </div>

      {/* Gradient wash for readability */}
      <div className="hero__wash" aria-hidden="true" />

      {/* Noise Grain Effect - ReactBits style, placed behind content but above video/wash */}
      <Noise
        patternSize={160}
        patternScaleX={1.4}
        patternScaleY={0.8}
        patternRefreshInterval={2}
        patternAlpha={22}
        style={{ zIndex: 2 }}
      />

      {/* Optional secondary vignette to help left-bottom legibility */}
      <div className="hero__vignette" aria-hidden="true" />

      <div className="hero__coordinate" aria-hidden="true">
        <span>27.9881° N</span>
        <i />
        <span>86.9250° E</span>
      </div>

      {/* Content aligned left bottom, front layer */}
      <div className="hero__content shell hero__content--front">
        <p className="hero__eyebrow"><span /> EXPLORE <b>•</b> EXPERIENCE <b>•</b> DISCOVER</p>
        <h1 id="hero-title" className="hero__heading hero__heading--cal">
          <span className="hero__line"><i>The world is waiting.</i></span>
          <span className="hero__line hero__line--italic"><i>Go find your story.</i></span>
        </h1>
        <p className="hero__copy">Thoughtfully crafted journeys, unforgettable landscapes, and local stories for travellers who choose to go beyond.</p>
        <div className="hero__ctas">
          <a className="button button--light" href="#trips">
            <span>Explore trips</span><ArrowRight size={17} aria-hidden="true" />
          </a>
          <a className="button button--ghost" href="#treks">
            <span>Discover destinations</span><ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
      </div>

      <form className="journey-finder shell" onSubmit={handleSubmit} aria-label="Find a trip">
        <div className="journey-finder__intro">
          <span>Start your<br />journey</span>
        </div>
        <label className="finder-field">
          <MapPin size={18} aria-hidden="true" />
          <span>
            <small>Where do you want to go?</small>
            <select name="destination" value={finder.destination} onChange={updateFinder} aria-label="Destination">
              <option value="">Anywhere in the Himalayas</option>
              <option value="Everest">Everest region</option>
              <option value="Annapurna">Annapurna region</option>
              <option value="Manaslu">Manaslu region</option>
              <option value="Mustang">Upper Mustang</option>
              <option value="Langtang">Langtang Valley</option>
              <option value="Kathmandu">Kathmandu Valley</option>
            </select>
          </span>
        </label>
        <label className="finder-field">
          <CalendarDays size={18} aria-hidden="true" />
          <span>
            <small>When?</small>
            <select name="when" value={finder.when} onChange={updateFinder} aria-label="Travel month">
              <option value="">Choose your month</option>
              {months.map((month) => <option key={month} value={month}>{month}</option>)}
            </select>
          </span>
        </label>
        <label className="finder-field">
          <Compass size={18} aria-hidden="true" />
          <span>
            <small>What are you looking for?</small>
            <select name="type" value={finder.type} onChange={updateFinder} aria-label="Experience type">
              <option value="">Any kind of adventure</option>
              <option value="Trek">Trekking</option>
              <option value="Cultural">Culture & discovery</option>
              <option value="Adventure">Active adventure</option>
              <option value="Expedition">Expedition</option>
            </select>
          </span>
        </label>
        <button className="finder-submit" type="submit">
          <Search size={18} aria-hidden="true" />
          <span>Find your trip</span>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </form>

      <a className="hero__scroll" href="#trips" aria-label="Scroll to curated journeys">
        <span>Scroll to explore</span>
        <ArrowDown size={15} aria-hidden="true" />
      </a>
    </section>
  )
}
