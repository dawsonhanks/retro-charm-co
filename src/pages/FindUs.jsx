import { Helmet } from 'react-helmet-async'
import { MarketCard } from '../components/MarketCard'
import { MarketSidebar } from '../components/MarketSidebar'
import { FAQ } from '../components/FAQ'
import { locations } from '../data/locations'
import { buildMarketIcs, downloadIcs } from '../utils/calendar'

const weeklyRows = [
  { day: 'Wednesdays', note: 'Orem location only', time: '5-9 PM (Oct: 5-8 PM)' },
]

export default function FindUs() {
  const location = locations[0]

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
    <>
      <Helmet>
        <title>Find Us in Orem | RetroCharm Co</title>
        <meta
          name="description"
          content="Find RetroCharm Co at the Sunset Farmers Market in Orem — address, hours, map, and calendar download."
        />
      </Helmet>

      <header className="border-b border-jscolors-gold/25 bg-jscolors-blue px-4 py-14 text-center text-jscolors-cream md:py-20">
        <h1 className="font-display text-4xl font-bold md:text-5xl">Find Us</h1>
        <p className="mx-auto mt-4 max-w-2xl text-jscolors-cream/85">
          We are currently at one location: Sunset Farmers Market in Orem. Hours are generally 5–9 PM; confirm seasonal
          dates on the location card below.
        </p>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="space-y-12 lg:col-span-2">
            <section aria-labelledby="schedule-heading">
              <h2 id="schedule-heading" className="text-center font-display text-2xl font-bold text-jscolors-ink">
                Weekly rhythm
              </h2>
              <div className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-2xl border-2 border-jscolors-gold/30 bg-white shadow-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-jscolors-blue text-jscolors-cream">
                    <tr>
                      <th className="px-4 py-3 font-display">When</th>
                      <th className="px-4 py-3 font-display">Where / notes</th>
                      <th className="px-4 py-3 font-display">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyRows.map((row) => (
                      <tr key={row.day} className="border-t border-jscolors-gold/15">
                        <td className="px-4 py-4 font-semibold text-jscolors-ink">{row.day}</td>
                        <td className="px-4 py-4 text-jscolors-ink/85">{row.note}</td>
                        <td className="px-4 py-4 text-jscolors-ink/85">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section aria-label="Market locations">
              {locations.map((loc) => (
                <MarketCard key={loc.id} location={loc} />
              ))}
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <MarketSidebar location={location} onAddToCalendar={handleCalendar} />
            </div>
          </div>
        </div>
      </div>

      <FAQ />
    </>
  )
}
