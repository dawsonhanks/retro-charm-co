import { MarketCalendar } from './MarketCalendar'

const SEASON_START = new Date('2026-05-26')
const SEASON_END = new Date('2026-09-29')
const SKIP_DATES = ['2026-08-26', '2026-09-02']

function isMarketDay(date) {
  const iso = date.toISOString().slice(0, 10)
  if (SKIP_DATES.includes(iso)) return false
  if (date < SEASON_START || date > SEASON_END) return false
  return date.getDay() === 3
}

function getNextMarketDate() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (today > SEASON_END) return null

  if (isMarketDay(today)) {
    return { date: today, isToday: true }
  }

  const d = new Date(today)
  const day = d.getDay()
  const daysUntilWednesday = (3 - day + 7) % 7 || 7
  d.setDate(d.getDate() + daysUntilWednesday)

  while (true) {
    const iso = d.toISOString().slice(0, 10)
    if (!SKIP_DATES.includes(iso)) break
    d.setDate(d.getDate() + 7)
  }

  if (d > SEASON_END) return null
  return { date: d, isToday: false }
}

function getDaysAway(from, to) {
  const ms = to.getTime() - from.getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function MarketSidebar({ location, onAddToCalendar }) {
  const next = getNextMarketDate()

  const formattedDate = next
    ? next.date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : null

  let daysLabel = null
  if (next) {
    if (next.isToday) {
      daysLabel = 'Today!'
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const away = getDaysAway(today, next.date)
      daysLabel = away === 1 ? '1 day away' : `${away} days away`
    }
  }

  return (
    <div className="space-y-6">
      <MarketCalendar />

      <div className="retro-card p-4">
        <h3 className="font-display font-semibold text-jscolors-ink">Next market</h3>
        {next ? (
          <div className="mt-3">
            <p className="font-semibold text-jscolors-ink">{formattedDate}</p>
            <span className="mt-2 inline-block rounded-full bg-jscolors-pink/35 px-3 py-1 text-xs font-semibold text-jscolors-ink">
              {daysLabel}
            </span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-jscolors-ink/75">See you next season!</p>
        )}
      </div>

      <div className="retro-card space-y-2 p-4 text-sm text-jscolors-ink/85">
        <p>
          <span className="font-semibold text-jscolors-ink">Hours:</span> 5–9 PM
        </p>
        <p>
          <span className="font-semibold text-jscolors-ink">Location:</span> Sunset Farmers Market, Orem
        </p>
        <p>
          <span className="font-semibold text-jscolors-ink">Address:</span> 293 E Center St, Orem, UT 84058
        </p>
      </div>

      <div className="retro-card p-4">
        <h3 className="font-display font-semibold text-jscolors-ink">What to know before you come</h3>
        <ul className="mt-3 space-y-2 text-sm text-jscolors-ink/85">
          <li>💳 We take cash, card, and Venmo</li>
          <li>🚫 No reservation needed — just show up</li>
          <li>📐 One size fits all — we adjust at the booth</li>
          <li>✨ Charms don&apos;t tarnish — wear them every day</li>
        </ul>
        {onAddToCalendar && (
          <button
            type="button"
            onClick={onAddToCalendar}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full border-2 border-jscolors-gold bg-white px-5 py-2.5 text-sm font-semibold text-jscolors-ink shadow-sm transition hover:bg-jscolors-gold hover:text-jscolors-ink"
          >
            Add market days to calendar
          </button>
        )}
      </div>
    </div>
  )
}
