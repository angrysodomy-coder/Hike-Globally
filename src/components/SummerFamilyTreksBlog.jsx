import { useEffect, useRef, useState, useMemo } from 'react'
import {
  X, ArrowRight, Clock, Mountain, Users, Calendar, Shield,
  MapPin, Thermometer, Droplets, Sun, AlertTriangle, Check,
  Heart, Backpack, Utensils, Footprints, ChevronDown, Star,
  Eye, Wind, Camera, Home, ArrowUpRight, Play, Info, Plus, Minus,
  Navigation, Compass, Award, Layers, CloudRain, Trees, Tent
} from 'lucide-react'
import Reveal from './Reveal'

const treksData = [
  {
    id: 'poonhill',
    number: '01',
    title: 'Ghorepani Poon Hill Trek',
    subtitle: 'Best Overall Beginner Family Trek',
    badge: 'Most Popular for Families',
    badgeColor: '#E63946',
    maxAltitude: 3210,
    duration: '4–6 days',
    difficulty: 'Easy',
    dailyWalk: '4–6 hours',
    bestFor: 'First-time families',
    accommodation: 'Comfortable teahouses',
    startingPoint: 'Nayapul / Ulleri',
    image: '/images/blog-poonhill-family.jpg',
    fallbackImage: '/images/trek-annapurna.webp',
    highlights: ['Sunrise from Poon Hill', 'Rhododendron forests', 'Gurung villages', 'Suspension bridges', 'Farm animals & terraces'],
    experiences: {
      kids: ['Suspension bridges', 'Village interactions', 'Farm animals', 'Forest trails', 'Sunrise from Poon Hill'],
      adults: ['Comfortable lodges with attached bathrooms', 'Predictable logistics', 'Easier evacuation access', 'Strong mobile coverage']
    },
    challenges: 'Ulleri staircase — thousands of steep stone steps, slippery in monsoon. Use trekking poles, start early, carry rain covers.',
    summerMagic: 'Lush green hills and dramatic cloud movement around Annapurna and Dhaulagiri after rainfall.',
    color: '#1D3557',
    accent: '#E63946'
  },
  {
    id: 'langtang',
    number: '02',
    title: 'Langtang Valley Trek',
    subtitle: 'Best for Longer Family Adventure',
    badge: 'Immersive Himalayan Experience',
    badgeColor: '#457B9D',
    maxAltitude: 3870,
    duration: '7–9 days',
    difficulty: 'Moderate',
    dailyWalk: '5–7 hours',
    bestFor: 'Active families with teens',
    accommodation: 'Good lodges',
    startingPoint: 'Syabrubesi',
    image: '/images/blog-langtang-valley.jpg',
    fallbackImage: '/images/trek-langtang.webp',
    highlights: ['Tamang culture & monasteries', 'Yak pastures & cheese factories', 'Glacier views', 'Buddhist prayer flags', 'River valleys'],
    experiences: {
      kids: ['Yak cheese factories', 'Monasteries', 'Forest wildlife', 'Prayer flags'],
      adults: ['Established teahouses', 'Homemade meals', 'Strong local hospitality', 'Scenic alpine landscapes']
    },
    challenges: 'Rough road to Syabrubesi (motion sickness). Cold nights at Kyanjin Gompa even in summer — pack thermal layers.',
    summerMagic: 'Forests intensely green, waterfalls full, fewer crowds than autumn.',
    color: '#2A4A3A',
    accent: '#457B9D'
  },
  {
    id: 'mardi',
    number: '03',
    title: 'Mardi Himal Trek',
    subtitle: 'Best Scenic Ridge Trek',
    badge: 'Photographer\'s Dream',
    badgeColor: '#A8DADC',
    maxAltitude: 3580,
    duration: '5–7 days',
    difficulty: 'Easy-Moderate',
    dailyWalk: '4–6 hours',
    bestFor: 'Nature-focused families',
    accommodation: 'Basic lodges',
    startingPoint: 'Kande',
    image: '/images/blog-mardi-himal.jpg',
    fallbackImage: '/images/trip-mardi.jpg',
    highlights: ['Machhapuchhre (Fishtail) views', 'Annapurna South', 'Moss-covered trails', 'Ridge paths', 'Peaceful trails'],
    experiences: {
      kids: ['Cloud walking', 'Forest exploration', 'Mountain photography'],
      adults: ['Dramatic mountain scenery', 'Shorter trekking days', 'Peaceful trails']
    },
    challenges: 'Simpler accommodation — shared toilets, limited hot water. Leeches in lower forest during monsoon — wear long socks.',
    summerMagic: 'Dramatic mountain views between rain showers, moss-covered trails mystical.',
    color: '#1D3557',
    accent: '#E63946'
  },
  {
    id: 'australian',
    number: '04',
    title: 'Australian Camp & Dhampus',
    subtitle: 'Best Short Trek for Young Children',
    badge: 'Perfect for Ages 6+',
    badgeColor: '#F1FAEE',
    maxAltitude: 2100,
    duration: '2–3 days',
    difficulty: 'Very Easy',
    dailyWalk: '2–4 hours',
    bestFor: 'Families with young children',
    accommodation: 'Comfortable guesthouses',
    startingPoint: 'Kande',
    image: '/images/blog-australian-camp.jpg',
    fallbackImage: '/images/region-western.webp',
    highlights: ['Close to Pokhara', 'Open hill views', 'Farm terraces', 'Village dogs & goats', 'Lower altitude'],
    experiences: {
      kids: ['Open hill views', 'Farm terraces', 'Village animals', 'Short walking distances'],
      adults: ['Short transport times', 'Lower altitude safety', 'Easier emergency access', 'Comfortable lodges']
    },
    challenges: 'Still need rain protection — summer storms arrive suddenly. Guesthouses simple despite popularity.',
    summerMagic: 'Quick escape with maximum mountain views, minimal commitment.',
    color: '#457B9D',
    accent: '#1D3557'
  },
  {
    id: 'helambu',
    number: '05',
    title: 'Helambu Trek',
    subtitle: 'Best Quiet Cultural Trek Near Kathmandu',
    badge: 'Off the Beaten Path',
    badgeColor: '#E63946',
    maxAltitude: 3650,
    duration: '5–8 days',
    difficulty: 'Easy-Moderate',
    dailyWalk: '4–6 hours',
    bestFor: 'Culture-seeking families',
    accommodation: 'Simple teahouses',
    startingPoint: 'Sundarijal',
    image: '/images/blog-helambu-trek.jpg',
    fallbackImage: '/images/region-central.webp',
    highlights: ['Sherpa villages', 'Monasteries', 'Pine forests', 'Rice terraces', 'Less commercialized'],
    experiences: {
      kids: ['Suspension bridges', 'Monastery visits', 'Forest walks'],
      adults: ['Fewer tourists', 'Shorter travel logistics', 'Cultural immersion', 'Calmer trails']
    },
    challenges: 'Monsoon can damage trails/roads near Kathmandu — keep flexible schedule. Varying accommodation quality.',
    summerMagic: 'Misty forests and greener hillsides, quieter than Annapurna.',
    color: '#1D3557',
    accent: '#A8DADC'
  }
]

const packingItems = [
  { category: 'Clothing', items: ['Waterproof jacket', 'Fleece layer', 'Quick-dry shirts (3)', 'Trekking pants (2)', 'Warm hat & sun hat', 'Hiking socks (4 pairs)', 'Underwear & base layers'] },
  { category: 'Health', items: ['Personal medications', 'Oral rehydration salts', 'Water purification tablets', 'Sunscreen SPF 50+', 'Insect repellent', 'First-aid kit', 'Hand sanitizer'] },
  { category: 'Gear', items: ['Trekking poles (adjustable)', 'Headlamp + batteries', 'Rain cover for backpack', 'Reusable water bottles (2)', 'Small daypack 20-30L', 'Dry bags', 'Power bank'] },
  { category: 'For Kids', items: ['Snacks & electrolytes', 'Wet wipes', 'Extra socks', 'Small toys/books', 'Comfort item', 'Whistle'] }
]

const faqs = [
  { q: 'Which trek in Nepal will suit beginners with children?', a: 'Ghorepani Poon Hill Trek will usually suit beginner families best because it combines moderate walking distances, comfortable lodges, and lower altitude risk. For very young children under 10, Australian Camp & Dhampus is ideal with just 2-4 hours walking daily.' },
  { q: 'Will children get altitude sickness in Nepal?', a: 'Yes, children can develop altitude sickness just like adults. The key is staying below 3,500m for young children and below 4,000m for teens. Watch for headache, nausea, loss of appetite, and unusual fatigue. Always descend if symptoms worsen.' },
  { q: 'Is summer trekking safe in Nepal?', a: 'Summer trekking remains safe on beginner routes with proper preparation. Expect rain, slippery trails, and occasional transport delays. Benefits include greener landscapes, fewer crowds, cleaner air after rainfall, and quieter trails. Avoid mid-July peak monsoon with very young children.' },
  { q: 'What age will children need for trekking in Nepal?', a: 'Many children aged 6 and above complete short beginner treks successfully if itineraries remain realistic and flexible. Australian Camp is doable from age 5, while Langtang Valley is better for 12+ due to longer days.' },
  { q: 'Will food be safe during trekking?', a: 'Freshly cooked meals in established teahouses generally remain safe. Stick to dal bhat, fried rice, vegetable noodles, boiled potatoes, and soups. Avoid raw salads, unpeeled fruit, and untreated water.' },
  { q: 'Should families hire guides in Nepal?', a: 'Absolutely yes. Guides improve safety, navigate monsoon trail changes, monitor altitude symptoms, arrange safer food/accommodation, and handle transport disruptions. Budget $25-40 per day — worth every rupee for family safety.' }
]

const budgetData = [
  { item: 'Licensed Guide', cost: '$25–40 per day', note: 'Essential for families' },
  { item: 'Porter', cost: '$20–30 per day', note: 'Carries 20kg, helps with kids' },
  { item: 'Teahouse Room', cost: '$5–20 per night', note: 'Basic to comfortable' },
  { item: 'Meals', cost: '$5–10 each', note: 'Dal bhat is best value' },
  { item: 'Trek Permits', cost: '$20–50 total', note: 'TIMS + National Park' },
  { item: 'Private Transport', cost: '$80–150', note: 'Kathmandu-Pokhara etc' }
]

export default function SummerFamilyTreksBlog({ onClose, onBook }) {
  const [activeSection, setActiveSection] = useState('intro')
  const [scrollProgress, setScrollProgress] = useState(0)
  const [openFaq, setOpenFaq] = useState(0)
  const [checkedItems, setCheckedItems] = useState({})
  const [budgetPeople, setBudgetPeople] = useState(4)
  const [budgetDays, setBudgetDays] = useState(5)
  const [selectedTrek, setSelectedTrek] = useState(null)
  const [comparisonSort, setComparisonSort] = useState('recommended')
  const contentRef = useRef(null)

  const sections = useMemo(() => [
    { id: 'intro', label: 'Introduction' },
    { id: 'why-nepal', label: 'Why Nepal?' },
    { id: 'comparison', label: 'Compare Treks' },
    { id: 'how-to-choose', label: 'How to Choose' },
    { id: 'treks', label: '5 Best Treks' },
    { id: 'food-safety', label: 'Food & Safety' },
    { id: 'altitude', label: 'Altitude Guide' },
    { id: 'budget', label: 'Budget' },
    { id: 'packing', label: 'Packing List' },
    { id: 'best-time', label: 'Best Time' },
    { id: 'faq', label: 'FAQ' }
  ], [])

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(max > 0 ? scrolled / max : 0)

      const sectionEls = sections.map(s => document.getElementById(s.id)).filter(Boolean)
      let current = 'intro'
      for (const el of sectionEls) {
        if (el.getBoundingClientRect().top <= 150) current = el.id
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [sections])

  useEffect(() => {
    document.body.classList.add('drawer-is-open')
    return () => document.body.classList.remove('drawer-is-open')
  }, [])

  const toggleCheck = (catIdx, itemIdx) => {
    const key = `${catIdx}-${itemIdx}`
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const sortedTreks = useMemo(() => {
    const copy = [...treksData]
    if (comparisonSort === 'altitude-low') return copy.sort((a, b) => a.maxAltitude - b.maxAltitude)
    if (comparisonSort === 'altitude-high') return copy.sort((a, b) => b.maxAltitude - a.maxAltitude)
    if (comparisonSort === 'duration-short') return copy.sort((a, b) => parseInt(a.duration) - parseInt(b.duration))
    if (comparisonSort === 'difficulty') return copy.sort((a, b) => {
      const order = { 'Very Easy': 0, 'Easy': 1, 'Easy-Moderate': 2, 'Moderate': 3 }
      return (order[a.difficulty] ?? 9) - (order[b.difficulty] ?? 9)
    })
    return copy
  }, [comparisonSort])

  const totalBudget = useMemo(() => {
    const guide = 32.5 * budgetDays
    const porter = 25 * budgetDays * Math.ceil(budgetPeople / 2)
    const rooms = 12 * budgetDays * Math.ceil(budgetPeople / 2)
    const meals = 8 * 3 * budgetDays * budgetPeople
    const permits = 35 * budgetPeople
    return { guide, porter, rooms, meals, permits, total: guide + porter + rooms + meals + permits }
  }, [budgetPeople, budgetDays])

  return (
    <div className="blog-page">
      <div className="blog-progress" style={{ transform: `scaleX(${scrollProgress})` }} />
      
      <header className="blog-header">
        <div className="blog-header__inner">
          <button className="blog-back" onClick={onClose} aria-label="Back to journal">
            <X size={18} /> <span>Close</span>
          </button>
          <div className="blog-header__meta">
            <span>Field Guide · 2026</span>
            <span className="dot" />
            <span>18 min read</span>
          </div>
          <button className="blog-book" onClick={onBook}>
            Plan Family Trek <ArrowUpRight size={16} />
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="blog-hero">
        <div className="blog-hero__media">
          <img src="/images/blog-family-summer-hero.jpg" alt="Family trekking in Nepal summer" />
          <div className="blog-hero__wash" />
          <div className="blog-hero__vignette" />
        </div>
        
        <div className="blog-hero__content shell">
          <Reveal>
            <div className="blog-hero__breadcrumb">
              <span>Journal</span><i /><span>Family Guides</span><i /><span>Summer 2026</span>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h1>
              Best Summer Treks<br />
              For Family in Nepal<br />
              <em>For Beginners.</em>
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <div className="blog-hero__sub">
              <p>Five beginner-friendly routes that balance safety, comfort, and wonder — tested for monsoon season with kids aged 6 to 16. No technical climbing, just pure Himalayan magic.</p>
              <div className="blog-hero__stats">
                <div><Mountain size={16} /><strong>5</strong><span>Curated treks</span></div>
                <div><Users size={16} /><strong>6+</strong><span>Minimum age</span></div>
                <div><Shield size={16} /><strong>&lt;4000m</strong><span>Safe altitude</span></div>
                <div><Calendar size={16} /><strong>June–Aug</strong><span>Summer window</span></div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={300}>
            <div className="blog-hero__author">
              <img src="/images/journal-porters.webp" alt="" />
              <div>
                <strong>Written by Nima Sherpa & Emma Collins</strong>
                <span>Local guide + Family travel specialist · 12 years leading family treks</span>
              </div>
              <div className="blog-hero__author-badge"><Star size={12} /> Expert Verified</div>
            </div>
          </Reveal>
        </div>

        <div className="blog-hero__scroll">
          <span>Scroll to explore</span>
          <i />
        </div>
      </section>

      {/* LAYOUT */}
      <div className="blog-layout shell">
        {/* TOC */}
        <aside className="blog-toc">
          <div className="blog-toc__inner">
            <p className="eyebrow"><span>00</span> Contents</p>
            <nav>
              {sections.map((s, idx) => (
                <button
                  key={s.id}
                  className={activeSection === s.id ? 'is-active' : ''}
                  onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  <span>0{idx + 1}</span>{s.label}
                </button>
              ))}
            </nav>
            <div className="blog-toc__cta">
              <p>Ready to trek?</p>
              <button onClick={onBook}>Get family quote <ArrowRight size={14} /></button>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <article className="blog-content" ref={contentRef}>
          {/* INTRO */}
          <Reveal as="section" id="intro" className="blog-section">
            <div className="blog-kicker">
              <span>Summer in Nepal</span>
              <span>June — August Monsoon</span>
            </div>
            <h2>Greener trails, fewer crowds, <em>cleaner air.</em></h2>
            <p className="lead">Nepal in summer will surprise you. Yes, there will be rain. But there will also be emerald hills, dramatic cloud theatre around Annapurna, quieter teahouses, and a sense of having the Himalaya almost to yourself.</p>
            
            <div className="blog-highlight">
              <div className="blog-highlight__icon"><CloudRain size={20} /></div>
              <div>
                <h4>Monsoon Reality Check for Families</h4>
                <p>Summer brings slippery trails, leeches in forest sections, and occasional flight delays. But with proper pacing, waterproof gear, and flexible planning — it becomes your advantage. Trails will be 60% less crowded than October.</p>
              </div>
            </div>

            <div className="blog-grid-2">
              <div className="blog-card blog-card--dark">
                <Trees size={22} />
                <h4>Why Summer Wins for Families</h4>
                <ul>
                  <li><Check size={14} /> Lush green landscapes after rainfall</li>
                  <li><Check size={14} /> Fewer tourists on popular routes</li>
                  <li><Check size={14} /> Cleaner mountain air & dramatic skies</li>
                  <li><Check size={14} /> Lower accommodation prices</li>
                  <li><Check size={14} /> Waterfalls at full power</li>
                </ul>
              </div>
              <div className="blog-card blog-card--light">
                <AlertTriangle size={22} />
                <h4>What to Prepare For</h4>
                <ul>
                  <li>Rain covers & quick-dry clothing essential</li>
                  <li>Leeches in lower forests — long socks help</li>
                  <li>Slippery stone staircases — trekking poles must</li>
                  <li>Flight delays — keep buffer days</li>
                  <li>Flexible itinerary mindset</li>
                </ul>
              </div>
            </div>
          </Reveal>

          {/* WHY NEPAL */}
          <Reveal as="section" id="why-nepal" className="blog-section">
            <p className="eyebrow"><span>01</span> Why Nepal suits beginners</p>
            <h2>Teahouses, guides, and trails <em>that welcome families.</em></h2>
            <p>Nepal will remain one of the world's most accessible trekking destinations because trails have teahouses, guides and porters are widely available, durations range from 3-day walks to 10-day adventures, and families experience mountain culture without technical climbing — all at lower cost than Europe or North America.</p>

            <div className="blog-icon-grid">
              {[
                { icon: Home, title: 'Teahouses Everywhere', desc: 'No camping needed. Warm lodges with meals every few hours.' },
                { icon: Users, title: 'Guides & Porters', desc: 'Licensed, experienced, child-friendly. Handle logistics.' },
                { icon: Clock, title: 'Flexible Durations', desc: 'From 2-day Dhampus to 9-day Langtang. Pick your pace.' },
                { icon: Heart, title: 'Culture Without Climbing', desc: 'Villages, monasteries, farm life — no ropes needed.' },
                { icon: Shield, title: 'Lower Costs', desc: 'Family of 4 can trek for less than 1 week in Alps.' },
                { icon: Eye, title: 'Safety Net', desc: 'Trails busy enough you never feel isolated.' }
              ].map((item, i) => (
                <div key={i} className="blog-icon-card">
                  <item.icon size={20} />
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="blog-concern">
              <h4>Biggest Concerns for Beginner Families — Solved</h4>
              <div className="blog-concern__grid">
                {[
                  'Altitude sickness', 'Toilet hygiene', 'Food safety', 'Trail difficulty', 'Weather unpredictability', 'Fear of isolation', 'Medical access'
                ].map(c => (
                  <span key={c}><Check size={12} /> {c} — minimized on routes below</span>
                ))}
              </div>
            </div>
          </Reveal>

          {/* COMPARISON TABLE */}
          <Reveal as="section" id="comparison" className="blog-section blog-section--wide">
            <p className="eyebrow"><span>02</span> Quick comparison</p>
            <div className="blog-section__head">
              <h2>Find your perfect <em>family match.</em></h2>
              <div className="blog-sort">
                <span>Sort by:</span>
                <select value={comparisonSort} onChange={e => setComparisonSort(e.target.value)}>
                  <option value="recommended">Recommended</option>
                  <option value="altitude-low">Lowest Altitude</option>
                  <option value="altitude-high">Highest Altitude</option>
                  <option value="duration-short">Shortest Duration</option>
                  <option value="difficulty">Easiest First</option>
                </select>
              </div>
            </div>

            <div className="blog-table-wrap">
              <table className="blog-table">
                <thead>
                  <tr>
                    <th>Trek</th>
                    <th>Max Altitude</th>
                    <th>Duration</th>
                    <th>Difficulty</th>
                    <th>Best For</th>
                    <th>Stay</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTreks.map(t => (
                    <tr key={t.id} className={selectedTrek === t.id ? 'is-selected' : ''} onClick={() => setSelectedTrek(t.id)}>
                      <td>
                        <strong>{t.title}</strong>
                        <span style={{ background: t.badgeColor }}>{t.badge}</span>
                      </td>
                      <td><span className="alt-badge">{t.maxAltitude} m</span></td>
                      <td>{t.duration}</td>
                      <td><span className={`diff diff--${t.difficulty.toLowerCase().replace(/[^a-z]/g, '')}`}>{t.difficulty}</span></td>
                      <td>{t.bestFor}</td>
                      <td>{t.accommodation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="blog-altitude-viz">
              <h4><Mountain size={16} /> Altitude Safety Visualizer</h4>
              <p>Stay below 3,500m for young children, below 4,000m for teens. All 5 treks are in the safe zone.</p>
              <div className="alt-bar">
                {treksData.map(t => (
                  <div key={t.id} className="alt-bar__item" style={{ left: `${(t.maxAltitude / 4000) * 100}%` }}>
                    <div className="alt-bar__dot" style={{ background: t.accent }} />
                    <span>{t.title.split(' ')[0]} {t.maxAltitude}m</span>
                  </div>
                ))}
                <div className="alt-bar__track">
                  <div className="alt-bar__safe" style={{ width: '87.5%' }}><span>Safe for kids &lt;3500m</span></div>
                  <div className="alt-bar__moderate" style={{ left: '87.5%', width: '12.5%' }}><span>Teens only</span></div>
                  <div className="alt-bar__line" style={{ left: '87.5%' }} />
                  <div className="alt-bar__line" style={{ left: '100%' }} />
                </div>
              </div>
            </div>
          </Reveal>

          {/* HOW TO CHOOSE */}
          <Reveal as="section" id="how-to-choose" className="blog-section">
            <p className="eyebrow"><span>03</span> How to choose</p>
            <h2>Choose lower, shorter, <em>slower.</em></h2>
            
            <div className="blog-choose-grid">
              <div className="blog-choose-card">
                <div className="blog-choose-card__num">01</div>
                <h4>Choose Lower Altitudes First</h4>
                <p>Altitude sickness affects beginners unpredictably. Ideal first-trek altitudes:</p>
                <div className="blog-choose-card__stats">
                  <span><strong>Under 3,500m</strong> for young children</span>
                  <span><strong>Under 4,000m</strong> for healthy teens & adults</span>
                </div>
              </div>
              <div className="blog-choose-card">
                <div className="blog-choose-card__num">02</div>
                <h4>Prioritize Short Walking Days</h4>
                <p>Steep stone staircases exhaust beginners faster than expected.</p>
                <div className="blog-choose-card__stats">
                  <span><strong>3–5 hours</strong> for children under 12</span>
                  <span><strong>5–6 hours</strong> for teenagers</span>
                </div>
              </div>
              <div className="blog-choose-card">
                <div className="blog-choose-card__num">03</div>
                <h4>Avoid Overpacked Itineraries</h4>
                <p>Most common mistake: trying to see everything too quickly. Fatigue reduces enjoyment and increases injury risk. Build in rest.</p>
              </div>
              <div className="blog-choose-card blog-choose-card--accent">
                <div className="blog-choose-card__num">04</div>
                <h4>Hire a Licensed Guide</h4>
                <p>A guide will help navigate monsoon trail changes, monitor altitude, arrange safer food & accommodation, handle transport disruptions.</p>
                <button onClick={onBook}>Find family guide <ArrowRight size={14} /></button>
              </div>
            </div>
          </Reveal>

          {/* TREKS */}
          <section id="treks" className="blog-section">
            <p className="eyebrow"><span>04</span> The 5 Best Summer Family Treks</p>
            <h2>From 2-day strolls to <em>9-day adventures.</em></h2>
            
            {treksData.map((trek, idx) => (
              <Reveal key={trek.id} className="trek-detail" id={`trek-${trek.id}`}>
                <div className="trek-detail__header">
                  <div className="trek-detail__number">{trek.number}</div>
                  <div>
                    <span className="trek-detail__badge" style={{ background: trek.badgeColor, color: trek.badgeColor === '#F1FAEE' ? '#1D3557' : '#fff' }}>{trek.badge}</span>
                    <h3>{trek.title}</h3>
                    <p>{trek.subtitle}</p>
                  </div>
                </div>

                <div className="trek-detail__media">
                  <img src={trek.image} alt={trek.title} onError={e => e.currentTarget.src = trek.fallbackImage} />
                  <div className="trek-detail__media-meta">
                    <span><MapPin size={12} /> Start: {trek.startingPoint}</span>
                    <span><Mountain size={12} /> {trek.maxAltitude} m max</span>
                    <span><Clock size={12} /> {trek.dailyWalk} daily</span>
                  </div>
                </div>

                <div className="trek-detail__overview">
                  {[
                    { label: 'Duration', value: trek.duration, icon: Calendar },
                    { label: 'Max Altitude', value: `${trek.maxAltitude} m`, icon: Mountain },
                    { label: 'Daily Walk', value: trek.dailyWalk, icon: Footprints },
                    { label: 'Difficulty', value: trek.difficulty, icon: Layers },
                    { label: 'Best For', value: trek.bestFor, icon: Users },
                    { label: 'Stay', value: trek.accommodation, icon: Tent }
                  ].map(stat => (
                    <div key={stat.label} className="trek-stat">
                      <stat.icon size={14} />
                      <small>{stat.label}</small>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </div>

                <div className="trek-detail__body">
                  <div className="trek-detail__col">
                    <h4><Star size={16} /> What Families Will Experience</h4>
                    <div className="trek-exp">
                      <div>
                        <strong>Children will love:</strong>
                        <ul>{trek.experiences.kids.map(i => <li key={i}><Check size={12} />{i}</li>)}</ul>
                      </div>
                      <div>
                        <strong>Adults will value:</strong>
                        <ul>{trek.experiences.adults.map(i => <li key={i}><Check size={12} />{i}</li>)}</ul>
                      </div>
                    </div>
                    
                    <div className="trek-magic">
                      <Sun size={16} />
                      <div>
                        <strong>Summer Magic</strong>
                        <p>{trek.summerMagic}</p>
                      </div>
                    </div>
                  </div>

                  <div className="trek-detail__col">
                    <div className="trek-challenge">
                      <AlertTriangle size={18} />
                      <div>
                        <strong>Important Reality</strong>
                        <p>{trek.challenges}</p>
                      </div>
                    </div>

                    <div className="trek-highlights">
                      <h5>Trail Highlights</h5>
                      <div className="trek-highlights__grid">
                        {trek.highlights.map(h => (
                          <span key={h}><Camera size={12} />{h}</span>
                        ))}
                      </div>
                    </div>

                    <button className="trek-cta" onClick={onBook}>
                      Plan this trek for my family <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </Reveal>
            ))}
          </section>

          {/* FOOD SAFETY */}
          <Reveal as="section" id="food-safety" className="blog-section">
            <p className="eyebrow"><span>05</span> Food & Water Safety</p>
            <h2>Eat like a local, <em>stay healthy.</em></h2>
            
            <div className="blog-grid-2">
              <div className="blog-card blog-card--success">
                <Utensils size={20} />
                <h4>Safest Foods to Eat</h4>
                <ul>
                  {['Dal bhat (lentils & rice)', 'Fried rice & vegetable noodles', 'Boiled potatoes & omelets', 'Freshly cooked soups', 'Garlic soup (altitude help)'].map(f => (
                    <li key={f}><Check size={14} />{f}</li>
                  ))}
                </ul>
              </div>
              <div className="blog-card blog-card--danger">
                <AlertTriangle size={20} />
                <h4>Foods to Avoid</h4>
                <ul>
                  {['Raw salads & unpeeled fruit', 'Undercooked meat', 'Unfiltered tap water', 'Ice in drinks', 'Street food in cities'].map(f => (
                    <li key={f}><X size={12} />{f}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="blog-water">
              <Droplets size={24} />
              <div>
                <h4>Water Safety — Non-Negotiable</h4>
                <p>Never drink untreated tap water. Best options: water purification tablets, UV purifiers like SteriPEN, filter bottles (LifeStraw), or boiled water from lodges. Carry 2 bottles per person.</p>
                <div className="blog-water__options">
                  {['Purification tablets', 'UV purifier', 'Filter bottle', 'Boiled water'].map(o => (
                    <span key={o}><Check size={12} />{o}</span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* ALTITUDE */}
          <Reveal as="section" id="altitude" className="blog-section">
            <p className="eyebrow"><span>06</span> Altitude Safety</p>
            <h2>What every parent <em>must know.</em></h2>
            
            <div className="blog-altitude-grid">
              <div className="blog-alt-card">
                <Thermometer size={20} />
                <h4>Early Symptoms — Watch Closely</h4>
                <ul>
                  {['Headache that won\'t go away', 'Nausea & loss of appetite', 'Dizziness & unusual fatigue', 'Poor sleep & irritability', 'Reduced walking pace'].map(s => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className="blog-alt-card blog-alt-card--alert">
                <Heart size={20} />
                <h4>Important Family Rule</h4>
                <p><strong>Children may hide symptoms because they fear ending the trek early.</strong></p>
                <p>Parents should monitor mood changes, reduced energy, appetite loss, walking pace. If symptoms worsen — descend immediately. No summit is worth risk.</p>
                <div className="blog-alt-card__action">
                  <Shield size={14} /> Descend 300-500m at first serious symptom
                </div>
              </div>
            </div>
          </Reveal>

          {/* BUDGET */}
          <Reveal as="section" id="budget" className="blog-section">
            <p className="eyebrow"><span>07</span> Budget Breakdown</p>
            <div className="blog-section__head">
              <h2>Transparent costs, <em>no surprises.</em></h2>
              <div className="blog-budget-controls">
                <label><Users size={14} /> Family size <input type="number" min={1} max={8} value={budgetPeople} onChange={e => setBudgetPeople(Math.max(1, parseInt(e.target.value)||1))} /></label>
                <label><Calendar size={14} /> Days <input type="number" min={2} max={15} value={budgetDays} onChange={e => setBudgetDays(Math.max(2, parseInt(e.target.value)||2))} /></label>
              </div>
            </div>

            <div className="blog-table-wrap">
              <table className="blog-table blog-table--budget">
                <thead>
                  <tr><th>Expense</th><th>Estimated Cost</th><th>Note</th></tr>
                </thead>
                <tbody>
                  {budgetData.map(row => (
                    <tr key={row.item}><td>{row.item}</td><td><strong>{row.cost}</strong></td><td>{row.note}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="blog-calc">
              <h4><Award size={18} /> Family Budget Calculator</h4>
              <p>For {budgetPeople} people × {budgetDays} days — estimated total (excluding flights):</p>
              <div className="blog-calc__grid">
                <div><small>Guide</small><strong>${totalBudget.guide.toFixed(0)}</strong></div>
                <div><small>Porters</small><strong>${totalBudget.porter.toFixed(0)}</strong></div>
                <div><small>Rooms</small><strong>${totalBudget.rooms.toFixed(0)}</strong></div>
                <div><small>Meals</small><strong>${totalBudget.meals.toFixed(0)}</strong></div>
                <div><small>Permits</small><strong>${totalBudget.permits.toFixed(0)}</strong></div>
                <div className="total"><small>Total Est.</small><strong>${totalBudget.total.toFixed(0)}</strong><span>~${(totalBudget.total/budgetPeople).toFixed(0)} per person</span></div>
              </div>
              <p className="blog-calc__note"><Info size={12} /> Carry cash — ATMs won't exist on most trails. Pokhara & Kathmandu have ATMs.</p>
            </div>
          </Reveal>

          {/* PACKING */}
          <Reveal as="section" id="packing" className="blog-section">
            <p className="eyebrow"><span>08</span> Essential Packing</p>
            <h2>Pack light, pack <em>smart.</em></h2>
            
            <div className="blog-packing-intro">
              <img src="/images/blog-family-gear.jpg" alt="Family trekking gear flat lay" />
              <div>
                <p>Summer family trekking needs less than you think — but the right items matter. Quick-dry, waterproof, layers. Everything else you can buy in Pokhara or Kathmandu.</p>
                <div className="blog-packing-progress">
                  <span>{Object.values(checkedItems).filter(Boolean).length} / {packingItems.flatMap(c => c.items).length} packed</span>
                  <div className="bar"><i style={{ width: `${(Object.values(checkedItems).filter(Boolean).length / packingItems.flatMap(c => c.items).length) * 100}%` }} /></div>
                </div>
              </div>
            </div>

            <div className="blog-packing-grid">
              {packingItems.map((cat, catIdx) => (
                <div key={cat.category} className="blog-pack-cat">
                  <h4><Backpack size={16} /> {cat.category}</h4>
                  <ul>
                    {cat.items.map((item, itemIdx) => {
                      const key = `${catIdx}-${itemIdx}`
                      return (
                        <li key={item} className={checkedItems[key] ? 'is-checked' : ''}>
                          <button onClick={() => toggleCheck(catIdx, itemIdx)}>
                            <span className="check">{checkedItems[key] ? <Check size={12} /> : null}</span>
                            {item}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>

          {/* BEST TIME */}
          <Reveal as="section" id="best-time" className="blog-section">
            <p className="eyebrow"><span>09</span> Timing</p>
            <h2>When in summer <em>to go.</em></h2>
            
            <div className="blog-time-grid">
              <div className="blog-time-card">
                <div className="blog-time-card__head">
                  <Calendar size={20} />
                  <div><strong>Early June</strong><span>Pre-monsoon window</span></div>
                </div>
                <ul>
                  <li><Check size={12} /> Fewer crowds</li>
                  <li><Check size={12} /> Greener landscapes</li>
                  <li><Check size={12} /> Better mountain visibility before heavier monsoon</li>
                </ul>
                <div className="blog-time-card__badge">Recommended for families</div>
              </div>
              <div className="blog-time-card">
                <div className="blog-time-card__head">
                  <Sun size={20} />
                  <div><strong>Late August</strong><span>Post-monsoon clearing</span></div>
                </div>
                <ul>
                  <li><Check size={12} /> Cleaner air after rainfall</li>
                  <li><Check size={12} /> Fresh vegetation</li>
                  <li><Check size={12} /> Less dust, vibrant photos</li>
                </ul>
                <div className="blog-time-card__badge blog-time-card__badge--alt">Also great</div>
              </div>
              <div className="blog-time-card blog-time-card--warn">
                <div className="blog-time-card__head">
                  <CloudRain size={20} />
                  <div><strong>Mid-July</strong><span>Peak monsoon</span></div>
                </div>
                <ul>
                  <li><X size={12} /> Heaviest rainfall</li>
                  <li><X size={12} /> Most leeches & slippery trails</li>
                  <li><X size={12} /> Avoid with very young children</li>
                </ul>
                <div className="blog-time-card__badge blog-time-card__badge--warn">Avoid if possible</div>
              </div>
            </div>
          </Reveal>

          {/* FAQ */}
          <Reveal as="section" id="faq" className="blog-section">
            <p className="eyebrow"><span>10</span> FAQ</p>
            <h2>Questions families <em>always ask.</em></h2>
            
            <div className="blog-faq">
              {faqs.map((faq, idx) => (
                <div key={idx} className={`blog-faq__item ${openFaq === idx ? 'is-open' : ''}`}>
                  <button onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}>
                    <span>{faq.q}</span>
                    <i>{openFaq === idx ? <Minus size={16} /> : <Plus size={16} />}</i>
                  </button>
                  <div className="blog-faq__answer">
                    <p>{faq.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* CONCLUSION */}
          <Reveal as="section" className="blog-conclusion">
            <div className="blog-conclusion__inner">
              <p className="eyebrow"><span>11</span> Conclusion</p>
              <h2>Start with Poon Hill. <em>Fall in love with Nepal.</em></h2>
              <p className="lead">The best beginner family treks in Nepal will prioritize manageable altitude, realistic walking days, and reliable accommodation instead of extreme mountain goals. Families who choose shorter itineraries, travel with flexibility, and prepare carefully for monsoon conditions will usually enjoy a far safer and more rewarding experience.</p>
              <p>For most first-time visitors, <strong>Ghorepani Poon Hill will provide the strongest overall balance</strong> of scenery, comfort, and beginner accessibility. Families wanting deeper mountain immersion can then progress toward Langtang or Mardi Himal in future trips.</p>
              
              <div className="blog-conclusion__cta">
                <div>
                  <h4>Ready to plan your family adventure?</h4>
                  <p>Our local experts have led 500+ family treks. Get a custom itinerary in 24 hours.</p>
                </div>
                <button onClick={onBook}>Plan my family trek <ArrowRight size={18} /></button>
              </div>

              <div className="blog-conclusion__trust">
                <span><Shield size={14} /> Licensed guides</span>
                <span><Award size={14} /> 4.9/5 from 200+ families</span>
                <span><Heart size={14} /> Child-friendly pacing</span>
                <span><Navigation size={14} /> 24/7 support</span>
              </div>
            </div>
          </Reveal>

          <div className="blog-share">
            <span>Share this guide</span>
            <div>
              <button>Copy link</button>
              <button>WhatsApp</button>
              <button>Email</button>
            </div>
          </div>
        </article>
      </div>

      <style>{`
        .blog-page {
          position: fixed;
          inset: 0;
          z-index: 3000;
          overflow-y: auto;
          background: #fff;
          color: #1D3557;
          font-family: var(--sans);
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
        }
        .blog-progress {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: #E63946;
          transform-origin: left;
          z-index: 4000;
          transition: transform 0.1s linear;
        }
        .blog-header {
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(18px);
          background: rgba(255,255,255,0.92);
          border-bottom: 1px solid rgba(29,53,87,0.12);
        }
        .blog-header__inner {
          width: min(1440px, calc(100vw - 48px));
          margin: 0 auto;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .blog-back {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 40px;
          padding: 0 14px;
          border: 1px solid rgba(29,53,87,0.15);
          background: #fff;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .blog-back:hover { background: #1D3557; color: #fff; }
        .blog-header__meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          color: #457B9D;
          letter-spacing: 0.04em;
        }
        .blog-header__meta .dot { width: 4px; height: 4px; border-radius: 50%; background: #A8DADC; }
        .blog-book {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 40px;
          padding: 0 18px;
          background: #1D3557;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .blog-book:hover { background: #E63946; }

        .blog-hero {
          position: relative;
          min-height: 88vh;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          background: #1D3557;
          color: #fff;
          padding-bottom: 80px;
        }
        .blog-hero__media, .blog-hero__media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .blog-hero__media img { object-fit: cover; object-position: center 45%; }
        .blog-hero__wash {
          position: absolute; inset: 0;
          background: linear-gradient(90deg, rgba(29,53,87,0.88) 0%, rgba(29,53,87,0.55) 45%, rgba(29,53,87,0.15) 80%), linear-gradient(180deg, rgba(29,53,87,0.25) 0%, transparent 30%, rgba(29,53,87,0.75) 100%);
        }
        .blog-hero__vignette {
          position: absolute; inset: 0;
          background: radial-gradient(80% 70% at 20% 80%, rgba(29,53,87,0.5) 0%, transparent 70%);
        }
        .blog-hero__content {
          position: relative;
          z-index: 2;
          width: 100%;
        }
        .blog-hero__breadcrumb {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
        }
        .blog-hero__breadcrumb i { width: 12px; height: 1px; background: rgba(255,255,255,0.3); }
        .blog-hero h1 {
          font-family: var(--display);
          font-size: clamp(48px, 6vw, 88px);
          line-height: 0.9;
          font-weight: 400;
          letter-spacing: -0.02em;
          max-width: 900px;
        }
        .blog-hero h1 em {
          font-family: var(--serif);
          font-style: italic;
          color: #A8DADC;
          font-weight: 400;
        }
        .blog-hero__sub {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 40px;
          margin-top: 28px;
          max-width: 1100px;
          align-items: end;
        }
        .blog-hero__sub > p {
          font-size: clamp(15px, 1.2vw, 18px);
          line-height: 1.6;
          font-weight: 300;
          color: rgba(255,255,255,0.85);
        }
        .blog-hero__stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .blog-hero__stats div {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(6px);
          font-size: 11px;
        }
        .blog-hero__stats strong { font-size: 16px; color: #fff; }
        .blog-hero__stats span { color: rgba(255,255,255,0.6); margin-left: 2px; }
        .blog-hero__author {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 36px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.15);
          max-width: 700px;
        }
        .blog-hero__author img { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
        .blog-hero__author div { display: grid; gap: 2px; }
        .blog-hero__author strong { font-size: 13px; }
        .blog-hero__author span { font-size: 11px; color: rgba(255,255,255,0.6); }
        .blog-hero__author-badge {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          background: #E63946;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .blog-hero__scroll {
          position: absolute;
          bottom: 28px;
          right: max(24px, calc((100vw - 1440px)/2));
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.5);
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          transform: rotate(90deg);
          transform-origin: right center;
        }
        .blog-hero__scroll i { width: 30px; height: 1px; background: currentColor; }

        .blog-layout {
          display: grid;
          grid-template-columns: 260px minmax(0, 1fr);
          gap: clamp(40px, 5vw, 80px);
          padding-top: 80px;
          padding-bottom: 100px;
        }
        .blog-toc {
          position: relative;
        }
        .blog-toc__inner {
          position: sticky;
          top: 100px;
          display: grid;
          gap: 28px;
        }
        .blog-toc .eyebrow { margin: 0; }
        .blog-toc nav {
          display: grid;
          border-top: 1px solid rgba(29,53,87,0.12);
        }
        .blog-toc nav button {
          display: grid;
          grid-template-columns: 28px 1fr;
          align-items: center;
          text-align: left;
          padding: 12px 0;
          border-bottom: 1px solid rgba(29,53,87,0.08);
          font-family: var(--display);
          font-size: 15px;
          background: transparent;
          color: #457B9D;
          transition: all 0.2s;
        }
        .blog-toc nav button span { font-family: var(--sans); font-size: 10px; }
        .blog-toc nav button.is-active { color: #1D3557; padding-left: 8px; border-left: 2px solid #E63946; }
        .blog-toc nav button:hover { color: #1D3557; }
        .blog-toc__cta {
          padding: 18px;
          background: #F1FAEE;
          border: 1px solid rgba(29,53,87,0.08);
        }
        .blog-toc__cta p { font-size: 13px; font-weight: 600; margin-bottom: 10px; }
        .blog-toc__cta button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding-bottom: 4px;
          border-bottom: 1px solid #1D3557;
          background: transparent;
        }

        .blog-content { min-width: 0; }
        .blog-section { padding-bottom: 100px; border-bottom: 1px solid rgba(29,53,87,0.08); margin-bottom: 80px; }
        .blog-section:last-of-type { border: 0; margin: 0; }
        .blog-section--wide { margin-left: -20px; margin-right: -20px; padding-left: 20px; padding-right: 20px; }
        .blog-kicker { display: flex; justify-content: space-between; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #457B9D; margin-bottom: 18px; border-bottom: 1px solid rgba(29,53,87,0.1); padding-bottom: 12px; }
        .blog-section h2 { font-family: var(--display); font-size: clamp(36px, 4vw, 56px); line-height: 0.95; font-weight: 400; margin-bottom: 18px; }
        .blog-section h2 em { font-family: var(--serif); font-style: italic; color: #E63946; font-weight: 400; }
        .blog-section p { font-size: 16px; line-height: 1.7; color: #1D3557; }
        .blog-section p.lead { font-size: 20px; line-height: 1.5; color: #1D3557; font-weight: 400; margin-bottom: 24px; }
        .blog-highlight { display: grid; grid-template-columns: 48px 1fr; gap: 16px; padding: 20px; background: #1D3557; color: #fff; margin: 28px 0; }
        .blog-highlight__icon { width: 48px; height: 48px; display: grid; place-items: center; background: #E63946; border-radius: 50%; }
        .blog-highlight h4 { font-size: 14px; margin-bottom: 6px; }
        .blog-highlight p { color: rgba(255,255,255,0.75); font-size: 13px; line-height: 1.6; }
        .blog-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; }
        .blog-card { padding: 22px; border: 1px solid rgba(29,53,87,0.1); }
        .blog-card--dark { background: #1D3557; color: #fff; }
        .blog-card--dark h4 { color: #fff; }
        .blog-card--dark ul { color: rgba(255,255,255,0.8); }
        .blog-card--light { background: #fff; }
        .blog-card h4 { font-size: 14px; font-weight: 600; margin: 12px 0 10px; display: flex; align-items: center; gap: 8px; }
        .blog-card ul { display: grid; gap: 8px; font-size: 13px; line-height: 1.5; }
        .blog-card li { display: flex; gap: 8px; align-items: flex-start; }
        .blog-card--success { background: #F1FAEE; border-color: #A8DADC; }
        .blog-card--danger { background: #FFF5F5; border-color: #E63946; }
        .blog-icon-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 28px; }
        .blog-icon-card { padding: 18px; border: 1px solid rgba(29,53,87,0.08); background: #fff; transition: transform 0.2s; }
        .blog-icon-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(29,53,87,0.08); }
        .blog-icon-card h4 { font-size: 13px; margin: 10px 0 6px; }
        .blog-icon-card p { font-size: 12px; color: #457B9D; line-height: 1.5; }
        .blog-concern { margin-top: 28px; padding: 18px; background: #F6F8F5; border: 1px solid rgba(29,53,87,0.08); }
        .blog-concern h4 { font-size: 13px; margin-bottom: 12px; }
        .blog-concern__grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .blog-concern__grid span { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; background: #fff; border: 1px solid rgba(29,53,87,0.1); font-size: 11px; }

        .blog-section__head { display: flex; justify-content: space-between; align-items: end; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }
        .blog-sort { display: flex; align-items: center; gap: 10px; font-size: 11px; }
        .blog-sort select { padding: 8px 12px; border: 1px solid rgba(29,53,87,0.15); background: #fff; font-size: 12px; }
        .blog-table-wrap { overflow-x: auto; border: 1px solid rgba(29,53,87,0.12); margin-top: 16px; }
        .blog-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 700px; }
        .blog-table th { text-align: left; padding: 12px 14px; background: #1D3557; color: #fff; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
        .blog-table td { padding: 14px; border-bottom: 1px solid rgba(29,53,87,0.08); vertical-align: top; }
        .blog-table tr { transition: background 0.15s; cursor: pointer; }
        .blog-table tr:hover { background: #F1FAEE; }
        .blog-table tr.is-selected { background: #F1FAEE; }
        .blog-table td strong { display: block; font-size: 13px; margin-bottom: 4px; }
        .blog-table td span { display: inline-block; padding: 2px 6px; font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; }
        .alt-badge { background: #1D3557; color: #fff; padding: 3px 8px !important; border-radius: 2px; font-size: 11px !important; }
        .diff { padding: 3px 8px; border-radius: 10px; font-size: 10px; }
        .diff--veryeasy { background: #F1FAEE; color: #2A4A3A; }
        .diff--easy { background: #A8DADC; color: #1D3557; }
        .diff--easymoderate { background: #FFE8A3; color: #7A5A00; }
        .diff--moderate { background: #FFD6D6; color: #8B0000; }

        .blog-altitude-viz { margin-top: 32px; padding: 22px; background: #F6F8F5; border: 1px solid rgba(29,53,87,0.08); }
        .blog-altitude-viz h4 { display: flex; align-items: center; gap: 8px; font-size: 14px; margin-bottom: 6px; }
        .blog-altitude-viz p { font-size: 12px; color: #457B9D; margin-bottom: 18px; }
        .alt-bar { position: relative; height: 80px; margin-top: 10px; }
        .alt-bar__track { position: absolute; left: 0; right: 0; top: 30px; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
        .alt-bar__safe { position: absolute; top: 0; left: 0; height: 100%; background: #A8DADC; display: flex; align-items: center; justify-content: center; }
        .alt-bar__safe span { font-size: 9px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
        .alt-bar__moderate { position: absolute; top: 0; height: 100%; background: #FFE8A3; display: flex; align-items: center; justify-content: center; }
        .alt-bar__moderate span { font-size: 8px; font-weight: 600; }
        .alt-bar__line { position: absolute; top: -6px; width: 2px; height: 20px; background: #1D3557; }
        .alt-bar__item { position: absolute; top: 0; transform: translateX(-50%); display: grid; justify-items: center; gap: 4px; }
        .alt-bar__dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.15); }
        .alt-bar__item span { font-size: 9px; font-weight: 600; white-space: nowrap; background: #fff; padding: 2px 6px; border: 1px solid rgba(29,53,87,0.1); }

        .blog-choose-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
        .blog-choose-card { padding: 20px; border: 1px solid rgba(29,53,87,0.1); background: #fff; position: relative; }
        .blog-choose-card__num { position: absolute; top: 14px; right: 14px; font-family: var(--display); font-size: 32px; color: rgba(29,53,87,0.08); line-height: 1; }
        .blog-choose-card h4 { font-size: 14px; margin-bottom: 8px; padding-right: 40px; }
        .blog-choose-card p { font-size: 13px; color: #457B9D; line-height: 1.6; }
        .blog-choose-card__stats { display: grid; gap: 6px; margin-top: 12px; }
        .blog-choose-card__stats span { font-size: 12px; padding: 6px 10px; background: #F6F8F5; border-left: 2px solid #E63946; }
        .blog-choose-card--accent { background: #1D3557; color: #fff; }
        .blog-choose-card--accent h4 { color: #fff; }
        .blog-choose-card--accent p { color: rgba(255,255,255,0.7); }
        .blog-choose-card--accent button { margin-top: 14px; display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: #E63946; color: #fff; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }

        .trek-detail { padding: 36px 0 60px; border-bottom: 1px solid rgba(29,53,87,0.08); }
        .trek-detail:last-child { border: 0; }
        .trek-detail__header { display: flex; gap: 18px; align-items: flex-start; margin-bottom: 18px; }
        .trek-detail__number { font-family: var(--display); font-size: 56px; line-height: 0.9; color: rgba(29,53,87,0.12); }
        .trek-detail__badge { display: inline-block; padding: 4px 10px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
        .trek-detail__header h3 { font-family: var(--display); font-size: clamp(26px, 3vw, 36px); line-height: 0.95; font-weight: 400; }
        .trek-detail__header p { font-size: 13px; color: #457B9D; margin-top: 4px; }
        .trek-detail__media { position: relative; aspect-ratio: 16/9; overflow: hidden; background: #F6F8F5; margin-bottom: 16px; }
        .trek-detail__media img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.8s; }
        .trek-detail__media:hover img { transform: scale(1.03); }
        .trek-detail__media-meta { position: absolute; bottom: 12px; left: 12px; right: 12px; display: flex; gap: 8px; flex-wrap: wrap; }
        .trek-detail__media-meta span { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; background: rgba(255,255,255,0.92); backdrop-filter: blur(6px); font-size: 11px; font-weight: 500; }
        .trek-detail__overview { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1px; background: rgba(29,53,87,0.08); border: 1px solid rgba(29,53,87,0.08); margin-bottom: 18px; }
        .trek-stat { background: #fff; padding: 12px; display: grid; gap: 4px; text-align: center; }
        .trek-stat small { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: #457B9D; }
        .trek-stat strong { font-size: 12px; }
        .trek-detail__body { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 24px; }
        .trek-detail__col { display: grid; gap: 16px; align-content: start; }
        .trek-detail__col h4 { font-size: 14px; display: flex; align-items: center; gap: 8px; }
        .trek-exp { display: grid; gap: 16px; }
        .trek-exp strong { font-size: 12px; display: block; margin-bottom: 6px; }
        .trek-exp ul { display: grid; gap: 6px; }
        .trek-exp li { display: flex; gap: 8px; font-size: 13px; align-items: center; }
        .trek-magic { display: grid; grid-template-columns: 32px 1fr; gap: 10px; padding: 14px; background: #F1FAEE; border-left: 3px solid #A8DADC; }
        .trek-magic strong { font-size: 12px; display: block; margin-bottom: 4px; }
        .trek-magic p { font-size: 12px; color: #2A4A3A; line-height: 1.5; }
        .trek-challenge { display: grid; grid-template-columns: 36px 1fr; gap: 10px; padding: 14px; background: #FFF5F5; border: 1px solid #FFD6D6; }
        .trek-challenge strong { font-size: 12px; color: #8B0000; display: block; margin-bottom: 4px; }
        .trek-challenge p { font-size: 12px; line-height: 1.5; }
        .trek-highlights { padding: 14px; border: 1px solid rgba(29,53,87,0.08); background: #fff; }
        .trek-highlights h5 { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 10px; }
        .trek-highlights__grid { display: flex; flex-wrap: wrap; gap: 6px; }
        .trek-highlights__grid span { display: inline-flex; align-items: center; gap: 6px; padding: 5px 8px; background: #F6F8F5; font-size: 11px; }
        .trek-cta { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 18px; background: #1D3557; color: #fff; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 4px; }
        .trek-cta:hover { background: #E63946; }

        .blog-water { display: grid; grid-template-columns: 48px 1fr; gap: 16px; padding: 20px; background: #F1FAEE; border: 1px solid #A8DADC; margin-top: 20px; }
        .blog-water h4 { font-size: 14px; margin-bottom: 8px; }
        .blog-water p { font-size: 13px; line-height: 1.6; color: #2A4A3A; }
        .blog-water__options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .blog-water__options span { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; background: #fff; border: 1px solid rgba(29,53,87,0.1); font-size: 11px; }

        .blog-altitude-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
        .blog-alt-card { padding: 20px; border: 1px solid rgba(29,53,87,0.1); background: #fff; }
        .blog-alt-card h4 { font-size: 14px; margin: 10px 0; }
        .blog-alt-card ul { display: grid; gap: 8px; margin-top: 10px; }
        .blog-alt-card li { font-size: 13px; padding-left: 14px; position: relative; }
        .blog-alt-card li::before { content: ''; position: absolute; left: 0; top: 8px; width: 6px; height: 6px; border-radius: 50%; background: #A8DADC; }
        .blog-alt-card p { font-size: 13px; line-height: 1.6; color: #457B9D; }
        .blog-alt-card--alert { background: #FFF5F5; border-color: #FFD6D6; }
        .blog-alt-card__action { margin-top: 12px; display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; background: #1D3557; color: #fff; font-size: 11px; font-weight: 600; }

        .blog-budget-controls { display: flex; gap: 12px; }
        .blog-budget-controls label { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid rgba(29,53,87,0.15); background: #fff; font-size: 12px; }
        .blog-budget-controls input { width: 50px; border: 0; border-bottom: 1px solid #1D3557; text-align: center; font-weight: 600; }
        .blog-table--budget { min-width: 500px; }
        .blog-calc { margin-top: 24px; padding: 22px; background: #1D3557; color: #fff; }
        .blog-calc h4 { display: flex; align-items: center; gap: 10px; font-size: 14px; margin-bottom: 8px; }
        .blog-calc p { color: rgba(255,255,255,0.7); font-size: 13px; }
        .blog-calc__grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1px; background: rgba(255,255,255,0.12); margin: 16px 0; }
        .blog-calc__grid div { background: rgba(255,255,255,0.06); padding: 14px; text-align: center; display: grid; gap: 4px; }
        .blog-calc__grid small { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.5); }
        .blog-calc__grid strong { font-size: 18px; }
        .blog-calc__grid div.total { background: #E63946; }
        .blog-calc__grid div.total span { font-size: 10px; color: rgba(255,255,255,0.8); }
        .blog-calc__note { display: flex; align-items: center; gap: 8px; font-size: 11px !important; }

        .blog-packing-intro { display: grid; grid-template-columns: 200px 1fr; gap: 20px; padding: 18px; background: #F6F8F5; border: 1px solid rgba(29,53,87,0.08); margin-bottom: 20px; }
        .blog-packing-intro img { width: 100%; aspect-ratio: 1; object-fit: cover; }
        .blog-packing-intro p { font-size: 14px; line-height: 1.6; }
        .blog-packing-progress { margin-top: 16px; }
        .blog-packing-progress span { font-size: 11px; font-weight: 600; }
        .blog-packing-progress .bar { height: 6px; background: #e5e7eb; margin-top: 6px; border-radius: 3px; overflow: hidden; }
        .blog-packing-progress .bar i { display: block; height: 100%; background: #E63946; transition: width 0.3s; }
        .blog-packing-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .blog-pack-cat { border: 1px solid rgba(29,53,87,0.08); background: #fff; padding: 16px; }
        .blog-pack-cat h4 { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid rgba(29,53,87,0.08); }
        .blog-pack-cat ul { display: grid; gap: 8px; }
        .blog-pack-cat li { font-size: 13px; }
        .blog-pack-cat li button { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: transparent; padding: 4px 0; }
        .blog-pack-cat li.is-checked button { color: #457B9D; text-decoration: line-through; }
        .blog-pack-cat .check { width: 18px; height: 18px; border: 1px solid rgba(29,53,87,0.2); display: grid; place-items: center; flex: none; background: #fff; }
        .blog-pack-cat li.is-checked .check { background: #1D3557; color: #fff; border-color: #1D3557; }

        .blog-time-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 20px; }
        .blog-time-card { padding: 18px; border: 1px solid rgba(29,53,87,0.1); background: #fff; display: grid; gap: 12px; }
        .blog-time-card__head { display: flex; gap: 12px; align-items: center; }
        .blog-time-card__head strong { display: block; font-size: 14px; }
        .blog-time-card__head span { font-size: 11px; color: #457B9D; }
        .blog-time-card ul { display: grid; gap: 6px; }
        .blog-time-card li { display: flex; gap: 8px; font-size: 12px; align-items: center; }
        .blog-time-card__badge { display: inline-block; padding: 4px 8px; font-size: 10px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; background: #F1FAEE; color: #2A4A3A; width: max-content; }
        .blog-time-card__badge--alt { background: #A8DADC; color: #1D3557; }
        .blog-time-card--warn { background: #FFF5F5; border-color: #FFD6D6; }
        .blog-time-card__badge--warn { background: #FFD6D6; color: #8B0000; }

        .blog-faq { display: grid; gap: 1px; background: rgba(29,53,87,0.08); border: 1px solid rgba(29,53,87,0.08); margin-top: 20px; }
        .blog-faq__item { background: #fff; }
        .blog-faq__item button { width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 18px; text-align: left; background: transparent; font-size: 15px; font-weight: 500; }
        .blog-faq__item button i { width: 32px; height: 32px; display: grid; place-items: center; border: 1px solid rgba(29,53,87,0.12); border-radius: 50%; flex: none; transition: all 0.2s; }
        .blog-faq__item.is-open button i { background: #1D3557; color: #fff; }
        .blog-faq__answer { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.35s ease; }
        .blog-faq__item.is-open .blog-faq__answer { grid-template-rows: 1fr; }
        .blog-faq__answer p { overflow: hidden; padding: 0 18px 18px; font-size: 14px; line-height: 1.7; color: #457B9D; }

        .blog-conclusion { background: #F6F8F5; padding: 40px; margin-top: 20px; border: 1px solid rgba(29,53,87,0.08); }
        .blog-conclusion__inner h2 { margin-bottom: 16px; }
        .blog-conclusion__cta { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 20px; background: #1D3557; color: #fff; margin-top: 24px; }
        .blog-conclusion__cta h4 { font-size: 16px; margin-bottom: 6px; }
        .blog-conclusion__cta p { font-size: 13px; color: rgba(255,255,255,0.7); }
        .blog-conclusion__cta button { display: inline-flex; align-items: center; gap: 10px; padding: 14px 22px; background: #E63946; color: #fff; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
        .blog-conclusion__trust { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
        .blog-conclusion__trust span { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; padding: 6px 10px; background: #fff; border: 1px solid rgba(29,53,87,0.08); }

        .blog-share { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding-top: 20px; margin-top: 30px; border-top: 1px solid rgba(29,53,87,0.08); flex-wrap: wrap; }
        .blog-share span { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #457B9D; }
        .blog-share div { display: flex; gap: 8px; }
        .blog-share button { padding: 8px 14px; border: 1px solid rgba(29,53,87,0.15); background: #fff; font-size: 11px; font-weight: 600; }

        @media (max-width: 1024px) {
          .blog-layout { grid-template-columns: 1fr; }
          .blog-toc { display: none; }
          .blog-hero__sub { grid-template-columns: 1fr; }
          .blog-grid-2, .blog-icon-grid, .blog-choose-grid, .blog-altitude-grid, .blog-packing-grid, .blog-time-grid { grid-template-columns: 1fr; }
          .blog-icon-grid { grid-template-columns: 1fr 1fr; }
          .trek-detail__body { grid-template-columns: 1fr; }
          .trek-detail__overview { grid-template-columns: repeat(3, 1fr); }
          .blog-packing-intro { grid-template-columns: 1fr; }
          .blog-calc__grid { grid-template-columns: repeat(3, 1fr); }
          .blog-conclusion__cta { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 620px) {
          .blog-header__inner { width: calc(100vw - 24px); height: 56px; }
          .blog-header__meta { display: none; }
          .blog-hero { min-height: 82vh; padding-bottom: 40px; }
          .blog-hero__stats { grid-template-columns: 1fr 1fr; }
          .blog-hero__author { flex-wrap: wrap; }
          .blog-hero__author-badge { margin-left: 0; }
          .blog-hero h1 { font-size: 42px; }
          .blog-layout { padding-top: 40px; gap: 0; width: calc(100vw - 24px); }
          .blog-section { padding-bottom: 60px; margin-bottom: 50px; }
          .blog-section h2 { font-size: 30px; }
          .blog-section--wide { margin-left: 0; margin-right: 0; padding-left: 0; padding-right: 0; }
          .blog-table { min-width: 600px; }
          .blog-icon-grid { grid-template-columns: 1fr; }
          .trek-detail__overview { grid-template-columns: 1fr 1fr; }
          .blog-calc__grid { grid-template-columns: 1fr 1fr; }
          .blog-calc__grid div.total { grid-column: 1 / -1; }
          .blog-budget-controls { flex-direction: column; }
          .blog-conclusion { padding: 20px; }
        }
      `}</style>
    </div>
  )
}
