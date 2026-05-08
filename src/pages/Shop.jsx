import { Helmet } from 'react-helmet-async'
import { EmailSignup } from '../components/EmailSignup'
import { CountdownTimer } from '../components/CountdownTimer'
import { SparkleRow } from '../components/RetroAccents'
import { readJson, writeJson, STORAGE_KEYS } from '../utils/storage'

/** Placeholder launch date */
const LAUNCH_ISO = '2027-01-01T00:00:00-07:00'

export default function Shop() {
  return (
    <>
      <Helmet>
        <title>Shop Coming Soon | Retro Charm Co 2.0</title>
        <meta
          name="description"
          content="The Retro Charm Co online shop is on its way. Join the waitlist for Italian charm bracelet launches and market pop-ups."
        />
      </Helmet>

      <section className="relative overflow-hidden bg-gradient-to-b from-jscolors-navy to-jscolors-charcoal px-4 py-16 text-jscolors-cream md:py-24">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
          <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-jscolors-pink/30 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-jscolors-gold/25 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <SparkleRow className="mx-auto text-jscolors-gold" />
          <h1 className="mt-8 font-display text-4xl font-bold md:text-5xl">
            Online Shop <span className="text-jscolors-pink">Coming Soon</span>
          </h1>
          <p className="mt-5 text-lg text-jscolors-cream/85">
            We are bottling the booth magic for your couch — charms, bases, and surprise drops are in the works. Until
            then, come build with us live at the market.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-2xl">
          <h2 className="text-center font-display text-lg font-semibold text-jscolors-gold">Countdown to launch preview</h2>
          <p className="mt-2 text-center text-sm text-jscolors-cream/70">
            Placeholder date for styling — swap for your real launch when you are ready.
          </p>
          <div className="mt-6">
            <CountdownTimer targetDate={LAUNCH_ISO} />
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-lg rounded-3xl border-2 border-jscolors-gold/35 bg-white/95 p-8 text-jscolors-navy shadow-xl">
          <h2 className="font-display text-xl font-bold">Join the waitlist</h2>
          <p className="mt-2 text-sm text-jscolors-charcoal/80">
            Name and email — we will only nudge you when the shop opens or when limited charms arrive.
          </p>
          <EmailSignup
            className="mt-6"
            source="shop-waitlist"
            showName
            buttonLabel="Notify me"
            theme="on-light"
            successMessage="You're on the list! We'll let you know when we launch."
            onSuccess={(entry) => {
              const list = readJson(STORAGE_KEYS.shopWaitlist, [])
              list.push({ ...entry, kind: 'shop_waitlist', at: new Date().toISOString() })
              writeJson(STORAGE_KEYS.shopWaitlist, list)
            }}
          />
        </div>
      </section>
    </>
  )
}
