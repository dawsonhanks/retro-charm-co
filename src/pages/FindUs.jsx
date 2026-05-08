import { Helmet } from 'react-helmet-async'
import { MarketCard } from '../components/MarketCard'
import { locations } from '../data/locations'

const weeklyRows = [
  { day: 'Tuesday', note: 'Springville (June–Oct)', time: '5–9 PM' },
  { day: 'Weekly evening markets', note: 'Draper, Orem, Lindon (seasonal)', time: '5–9 PM' },
]

export default function FindUs() {
  return (
    <>
      <Helmet>
        <title>Find Us at Utah Markets | Retro Charm Co 2.0</title>
        <meta
          name="description"
          content="Sunset Farmers Market locations in Springville, Draper, Orem, and Lindon — addresses, hours, maps, and calendar downloads."
        />
      </Helmet>

      <header className="border-b border-jscolors-gold/25 bg-jscolors-navy px-4 py-14 text-center text-jscolors-cream md:py-20">
        <h1 className="font-display text-4xl font-bold md:text-5xl">Find Us</h1>
        <p className="mx-auto mt-4 max-w-2xl text-jscolors-cream/85">
          Four Sunset Farmers Market stops across Utah County — same sparkly booth, new parking lot each week. Hours are
          generally 5–9 PM; confirm seasonal dates on location cards below.
        </p>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-12" aria-labelledby="schedule-heading">
        <h2 id="schedule-heading" className="text-center font-display text-2xl font-bold text-jscolors-navy">
          Weekly rhythm
        </h2>
        <div className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-2xl border-2 border-jscolors-gold/30 bg-white shadow-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-jscolors-navy text-jscolors-cream">
              <tr>
                <th className="px-4 py-3 font-display">When</th>
                <th className="px-4 py-3 font-display">Where / notes</th>
                <th className="px-4 py-3 font-display">Hours</th>
              </tr>
            </thead>
            <tbody>
              {weeklyRows.map((row) => (
                <tr key={row.day} className="border-t border-jscolors-gold/15">
                  <td className="px-4 py-4 font-semibold text-jscolors-navy">{row.day}</td>
                  <td className="px-4 py-4 text-jscolors-charcoal/85">{row.note}</td>
                  <td className="px-4 py-4 text-jscolors-charcoal/85">{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-12 px-4 pb-20" aria-label="Market locations">
        {locations.map((loc) => (
          <MarketCard key={loc.id} location={loc} />
        ))}
      </section>
    </>
  )
}
