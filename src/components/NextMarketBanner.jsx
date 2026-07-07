import { useState } from 'react'

const SKIP_DATES = ['2026-08-26', '2026-09-02']
const SEASON_END = new Date('2026-09-29T23:59:59')

function getNextMarketDate() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (today > SEASON_END) return null

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
  return d
}

export function NextMarketBanner() {
  const [dismissed, setDismissed] = useState(false)
  const nextDate = getNextMarketDate()

  if (dismissed || !nextDate) return null

  const formattedDate = nextDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div
      className="sticky top-14 z-40 border-b border-jscolors-gold/30 bg-jscolors-navy text-jscolors-cream md:top-[4.25rem]"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3 px-4 py-2.5 sm:items-center">
        <p className="text-sm leading-snug">
          <span className="font-medium">📍 Next market: {formattedDate}</span>
          <span className="hidden sm:inline"> · Sunset Farmers Market, Orem · 5–9 PM</span>
          <span className="mt-0.5 block text-jscolors-cream/90 sm:hidden">Sunset Farmers Market, Orem · 5–9 PM</span>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-1 text-lg leading-none text-jscolors-cream/70 transition hover:bg-jscolors-cream/10 hover:text-jscolors-cream"
          aria-label="Dismiss market banner"
        >
          ×
        </button>
      </div>
    </div>
  )
}
