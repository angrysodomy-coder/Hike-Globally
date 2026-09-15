import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, Check, Clock3, Mail, MapPin, Mountain, Users, X } from 'lucide-react'

export default function BookingDrawer({ trip, onClose }) {
  const panelRef = useRef(null)
  const [submitted, setSubmitted] = useState(false)
  const [travellers, setTravellers] = useState('2')
  const selected = trip || {
    title: 'A journey made for you',
    location: 'The Himalayas',
    duration: 'Your pace',
    difficulty: 'Made to fit',
    price: null,
    image: '/images/hero-himalaya.webp',
    alt: 'Trekkers walking toward Himalayan peaks',
  }

  useEffect(() => {
    const previousFocus = document.activeElement
    document.body.classList.add('drawer-is-open')
    const panel = panelRef.current
    panel?.querySelector('button, input, select, textarea')?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !panel) return
      const focusable = [...panel.querySelectorAll('button:not([disabled]), a[href], input, select, textarea')]
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

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.classList.remove('drawer-is-open')
      window.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [onClose])

  const submit = (event) => {
    event.preventDefault()
    if (event.currentTarget.checkValidity()) setSubmitted(true)
  }

  return (
    <div className="drawer-layer" role="presentation">
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close trip enquiry" />
      <aside className="booking-drawer" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button className="booking-drawer__close" type="button" onClick={onClose} aria-label="Close trip enquiry">
          <X size={21} />
        </button>

        {submitted ? (
          <div className="booking-success">
            <span className="booking-success__icon"><Check size={26} /></span>
            <p className="eyebrow">Enquiry received</p>
            <h2 id="booking-title">Your next story<br /><em>starts here.</em></h2>
            <p>Thank you. One of our Kathmandu-based trip designers will be in touch within one working day to shape the details with you.</p>
            <div className="booking-success__summary">
              <img src={selected.image} alt="" />
              <span><small>Your journey</small><strong>{selected.title}</strong></span>
            </div>
            <button type="button" className="button button--dark" onClick={onClose}>Continue exploring <ArrowRight size={17} /></button>
          </div>
        ) : (
          <>
            <div className="booking-drawer__hero">
              <img src={selected.image} alt={selected.alt || ''} />
              <div className="booking-drawer__hero-shade" />
              <p>Plan your journey</p>
            </div>
            <div className="booking-drawer__content">
              <p className="eyebrow">A conversation, not a commitment</p>
              <h2 id="booking-title">{selected.title}</h2>
              <div className="booking-drawer__trip-meta">
                <span><MapPin size={14} /> {selected.location || selected.region}</span>
                <span><Clock3 size={14} /> {selected.duration}</span>
                <span><Mountain size={14} /> {selected.difficulty}</span>
              </div>
              <p className="booking-drawer__intro">
                {selected.price ? `From $${selected.price.toLocaleString()} per person. ` : ''}
                Tell us a little about your plans and we’ll help with dates, flights and every detail in between.
              </p>

              <form className="booking-form" onSubmit={submit}>
                <div className="booking-form__row">
                  <label>
                    <span>Your name *</span>
                    <input type="text" name="name" placeholder="Full name" autoComplete="name" required />
                  </label>
                  <label>
                    <span>Email address *</span>
                    <input type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
                  </label>
                </div>
                <div className="booking-form__row">
                  <label>
                    <span><CalendarDays size={13} /> Preferred month</span>
                    <select name="month" defaultValue="">
                      <option value="">I’m flexible</option>
                      <option>October 2026</option>
                      <option>November 2026</option>
                      <option>March 2027</option>
                      <option>April 2027</option>
                      <option>May 2027</option>
                    </select>
                  </label>
                  <label>
                    <span><Users size={13} /> Travellers</span>
                    <select value={travellers} onChange={(event) => setTravellers(event.target.value)}>
                      <option value="1">1 traveller</option>
                      <option value="2">2 travellers</option>
                      <option value="3">3 travellers</option>
                      <option value="4">4 travellers</option>
                      <option value="5+">5+ travellers</option>
                    </select>
                  </label>
                </div>
                <label>
                  <span>What would make this journey yours?</span>
                  <textarea name="message" rows="4" placeholder="Tell us about your pace, interests, or any questions…" />
                </label>
                <label className="booking-form__consent">
                  <input type="checkbox" required />
                  <span>I’m happy for Hike Globally to contact me about this enquiry.</span>
                </label>
                <button type="submit" className="booking-form__submit">
                  Send my enquiry <ArrowRight size={18} />
                </button>
                <p className="booking-form__privacy"><Mail size={13} /> Your details stay private. No pressure, no mailing lists.</p>
              </form>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
