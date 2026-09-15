import { useEffect, useRef } from 'react'
import { ArrowRight, Clock3, X } from 'lucide-react'

export default function StoryDrawer({ article, onClose, onPlan }) {
  const panelRef = useRef(null)

  useEffect(() => {
    const previousFocus = document.activeElement
    document.body.classList.add('drawer-is-open')
    panelRef.current?.querySelector('button')?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const panel = panelRef.current
      const focusable = panel ? [...panel.querySelectorAll('button:not([disabled]), a[href]')] : []
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

  return (
    <div className="drawer-layer story-layer" role="presentation">
      <button className="drawer-backdrop" type="button" onClick={onClose} aria-label="Close article" />
      <article className="story-drawer" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="story-title">
        <button className="story-drawer__close" type="button" onClick={onClose} aria-label="Close article"><X size={21} /></button>
        <div className="story-drawer__image">
          <img src={article.image} alt={article.alt} />
          <span>Hike Globally · Field notes</span>
        </div>
        <div className="story-drawer__body">
          <div className="story-kicker">
            <span>{article.category}</span>
            <span><Clock3 size={13} /> {article.readTime}</span>
          </div>
          <h2 id="story-title">{article.title}</h2>
          <p className="story-drawer__standfirst">{article.excerpt}</p>
          <div className="story-drawer__byline">
            <span>Words by <strong>Nima Sherpa</strong></span>
            <time>{article.date}</time>
          </div>
          <div className="story-drawer__copy">
            {article.body?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
          <aside>
            <span>Ready to see it for yourself?</span>
            <button type="button" onClick={onPlan}>Plan a journey <ArrowRight size={17} /></button>
          </aside>
        </div>
      </article>
    </div>
  )
}
