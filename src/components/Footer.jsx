import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Facebook, Instagram, Mail, Youtube } from 'lucide-react'
import Logo from './Logo'

const exploreLinks = [
  ['Destinations', '#trips'], ['Trips', '#trips'], ['Popular treks', '#treks'], ['Journal', '#journal'],
]
const companyLinks = [
  ['About us', '#footer'], ['Contact', 'mailto:hello@hikeglobally.com'], ['FAQs', '#footer'], ['Terms', '#footer'], ['Privacy', '#footer'],
]

export default function Footer({ onBook }) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!event.currentTarget.checkValidity()) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer id="footer" className="site-footer">
      <div className="shell">
        <div className="footer-lead">
          <div className="footer-brand">
            <a href="#home" aria-label="Hike Globally home"><Logo light /></a>
            <p>Small-group journeys into the world’s wild places, thoughtfully crafted and locally led from Kathmandu.</p>
            <button type="button" onClick={onBook}>Plan a journey <ArrowUpRight size={17} /></button>
          </div>
          <div className="newsletter">
            <p className="eyebrow eyebrow--light">Letters from the trail</p>
            <h2>Get inspired for your<br /><em>next adventure.</em></h2>
            {subscribed ? (
              <div className="newsletter__success" role="status">
                <span><Mail size={19} /></span>
                <p><strong>You’re on the list.</strong> Watch your inbox for stories from the trail.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <label>
                  <span className="sr-only">Your email address</span>
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    aria-label="Your email address"
                  />
                </label>
                <button type="submit" aria-label="Subscribe to the newsletter"><ArrowRight size={20} /></button>
              </form>
            )}
            <small>Monthly field notes. No clutter. Unsubscribe anytime.</small>
          </div>
        </div>

        <div className="footer-links">
          <div>
            <h3>Explore</h3>
            {exploreLinks.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          </div>
          <div>
            <h3>Company</h3>
            {companyLinks.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          </div>
          <div className="footer-contact">
            <h3>Come say hello</h3>
            <address>
              Naxal, Kathmandu 44600<br />Nepal
            </address>
            <a href="tel:+97714521470">+977 1 452 1470</a>
            <a href="mailto:hello@hikeglobally.com">hello@hikeglobally.com</a>
          </div>
          <div className="footer-social">
            <h3>Follow the journey</h3>
            <a href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram size={17} /> Instagram <ArrowUpRight size={13} /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer"><Facebook size={17} /> Facebook <ArrowUpRight size={13} /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer"><Youtube size={17} /> YouTube <ArrowUpRight size={13} /></a>
          </div>
        </div>

        <div className="footer-wordmark" aria-hidden="true">
          <span>HIKE</span><em>Globally</em>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Hike Globally. All rights reserved.</span>
          <span>Travel slowly. Tread lightly. Stay curious.</span>
          <a href="#home">Back to top ↑</a>
        </div>
      </div>
    </footer>
  )
}
