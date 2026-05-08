import { buildMarketIcs, downloadIcs } from '../utils/calendar'
import { getMapsEmbedSrc } from '../data/locations'

export function MarketCard({ location }) {
  const src = getMapsEmbedSrc(location.embedQuery || location.address)

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
        <h3 className="font-display text-xl font-bold text-jscolors-navy md:text-2xl">{location.name}</h3>
        <p className="mt-2 text-sm font-medium text-jscolors-pink">{location.dayLabel}</p>
        <address className="mt-3 not-italic text-sm leading-relaxed text-jscolors-charcoal/85">{location.address}</address>
        <dl className="mt-4 grid gap-2 text-sm text-jscolors-charcoal/85">
          <div className="flex gap-2">
            <dt className="font-semibold text-jscolors-navy">Season</dt>
            <dd>{location.dates}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold text-jscolors-navy">Hours</dt>
            <dd>{location.hours}</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={handleCalendar}
          className="mt-5 inline-flex items-center justify-center rounded-full border-2 border-jscolors-gold bg-white px-5 py-2.5 text-sm font-semibold text-jscolors-navy shadow-sm transition hover:bg-jscolors-gold hover:text-jscolors-navy"
        >
          Add market days to calendar
        </button>
      </div>
      <div className="aspect-[16/10] w-full bg-jscolors-charcoal/10">
        <iframe
          title={`Map: ${location.shortName} market`}
          src={src}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </article>
  )
}
