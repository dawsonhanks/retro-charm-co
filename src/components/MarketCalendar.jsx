const SEASON_START = new Date('2026-05-26')
const SEASON_END = new Date('2026-09-29')
const SKIP_DATES = ['2026-08-26', '2026-09-02']

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function isMarketDay(date) {
  const iso = date.toISOString().slice(0, 10)
  if (SKIP_DATES.includes(iso)) return false
  if (date < SEASON_START || date > SEASON_END) return false
  return date.getDay() === 2
}

function getDisplayMonth() {
  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()

  const inSeason =
    (year > 2026 || (year === 2026 && month >= 4)) &&
    (year < 2026 || (year === 2026 && month <= 8))

  if (inSeason) {
    return { year, monthIndex: month }
  }
  return { year: 2026, monthIndex: 4 }
}

function classifyDay(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const d = new Date(date)
  d.setHours(0, 0, 0, 0)

  const isToday = d.getTime() === today.getTime()
  const isPast = d < today
  const iso = d.toISOString().slice(0, 10)

  if (SKIP_DATES.includes(iso)) {
    return { kind: 'skipped', isToday }
  }
  if (isMarketDay(d)) {
    return { kind: isPast ? 'past-market' : 'market', isToday }
  }
  return { kind: 'normal', isToday }
}

function buildMonthCells(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const startWeekday = firstDay.getDay()

  const cells = []
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ kind: 'empty' })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day)
    date.setHours(0, 0, 0, 0)
    const { kind, isToday } = classifyDay(date)
    cells.push({ kind, isToday, day })
  }
  return cells
}

function DayCell({ cell }) {
  if (cell.kind === 'empty') {
    return <div className="h-9 w-9" aria-hidden="true" />
  }

  let cellClass =
    'flex h-9 w-9 items-center justify-center rounded-full text-xs leading-none'

  switch (cell.kind) {
    case 'market':
      cellClass += ' bg-jscolors-navy font-bold text-jscolors-cream'
      break
    case 'past-market':
      cellClass += ' bg-jscolors-navy/25 text-jscolors-navy/50'
      break
    case 'skipped':
      cellClass += ' text-jscolors-charcoal/30 line-through'
      break
    default:
      cellClass += ' text-jscolors-charcoal/70'
  }

  if (cell.isToday) {
    cellClass += ' ring-2 ring-jscolors-pink'
  }

  return <div className={cellClass}>{cell.day}</div>
}

export function MarketCalendar() {
  const { year, monthIndex } = getDisplayMonth()
  const cells = buildMonthCells(year, monthIndex)
  const monthLabel = new Date(year, monthIndex, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="retro-card p-4">
      <h3 className="font-display font-bold text-jscolors-navy">{monthLabel}</h3>
      <div className="mt-3 grid grid-cols-7 justify-items-center gap-y-1">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={`${label}-${i}`} className="text-xs text-jscolors-charcoal/50">
            {label}
          </span>
        ))}
        {cells.map((cell, i) => (
          <DayCell key={i} cell={cell} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-jscolors-charcoal/60">
        <li className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-jscolors-navy" aria-hidden="true" />
          Market day
        </li>
        <li className="line-through">No market</li>
      </ul>
    </div>
  )
}
