import { ArrowUpRight, Headphones, ShieldCheck, Star, UsersRound } from 'lucide-react'
import { reviews } from '../data/content'
import Reveal from './Reveal'

function Stars({ small = false }) {
  return (
    <span className={`stars ${small ? 'stars--small' : ''}`} aria-label="5 out of 5 stars">
      {[0, 1, 2, 3, 4].map((star) => <Star key={star} size={small ? 13 : 17} fill="currentColor" strokeWidth={1.5} aria-hidden="true" />)}
    </span>
  )
}

export default function ReviewsSection() {
  return (
    <section id="reviews" className="reviews-section section-pad" aria-labelledby="reviews-title">
      <div className="shell">
        <Reveal className="reviews-summary">
          <div>
            <p className="eyebrow"><span>04</span> Traveller stories</p>
            <h2 id="reviews-title">Trusted on the trail.<br /><em>Remembered long after.</em></h2>
          </div>
          <div className="google-score">
            <div className="google-word" aria-label="Google Reviews">
              <span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span>
              <b> Reviews</b>
            </div>
            <Stars />
            <strong>4.9 <small>/ 5</small></strong>
            <p>Based on <b>286 verified reviews</b></p>
          </div>
        </Reveal>

        <div className="review-grid">
          {reviews.map((review, index) => (
            <Reveal as="figure" className="review" key={review.name} delay={index * 90}>
              <div className="review__top">
                <div className="review__person">
                  <span>{review.initials}</span>
                  <p><strong>{review.name}</strong><small>{review.location}</small></p>
                </div>
                <Stars small />
              </div>
              <blockquote>“{review.quote}”</blockquote>
              <figcaption>{review.trip}</figcaption>
            </Reveal>
          ))}
        </div>

        <Reveal className="reviews-foot">
          <a href="https://www.google.com/search?q=Hike+Globally+Nepal+reviews" target="_blank" rel="noreferrer">
            Read all Google Reviews <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <div className="trust-points" aria-label="Our service commitments">
            <span><UsersRound size={17} aria-hidden="true" /> 12 guests maximum</span>
            <span><ShieldCheck size={17} aria-hidden="true" /> Licensed local experts</span>
            <span><Headphones size={17} aria-hidden="true" /> 24/7 in-country support</span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
