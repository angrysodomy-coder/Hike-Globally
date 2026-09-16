import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { CloudSun, Leaf, Snowflake, Sun } from 'lucide-react'
import { seasonGuide } from '../../data/content'
import Reveal from '../Reveal'

const ICONS = { Spring: Leaf, Summer: Sun, Autumn: CloudSun, Winter: Snowflake }

function SeasonRow({ item, index }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const Icon = ICONS[item.season] || Sun

  return (
    <motion.div
      ref={ref}
      className="dp-season__row"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="dp-season__head">
        <span className="dp-season__icon"><Icon size={17} /></span>
        <h3>{item.season}</h3>
        <span className="dp-season__months">{item.months}</span>
        <span className="dp-season__score">{item.score}</span>
      </div>
      <div className="dp-season__track" role="img" aria-label={`${item.season} trail score ${item.score} out of 100`}>
        <motion.i
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: item.score / 100 } : undefined}
          transition={{ duration: 1.1, delay: 0.15 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <p className="dp-season__note">{item.note}</p>
    </motion.div>
  )
}

export default function SeasonGuide() {
  return (
    <section className="dp-season section-pad" aria-labelledby="dp-season-title">
      <div className="shell">
        <div className="section-intro section-intro--season">
          <Reveal>
            <p className="eyebrow"><span>04</span> When to go</p>
            <h2 id="dp-season-title">Reading the <em>seasons.</em></h2>
          </Reveal>
          <Reveal className="section-intro__aside" delay={110}>
            <p>There is no wrong month in Nepal — only a wrong region for the month. This is the honest picture.</p>
          </Reveal>
        </div>
        <div className="dp-season__grid">
          {seasonGuide.map((item, index) => <SeasonRow key={item.season} item={item} index={index} />)}
        </div>
      </div>
    </section>
  )
}
