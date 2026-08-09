import { buildMarketIcs, downloadIcs } from '../utils/calendar'

export function MarketCard({ location }) {
  function handleCalendar() {
    const ics = buildMarketIcs({
      title: location.calendar.title,
      description: location.calendar.description,
      dtStart: location.calendar.dtStart,
      dtEnd: location.calendar.dtEnd,
      rrule: location.calendar.rrule,
      location: location.address,
    })
    downloadIcs(`retro-charm-${location.id}-market.ics`, ics)
  }

  return (
    <article className="retro-card retro-card-hover overflow-hidden">
      <div className="border-b border-jscolors-gold/25 bg-gradient-to-br from-white to-jscolors-cream p-6">
        <h3 className="font-display text-xl font-bold text-jscolors-ink md:text-2xl">{location.name}</h3>
        <p className="mt-2 text-sm font-medium text-jscolors-pink">{location.dayLabel}</p>
        <address className="mt-3 not-italic text-sm leading-relaxed text-jscolors-ink/85">{location.address}</address>
        <dl className="mt-4 grid gap-2 text-sm text-jscolors-ink/85">
          <div className="flex gap-2">
            <dt className="font-semibold text-jscolors-ink">Season</dt>
            <dd>{location.dates}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-jscolors-ink">Hours</dt>
            <dd>{location.hours}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCalendar}
            className="inline-flex items-center justify-center rounded-full border-2 border-jscolors-gold bg-white px-5 py-2.5 text-sm font-semibold text-jscolors-ink shadow-sm transition hover:bg-jscolors-gold hover:text-jscolors-ink"
          >
            Add market days to calendar
          </button>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Get directions to ${location.name} (opens in Google Maps)`}
            className="inline-flex items-center justify-center rounded-full border-2 border-jscolors-blue bg-white px-5 py-2.5 text-sm font-semibold text-jscolors-blue shadow-sm transition hover:bg-jscolors-blue hover:text-jscolors-cream"
          >
            Get directions →
          </a>
        </div>
      </div>
    </article>
  )
}
