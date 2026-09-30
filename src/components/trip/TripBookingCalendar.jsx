import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Mail,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react'
import { buildDepartures, COUNTRIES, isoDate } from '../../data/tripPageContent'

/* ------------------------------------------------------------------
   Booking calendar — one month in view, paginated forward and back.
   Departure dates come from the trip record; each carries a status
   (available / limited / sold out), remaining spots and a price.
   ------------------------------------------------------------------ */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/* Monday-first week, which is how Nepal and most of our travellers read a month. */
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MONTHS_AHEAD = 23

function buildGrid(year, month) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let index = 0; index < offset; index += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function formatLongDate(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${day} ${MONTHS[month - 1]} ${year}`
}

export default function TripBookingCalendar({ trip }) {
  const today = useMemo(() => new Date(), [])
  const departures = useMemo(() => buildDepartures(trip, today), [trip, today])

  const [cursor, setCursor] = useState(0)
  const [selected, setSelected] = useState(() => {
    const next = Object.keys(departures).sort().find((key) => departures[key].status !== 'sold-out')
    return next || null
  })
  const [form, setForm] = useState({ name: '', email: '', country: '', travellers: '2' })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const viewDate = new Date(today.getFullYear(), today.getMonth() + cursor, 1)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const cells = useMemo(() => buildGrid(year, month), [year, month])

  const monthDepartures = Object.values(departures).filter((entry) => {
    const [entryYear, entryMonth] = entry.date.split('-').map(Number)
    return entryYear === year && entryMonth - 1 === month
  })

  const selectedDeparture = selected ? departures[selected] : null

  const jump = (delta) => {
    setCursor((current) => Math.min(MONTHS_AHEAD, Math.max(0, current + delta)))
  }

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setError('')
  }

  const submit = (event) => {
    event.preventDefault()
    if (!selected) {
      setError('Choose a departure date from the calendar above.')
      return
    }
    if (!event.currentTarget.checkValidity()) return
    /* The calendar confirms inline — it deliberately does not open the
       booking drawer on top of the page the traveller is already reading. */
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="tsp-calendar tsp-calendar--done" role="status">
        <span className="tsp-calendar__tick"><Check size={30} aria-hidden="true" /></span>
        <h3>Your place is held for 48 hours.</h3>
        <p>
          Thank you, {form.name.split(' ')[0] || 'traveller'}. We have provisionally reserved
          {selectedDeparture ? ` ${form.travellers} place${form.travellers === '1' ? '' : 's'} on the ${formatLongDate(selectedDeparture.date)} departure` : ' your place'} of
          {' '}{trip.title}. A trip designer in Kathmandu will email <strong>{form.email}</strong> within
          one working day with your invoice, kit list and flight guidance.
        </p>
        <dl className="tsp-calendar__receipt">
          <div><dt>Journey</dt><dd>{trip.title}</dd></div>
          <div><dt>Departure</dt><dd>{selectedDeparture ? formatLongDate(selectedDeparture.date) : 'To be confirmed'}</dd></div>
          <div><dt>Travellers</dt><dd>{form.travellers}</dd></div>
          <div><dt>Deposit due</dt><dd>${Math.round((selectedDeparture?.price || trip.price) * Number(form.travellers) * 0.2).toLocaleString()}</dd></div>
        </dl>
        <button className="tsp-ghostBtn" type="button" onClick={() => setSubmitted(false)}>
          Change these details
        </button>
      </div>
    )
  }

  return (
    <div className="tsp-calendar">
      <div className="tsp-calendar__grid-side">
        <div className="tsp-calendar__head">
          <div>
            <p className="tsp-calendar__month">{MONTHS[month]} <span>{year}</span></p>
            <p className="tsp-calendar__count">
              {monthDepartures.length
                ? `${monthDepartures.length} departure${monthDepartures.length === 1 ? '' : 's'} this month`
                : 'No departures this month'}
            </p>
          </div>
          <div className="tsp-calendar__nav">
            <button
              type="button"
              onClick={() => jump(-1)}
              disabled={cursor === 0}
              aria-label="Previous month"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => jump(1)}
              disabled={cursor === MONTHS_AHEAD}
              aria-label="Next month"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="tsp-calendar__weekdays" aria-hidden="true">
          {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
        </div>

        <div className="tsp-calendar__days" role="group" aria-label={`Departures in ${MONTHS[month]} ${year}`}>
          {cells.map((day, index) => {
            if (!day) return <span key={`pad-${index}`} className="tsp-day tsp-day--pad" aria-hidden="true" />
            const iso = isoDate(year, month, day)
            const departure = departures[iso]
            const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const isToday = iso === isoDate(today.getFullYear(), today.getMonth(), today.getDate())

            if (!departure) {
              return (
                <span
                  key={iso}
                  className={`tsp-day tsp-day--empty ${isPast ? 'is-past' : ''} ${isToday ? 'is-today' : ''}`}
                >
                  {day}
                </span>
              )
            }

            const soldOut = departure.status === 'sold-out'
            return (
              <button
                key={iso}
                type="button"
                className={`tsp-day tsp-day--departure is-${departure.status} ${selected === iso ? 'is-selected' : ''}`}
                onClick={() => { setSelected(iso); setError('') }}
                disabled={soldOut}
                aria-pressed={selected === iso}
                aria-label={`${day} ${MONTHS[month]} ${year} — ${soldOut ? 'sold out' : `${departure.spots} places left, from $${departure.price}`}`}
              >
                <span className="tsp-day__num">{day}</span>
                <span className="tsp-day__dot" aria-hidden="true" />
                <span className="tsp-day__price">{soldOut ? 'Full' : `$${departure.price.toLocaleString()}`}</span>
              </button>
            )
          })}
        </div>

        <ul className="tsp-calendar__legend">
          <li><i className="is-available" aria-hidden="true" /> Places open</li>
          <li><i className="is-limited" aria-hidden="true" /> Few places left</li>
          <li><i className="is-sold-out" aria-hidden="true" /> Sold out</li>
        </ul>
      </div>

      <form className="tsp-calendar__form" onSubmit={submit}>
        <div className={`tsp-calendar__chosen ${selectedDeparture ? '' : 'is-empty'}`}>
          {selectedDeparture ? (
            <>
              <p className="tsp-calendar__chosen-label">Selected departure</p>
              <p className="tsp-calendar__chosen-date">{formatLongDate(selectedDeparture.date)}</p>
              <p className="tsp-calendar__chosen-meta">
                <span>{trip.duration}</span>
                <span>
                  {selectedDeparture.guaranteed ? 'Guaranteed departure' : `${selectedDeparture.spots} places left`}
                </span>
                <span>${selectedDeparture.price.toLocaleString()} pp</span>
              </p>
            </>
          ) : (
            <p className="tsp-calendar__chosen-label">Pick a date from the calendar to continue.</p>
          )}
        </div>

        <div className="tsp-field">
          <label htmlFor="tsp-name">Full name</label>
          <div className="tsp-field__control">
            <User size={17} aria-hidden="true" />
            <input
              id="tsp-name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Sonam Lama"
              value={form.name}
              onChange={update('name')}
            />
          </div>
        </div>

        <div className="tsp-field">
          <label htmlFor="tsp-email">Email address</label>
          <div className="tsp-field__control">
            <Mail size={17} aria-hidden="true" />
            <input
              id="tsp-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
            />
          </div>
        </div>

        <div className="tsp-field__row">
          <div className="tsp-field">
            <label htmlFor="tsp-country">Country</label>
            <div className="tsp-field__control">
              <Globe2 size={17} aria-hidden="true" />
              <select id="tsp-country" name="country" required value={form.country} onChange={update('country')}>
                <option value="" disabled>Select country</option>
                {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
              </select>
            </div>
          </div>

          <div className="tsp-field">
            <label htmlFor="tsp-travellers">Travellers</label>
            <div className="tsp-field__control">
              <Users size={17} aria-hidden="true" />
              <select id="tsp-travellers" name="travellers" value={form.travellers} onChange={update('travellers')}>
                {['1', '2', '3', '4', '5', '6', '7', '8'].map((count) => (
                  <option key={count} value={count}>{count} {count === '1' ? 'traveller' : 'travellers'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <p className="tsp-calendar__error" role="alert">{error}</p>}

        <button className="tsp-bookBtn" type="submit">
          <span className="tsp-bookBtn__shine" aria-hidden="true" />
          <span className="tsp-bookBtn__label">
            Book now
            {selectedDeparture && (
              <small>
                ${Math.round(selectedDeparture.price * Number(form.travellers)).toLocaleString()} total ·
                {' '}${Math.round(selectedDeparture.price * Number(form.travellers) * 0.2).toLocaleString()} deposit
              </small>
            )}
          </span>
          <ArrowRight size={19} aria-hidden="true" />
        </button>

        <p className="tsp-calendar__assure">
          <ShieldCheck size={15} aria-hidden="true" />
          20% deposit holds your place · Free date changes up to 60 days out · No card details needed today
        </p>
      </form>
    </div>
  )
}
