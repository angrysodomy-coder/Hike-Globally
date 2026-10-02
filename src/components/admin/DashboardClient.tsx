'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type RecentInquiry = {
  id: number | string
  name: string
  email: string
  tripTitle: string | null
  status: string
  createdAt: string
}

export type UpcomingDeparture = {
  id: string
  tripTitle: string
  tripSlug: string
  startDate: string
  endDate: string
  seatsTotal: number | null
  seatsBooked: number | null
  status: string | null
  price: number | null
  currency: string
}

export type DashboardData = {
  userName: string
  now: string
  series: number[]
  seriesDates: string[]
  inquiries30: number
  inquiriesPrev30: number
  statusCounts: Record<string, number>
  totalInquiries: number
  publishedTrips: number
  draftTrips: number
  publishedPosts: number
  draftPosts: number
  destinations: number
  mediaCount: number
  testimonials: number
  recentInquiries: RecentInquiry[]
  upcomingDepartures: UpcomingDeparture[]
  upcomingCount: number
  seatsBooked: number
  dbError: boolean
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const DAY = 86_400_000

const numberFormat = new Intl.NumberFormat('en-US')

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** requestAnimationFrame count-up with an expo-out ease. */
function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(target)

  useEffect(() => {
    if (prefersReducedMotion() || target <= 0) return
    let raf = 0
    const start = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p)
      setValue(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

/** Sets a flag after mount — used to trigger CSS transitions from a resting state. */
function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

/** Hydration-safe relative time (computed only after mount). */
function RelativeTime({ iso, now }: { iso: string; now: string }) {
  const [label, setLabel] = useState('')
  useEffect(() => {
    const then = new Date(iso).getTime()
    const ref = new Date(now).getTime()
    const diff = Math.max(0, ref - then)
    const minutes = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days = Math.floor(diff / DAY)
    if (minutes < 1) setLabel('just now')
    else if (minutes < 60) setLabel(`${minutes}m ago`)
    else if (hours < 24) setLabel(`${hours}h ago`)
    else if (days < 30) setLabel(`${days}d ago`)
    else setLabel(new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }, [iso, now])
  return <time dateTime={iso}>{label || '—'}</time>
}

/* -------------------------------------------------------------------------- */
/*  Icons (lucide-style, stroke-based)                                        */
/* -------------------------------------------------------------------------- */

type IconProps = { className?: string }

const Icon = ({ className, children }: IconProps & { children: React.ReactNode }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

const IconInbox = (p: IconProps) => (
  <Icon {...p}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </Icon>
)

const IconCompass = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
  </Icon>
)

const IconMountain = (p: IconProps) => (
  <Icon {...p}>
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    <path d="M4.14 15.08c2.33-2.16 4.42-3.24 6.27-3.24 1.85 0 3.94 1.08 6.27 3.24" />
  </Icon>
)

const IconCalendar = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 2v4M16 2v4" />
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M3 10h18" />
  </Icon>
)

const IconPen = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </Icon>
)

const ImageIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
  </Icon>
)

const IconPin = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </Icon>
)

const IconExternal = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
  </Icon>
)

const IconArrow = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </Icon>
)

const IconTrendUp = (p: IconProps) => (
  <Icon {...p}>
    <path d="m22 7-8.5 8.5-5-5L2 17" />
    <path d="M16 7h6v6" />
  </Icon>
)

const IconTrendDown = (p: IconProps) => (
  <Icon {...p}>
    <path d="m22 17-8.5-8.5-5 5L2 7" />
    <path d="M16 17h6v-6" />
  </Icon>
)

const IconSparkle = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
)

/* -------------------------------------------------------------------------- */
/*  Sparkline                                                                 */
/* -------------------------------------------------------------------------- */

const Sparkline = ({ data, id }: { data: number[]; id: string }) => {
  const W = 120
  const H = 36
  const max = Math.max(1, ...data)
  const pts = data.map((v, i) => [
    (i / Math.max(1, data.length - 1)) * W,
    H - 3 - (v / max) * (H - 8),
  ])
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L ${W} ${H} L 0 ${H} Z`

  return (
    <svg className="hgd-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={`hgd-spark-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--hg-clay-bright)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--hg-clay-bright)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="hgd-spark__area" d={area} fill={`url(#hgd-spark-fill-${id})`} />
      <path
        className="hgd-spark__line"
        d={line}
        fill="none"
        stroke="var(--hg-clay)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*  Area chart — inquiry flow, last 30 days                                   */
/* -------------------------------------------------------------------------- */

/** Catmull-Rom → cubic bezier smoothing. */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

const niceCeil = (n: number): number => {
  const steps = [1, 2, 4, 5, 8, 10]
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(1, n))))
  for (const s of steps) if (n <= s * pow) return s * pow
  return 10 * pow
}

const AreaChart = ({ series, dates }: { series: number[]; dates: string[] }) => {
  const W = 760
  const H = 250
  const PAD = { t: 16, r: 12, b: 30, l: 34 }
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)

  const max = niceCeil(Math.max(4, ...series) * 1.15)
  const n = series.length
  const pts = useMemo(
    () =>
      series.map((v, i) => ({
        x: PAD.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - PAD.l - PAD.r)),
        y: PAD.t + (1 - v / max) * (H - PAD.t - PAD.b),
        v,
      })),
    [series, max, n],
  )

  const line = smoothPath(pts)
  const area =
    pts.length > 0
      ? `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${H - PAD.b} L ${pts[0].x.toFixed(1)} ${H - PAD.b} Z`
      : ''

  const gridYs = [0, 0.5, 1].map((f) => PAD.t + f * (H - PAD.t - PAD.b))
  const gridVals = [max, Math.round(max / 2), 0]

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || n === 0) return
    const px = ((e.clientX - rect.left) / rect.width) * W
    const ratio = (px - PAD.l) / (W - PAD.l - PAD.r)
    const idx = Math.max(0, Math.min(n - 1, Math.round(ratio * (n - 1))))
    setHover(idx)
  }

  const active = hover != null ? pts[hover] : null
  const hoverDate =
    hover != null && dates[hover]
      ? new Date(dates[hover]).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      : ''

  return (
    <div className="hgd-chart">
      <svg
        ref={svgRef}
        className="hgd-chart__svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Booking inquiries per day over the last 30 days"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="hgd-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--hg-clay-bright)" stopOpacity="0.32" />
            <stop offset="60%" stopColor="var(--hg-clay)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--hg-clay)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hgd-chart-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--hg-clay)" />
            <stop offset="100%" stopColor="var(--hg-clay-bright)" />
          </linearGradient>
        </defs>

        {gridYs.map((y, i) => (
          <g key={y}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} className="hgd-chart__grid" />
            <text x={PAD.l - 8} y={y + 4} className="hgd-chart__axis" textAnchor="end">
              {gridVals[i]}
            </text>
          </g>
        ))}

        {pts.map((p, i) =>
          i % 6 === 0 || i === n - 1 ? (
            <text
              key={i}
              x={p.x}
              y={H - 8}
              className="hgd-chart__axis"
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
            >
              {dates[i]
                ? new Date(dates[i]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : ''}
            </text>
          ) : null,
        )}

        <path className="hgd-chart__area" d={area} fill="url(#hgd-chart-fill)" />
        <path
          className="hgd-chart__line"
          d={line}
          fill="none"
          stroke="url(#hgd-chart-stroke)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
        />

        {active != null && hover != null ? (
          <g className="hgd-chart__hover">
            <line
              x1={active.x}
              x2={active.x}
              y1={PAD.t - 6}
              y2={H - PAD.b}
              className="hgd-chart__crosshair"
            />
            <circle cx={active.x} cy={active.y} r="9" className="hgd-chart__halo" />
            <circle cx={active.x} cy={active.y} r="4.5" className="hgd-chart__dot" />
          </g>
        ) : null}
      </svg>

      {active != null && hover != null ? (
        <div
          className="hgd-chart__tooltip"
          style={{
            left: `${(active.x / W) * 100}%`,
            top: `${(active.y / H) * 100 - 14}px`,
          }}
        >
          <span className="hgd-chart__tooltip-date">{hoverDate}</span>
          <span className="hgd-chart__tooltip-value">
            {series[hover]} {series[hover] === 1 ? 'inquiry' : 'inquiries'}
          </span>
        </div>
      ) : (
        <div className="hgd-chart__hint">Hover the chart</div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  KPI card                                                                  */
/* -------------------------------------------------------------------------- */

type KpiProps = {
  icon: React.ReactNode
  label: string
  value: number
  suffix?: string
  badge?: React.ReactNode
  spark?: number[]
  sparkId?: string
  delay: number
}

const KpiCard = ({ icon, label, value, suffix, badge, spark, sparkId, delay }: KpiProps) => {
  const animated = useCountUp(value)
  return (
    <article className="hgd-kpi" style={{ '--hgd-delay': `${delay}ms` } as React.CSSProperties}>
      <div className="hgd-kpi__glow" aria-hidden="true" />
      <header className="hgd-kpi__head">
        <span className="hgd-kpi__icon">{icon}</span>
        <span className="hgd-kpi__label">{label}</span>
      </header>
      <div className="hgd-kpi__row">
        <span className="hgd-kpi__value">
          {numberFormat.format(animated)}
          {suffix ?? ''}
        </span>
        {badge}
      </div>
      {spark && spark.length > 1 ? <Sparkline data={spark} id={sparkId ?? 'kpi'} /> : null}
      {badge && !spark ? <div className="hgd-kpi__foot" /> : null}
    </article>
  )
}

const DeltaBadge = ({ current, previous }: { current: number; previous: number }) => {
  if (previous === 0 && current === 0) {
    return (
      <span className="hgd-badge hgd-badge--flat">
        <IconSparkle className="hgd-badge__icon" /> No data yet
      </span>
    )
  }
  if (previous === 0) {
    return (
      <span className="hgd-badge hgd-badge--up">
        <IconTrendUp className="hgd-badge__icon" /> New
      </span>
    )
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct >= 0
  return (
    <span className={`hgd-badge ${up ? 'hgd-badge--up' : 'hgd-badge--down'}`}>
      {up ? <IconTrendUp className="hgd-badge__icon" /> : <IconTrendDown className="hgd-badge__icon" />}
      {up ? '+' : ''}
      {pct}% <span className="hgd-badge__ref">vs prev 30d</span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Pipeline                                                                  */
/* -------------------------------------------------------------------------- */

const PIPELINE: Array<{ key: string; label: string }> = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'converted', label: 'Converted' },
  { key: 'closed', label: 'Closed' },
]

const Pipeline = ({ statusCounts }: { statusCounts: Record<string, number> }) => {
  const mounted = useMounted()
  const max = Math.max(1, ...PIPELINE.map((s) => statusCounts[s.key] ?? 0))
  return (
    <div className="hgd-pipeline">
      {PIPELINE.map((s, i) => {
        const count = statusCounts[s.key] ?? 0
        return (
          <a
            key={s.key}
            className="hgd-pipeline__row"
            href={`/admin/collections/inquiries?where%5Bstatus%5D%5Bequals%5D=${s.key}`}
            style={{ '--hgd-delay': `${300 + i * 90}ms` } as React.CSSProperties}
          >
            <span className="hgd-pipeline__label">{s.label}</span>
            <span className="hgd-pipeline__track">
              <span
                className={`hgd-pipeline__fill hgd-pipeline__fill--${s.key}`}
                style={{ width: mounted ? `${(count / max) * 100}%` : '0%' }}
              />
            </span>
            <span className="hgd-pipeline__count">{numberFormat.format(count)}</span>
          </a>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Recent inquiries                                                          */
/* -------------------------------------------------------------------------- */

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  converted: 'Converted',
  closed: 'Closed',
}

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || '?'

/** Deterministic hue (teal→blue→violet band only) from a name. */
const avatarHue = (name: string): number => {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return 150 + (h % 130) // 150–280: teal → cyan → blue → violet band
}

const RecentInquiries = ({
  inquiries,
  now,
}: {
  inquiries: RecentInquiry[]
  now: string
}) => (
  <ul className="hgd-feed">
    {inquiries.map((q, i) => (
      <li key={q.id} style={{ '--hgd-delay': `${340 + i * 70}ms` } as React.CSSProperties}>
        <a className="hgd-feed__item" href={`/admin/collections/inquiries/${q.id}`}>
          <span
            className="hgd-feed__avatar"
            style={{ '--hgd-avatar-hue': avatarHue(q.name) } as React.CSSProperties}
          >
            {initialsOf(q.name)}
          </span>
          <span className="hgd-feed__body">
            <span className="hgd-feed__name">{q.name}</span>
            <span className="hgd-feed__meta">
              {q.tripTitle ?? 'General enquiry'}
            </span>
          </span>
          <span className="hgd-feed__side">
            <span className={`hgd-pill hgd-pill--${q.status}`}>
              {STATUS_LABELS[q.status] ?? q.status}
            </span>
            <span className="hgd-feed__time">
              <RelativeTime iso={q.createdAt} now={now} />
            </span>
          </span>
        </a>
      </li>
    ))}
  </ul>
)

/* -------------------------------------------------------------------------- */
/*  Upcoming departures                                                       */
/* -------------------------------------------------------------------------- */

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const fmtMoney = (v: number | null, currency: string): string => {
  if (v == null) return ''
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(v)
  } catch {
    return `${currency} ${v}`
  }
}

const UpcomingDepartures = ({ departures }: { departures: UpcomingDeparture[] }) => {
  const mounted = useMounted()
  if (departures.length === 0) {
    return (
      <p className="hgd-empty">
        No departures scheduled yet — add dates to a journey to see them here.
      </p>
    )
  }
  return (
    <ul className="hgd-deps">
      {departures.map((d, i) => {
        const total = d.seatsTotal ?? 0
        const booked = d.seatsBooked ?? 0
        const pct = total > 0 ? Math.min(100, (booked / total) * 100) : 0
        const status = d.status ?? 'available'
        return (
          <li key={d.id} style={{ '--hgd-delay': `${380 + i * 70}ms` } as React.CSSProperties}>
            <a className="hgd-deps__item" href={`/admin/collections/trips/${d.tripSlug}`}>
              <span className="hgd-deps__dates">
                {fmtDate(d.startDate)}
                <span className="hgd-deps__arrow">→</span>
                {fmtDate(d.endDate)}
              </span>
              <span className="hgd-deps__title">{d.tripTitle}</span>
              <span className="hgd-deps__side">
                <span className={`hgd-chip hgd-chip--${status}`}>{status}</span>
                {d.price != null ? (
                  <span className="hgd-deps__price">{fmtMoney(d.price, d.currency)}</span>
                ) : null}
              </span>
              {total > 0 ? (
                <span className="hgd-deps__seats">
                  <span className="hgd-deps__seats-track">
                    <span
                      className="hgd-deps__seats-fill"
                      style={{ width: mounted ? `${pct}%` : '0%' }}
                      data-hot={pct >= 80 ? 'true' : 'false'}
                    />
                  </span>
                  <span className="hgd-deps__seats-label">
                    {booked}/{total} seats
                  </span>
                </span>
              ) : null}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

/* -------------------------------------------------------------------------- */
/*  Quick actions                                                             */
/* -------------------------------------------------------------------------- */

const QUICK_ACTIONS = [
  { href: '/admin/collections/trips/create', label: 'New journey', hint: 'Trips', icon: <IconMountain className="hgd-qa__icon" /> },
  { href: '/admin/collections/posts/create', label: 'New story', hint: 'Posts', icon: <IconPen className="hgd-qa__icon" /> },
  { href: '/admin/collections/inquiries', label: 'Review inquiries', hint: 'Bookings', icon: <IconInbox className="hgd-qa__icon" /> },
  { href: '/admin/collections/media', label: 'Upload media', hint: 'Media', icon: <ImageIcon className="hgd-qa__icon" /> },
  { href: '/admin/collections/destinations', label: 'Destinations', hint: 'Regions', icon: <IconPin className="hgd-qa__icon" /> },
]

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                 */
/* -------------------------------------------------------------------------- */

export const DashboardClient = ({ data }: { data: DashboardData }) => {
  const mounted = useMounted()
  const hour = useRef<number | null>(null)
  const [greeting, setGreeting] = useState('Welcome back')

  useEffect(() => {
    hour.current = new Date().getHours()
    const h = hour.current
    setGreeting(
      h < 5 ? 'Night owl mode' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening',
    )
  }, [])

  const today = useMemo(
    () =>
      new Date(data.now).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [data.now],
  )

  const firstName = (data.userName || 'friend').split(' ')[0]
  const conversion =
    data.totalInquiries > 0 ? (data.statusCounts.converted ?? 0) / data.totalInquiries : 0

  return (
    <div className="hgd">
      {/* ---------- header ---------- */}
      <header className="hgd__header" style={{ '--hgd-delay': '0ms' } as React.CSSProperties}>
        <div className="hgd__header-text">
          <span className="hgd__eyebrow">Mission control</span>
          <h1 className="hgd__title">
            {greeting}, <span className="hgd__title-accent">{firstName}</span>
          </h1>
          <p className="hgd__date">{today} · everything below is live from the CMS</p>
        </div>
        <div className="hgd__header-actions">
          <a className="hgd__site-link" href="/" target="_blank" rel="noreferrer">
            View site <IconExternal className="hgd__site-link-icon" />
          </a>
        </div>
        <svg className="hgd__ridge" viewBox="0 0 420 120" fill="none" aria-hidden="true">
          <path
            d="M0 96 C60 92 92 58 128 44 C160 32 176 62 198 52 C226 40 244 12 268 18 C300 26 306 58 336 66 C372 76 392 60 420 40"
            stroke="url(#hgd-ridge-gradient)"
            strokeWidth="1.6"
            strokeLinecap="round"
            pathLength={1}
          />
          <defs>
            <linearGradient id="hgd-ridge-gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--hg-clay)" stopOpacity="0" />
              <stop offset="45%" stopColor="var(--hg-clay)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--hg-clay-bright)" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      </header>

      {data.dbError ? (
        <div className="hgd__warning">
          Some metrics could not load — the database may be restarting. The rest of the admin still works.
        </div>
      ) : null}

      {/* ---------- KPI row ---------- */}
      <section className="hgd__kpis">
        <KpiCard
          icon={<IconInbox className="hgd-kpi__svg" />}
          label="Inquiries · 30 days"
          value={data.inquiries30}
          badge={<DeltaBadge current={data.inquiries30} previous={data.inquiriesPrev30} />}
          spark={data.series}
          sparkId="inquiries"
          delay={90}
        />
        <KpiCard
          icon={<IconCompass className="hgd-kpi__svg" />}
          label="Conversion rate"
          value={Math.round(conversion * 100)}
          suffix="%"
          badge={
            <span className="hgd-badge hgd-badge--flat">
              {numberFormat.format(data.statusCounts.converted ?? 0)} converted
            </span>
          }
          delay={180}
        />
        <KpiCard
          icon={<IconMountain className="hgd-kpi__svg" />}
          label="Live journeys"
          value={data.publishedTrips}
          badge={
            data.draftTrips > 0 ? (
              <span className="hgd-badge hgd-badge--gold">{data.draftTrips} in draft</span>
            ) : (
              <span className="hgd-badge hgd-badge--flat">all published</span>
            )
          }
          delay={270}
        />
        <KpiCard
          icon={<IconCalendar className="hgd-kpi__svg" />}
          label="Departures ahead"
          value={data.upcomingCount}
          badge={
            <span className="hgd-badge hgd-badge--flat">
              {numberFormat.format(data.seatsBooked)} seats booked
            </span>
          }
          delay={360}
        />
      </section>

      {/* ---------- main grid ---------- */}
      <div className="hgd__grid">
        <section
          className="hgd-panel hgd-panel--chart"
          style={{ '--hgd-delay': '450ms' } as React.CSSProperties}
        >
          <header className="hgd-panel__head">
            <div>
              <h2 className="hgd-panel__title">Inquiry flow</h2>
              <p className="hgd-panel__sub">Booking inquiries per day · last 30 days</p>
            </div>
            <span className="hgd-panel__total">
              {numberFormat.format(data.inquiries30)} <span>total</span>
            </span>
          </header>
          {data.inquiries30 === 0 && data.inquiriesPrev30 === 0 ? (
            <div className="hgd-chart-empty">
              <IconSparkle className="hgd-chart-empty__icon" />
              <p>No inquiries in the last 30 days.</p>
              <p className="hgd-chart-empty__hint">
                They will appear here the moment a traveller uses the contact form.
              </p>
            </div>
          ) : (
            <AreaChart series={data.series} dates={data.seriesDates} />
          )}
        </section>

        <section
          className="hgd-panel hgd-panel--pipeline"
          style={{ '--hgd-delay': '540ms' } as React.CSSProperties}
        >
          <header className="hgd-panel__head">
            <div>
              <h2 className="hgd-panel__title">Pipeline</h2>
              <p className="hgd-panel__sub">Every inquiry, by stage</p>
            </div>
          </header>
          <Pipeline statusCounts={data.statusCounts} />
          <footer className="hgd-panel__foot">
            <a href="/admin/collections/inquiries" className="hgd-panel__link">
              Open inquiries <IconArrow className="hgd-panel__link-icon" />
            </a>
          </footer>
        </section>

        <section
          className="hgd-panel hgd-panel--feed"
          style={{ '--hgd-delay': '630ms' } as React.CSSProperties}
        >
          <header className="hgd-panel__head">
            <div>
              <h2 className="hgd-panel__title">Latest inquiries</h2>
              <p className="hgd-panel__sub">The newest leads, ready to answer</p>
            </div>
          </header>
          {data.recentInquiries.length === 0 ? (
            <p className="hgd-empty">No inquiries yet — leads from the contact form land here.</p>
          ) : (
            <RecentInquiries inquiries={data.recentInquiries} now={data.now} />
          )}
        </section>

        <section
          className="hgd-panel hgd-panel--deps"
          style={{ '--hgd-delay': '720ms' } as React.CSSProperties}
        >
          <header className="hgd-panel__head">
            <div>
              <h2 className="hgd-panel__title">Next departures</h2>
              <p className="hgd-panel__sub">Upcoming seasons on the trail</p>
            </div>
          </header>
          <UpcomingDepartures departures={data.upcomingDepartures} />
        </section>

        <section
          className="hgd-panel hgd-panel--actions"
          style={{ '--hgd-delay': '810ms' } as React.CSSProperties}
        >
          <header className="hgd-panel__head">
            <div>
              <h2 className="hgd-panel__title">Quick actions</h2>
              <p className="hgd-panel__sub">Jump straight in</p>
            </div>
          </header>
          <nav className="hgd-qa">
            {QUICK_ACTIONS.map((a, i) => (
              <a
                key={a.href}
                className="hgd-qa__item"
                href={a.href}
                style={{ '--hgd-delay': `${840 + i * 60}ms` } as React.CSSProperties}
              >
                {a.icon}
                <span className="hgd-qa__text">
                  <span className="hgd-qa__label">{a.label}</span>
                  <span className="hgd-qa__hint">{a.hint}</span>
                </span>
                <IconArrow className="hgd-qa__arrow" />
              </a>
            ))}
          </nav>
          <footer className="hgd-panel__foot hgd-panel__foot--stats">
            <span className="hgd-stat-chip">{numberFormat.format(data.publishedPosts)} stories</span>
            <span className="hgd-stat-chip">{numberFormat.format(data.destinations)} regions</span>
            <span className="hgd-stat-chip">{numberFormat.format(data.mediaCount)} media</span>
          </footer>
        </section>
      </div>

      <p className="hgd__footnote" style={{ '--hgd-delay': '900ms' } as React.CSSProperties}>
        Hike Globally CMS{mounted ? ' · refreshed just now' : ''}
      </p>
    </div>
  )
}

export default DashboardClient
