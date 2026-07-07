import { Helmet } from 'react-helmet-async'
import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HowItWorks } from '../components/HowItWorks'
import { EmailSignup } from '../components/EmailSignup'
import { StarField, SparkleRow, FloatingHearts } from '../components/RetroAccents'
import { instagram } from '../data/social'
import { instagramPosts } from '../data/instagramPosts'
import { readJson, writeJson, STORAGE_KEYS } from '../utils/storage'

const CharmBuilder = lazy(() => import('../components/CharmBuilder').then((m) => ({ default: m.CharmBuilder })))

const heroWords = ['Italian', 'Charm', 'Bracelets']

const testimonials = [
  {
    quote: 'My daughter and I made matching bracelets in ten minutes — cutest mom-and-me memory.',
    name: 'Jamie R.',
    place: 'Online order',
  },
  {
    quote: 'The retro charms are so detailed. I get compliments every time I wear my stack.',
    name: 'Mel S.',
    place: 'Online order',
  },
  {
    quote: 'I loved being able to pick every charm myself online. Felt like customizing candy, but jewelry.',
    name: 'Priya K.',
    place: 'Online order',
  },
]

function PageLoader() {
  return (
    <div className="flex min-h-[200px] items-center justify-center py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-jscolors-gold border-t-jscolors-pink" aria-label="Loading" />
    </div>
  )
}

export default function Home() {
  return (
    <>
      <Helmet>
        <title>Retro Charm Co | Italian Charm Bracelets in Utah</title>
        <meta
          name="description"
          content="Custom Italian charm bracelets built online. Pick your base, choose your charms, and order your story."
        />
      </Helmet>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#f6eef2] via-[#edf1f6] to-[#f6eef2] text-jscolors-charcoal">
        <StarField className="absolute left-0 right-0 top-4 mx-auto max-w-4xl opacity-90" />
        <FloatingHearts className="pointer-events-none absolute bottom-8 right-4 hidden w-32 md:block" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center md:pb-28 md:pt-24">
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold-warm"
          >
            Build online • Ship your story
          </motion.p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 md:gap-4">
            {heroWords.map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.1, type: 'spring', stiffness: 320, damping: 26 }}
                className="font-display text-4xl font-bold text-jscolors-navy sm:text-5xl md:text-6xl lg:text-7xl"
              >
                {word}
              </motion.span>
            ))}
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.55 }}
            className="mt-10 max-w-3xl font-display text-2xl font-semibold leading-snug text-jscolors-navy sm:text-3xl md:text-4xl"
          >
            Charm by Charm, Made by You.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.65, type: 'spring', stiffness: 280, damping: 20 }}
            className="mt-12 md:mt-14"
          >
            <Link
              to="/create"
              className="inline-flex items-center justify-center rounded-full border border-jscolors-gold/55 bg-jscolors-navy px-10 py-4 text-base font-semibold text-jscolors-cream shadow-lg shadow-jscolors-gold/20 transition hover:bg-jscolors-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
            >
              Create Your Bracelet
            </Link>
          </motion.div>
          <SparkleRow className="mt-10" />
        </div>
      </section>

      <HowItWorks />

      <Suspense fallback={<PageLoader />}>
        <div className="bg-jscolors-cream/70 py-16">
          <CharmBuilder className="px-4" idPrefix="home-builder" />
        </div>
      </Suspense>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24" aria-labelledby="love-heading">
        <div className="text-center">

          <h2 id="love-heading" className="font-display text-3xl font-bold text-jscolors-navy md:text-4xl">
            Love from the aisle
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-jscolors-charcoal/80">
            Sweet words from shoppers who built bracelets with us — thank you for letting us sparkle alongside you.
          </p>
        </div>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <li key={t.name} className="retro-card retro-card-hover p-6">
              <p className="text-sm italic leading-relaxed text-jscolors-charcoal/90">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 text-sm font-semibold text-jscolors-navy">
                {t.name}
                <span className="font-normal text-jscolors-charcoal/60"> — {t.place}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-jscolors-gold/25 bg-[#f3eef3]/85 py-16 md:py-20" aria-labelledby="ig-heading">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 id="ig-heading" className="font-display text-3xl font-bold text-jscolors-navy">
            On the &rsquo;Gram
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-jscolors-charcoal/80">
            Follow {instagram.handle} for styling ideas, charm drops, and bracelet inspiration.
          </p>
          <a
            href={instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-jscolors-gold/55 bg-jscolors-navy px-8 py-3 text-sm font-semibold text-jscolors-cream shadow-md shadow-jscolors-gold/15 transition hover:bg-jscolors-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
          >
            Follow {instagram.handle}
          </a>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {instagramPosts.length > 0
              ? instagramPosts.map((post) => (
                  <a
                    key={post.url}
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-[9/16] overflow-hidden rounded-2xl border-2 border-jscolors-gold/40 bg-gradient-to-b from-jscolors-cream to-jscolors-navy/10 shadow-sm transition hover:border-jscolors-gold hover:shadow-md"
                  >
                    <img
                      src={post.image}
                      alt={post.alt}
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                    <span className="sr-only">View this post on {instagram.handle}</span>
                  </a>
                ))
              : ['RC', '✦', '☾', '♡', '✿', '★'].map((label, i) => (
                  <a
                    key={i}
                    href={instagram.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-jscolors-gold/40 bg-jscolors-cream/80 font-display text-xl text-jscolors-navy/35 transition hover:border-jscolors-gold hover:bg-jscolors-cream hover:text-jscolors-navy/60"
                  >
                    <span aria-hidden>{label}</span>
                    <span className="sr-only">View {instagram.handle} on Instagram</span>
                  </a>
                ))}
          </div>

          <div className="mx-auto mt-10 max-w-md text-left">
            <p className="text-center font-display text-sm font-semibold text-jscolors-navy">Get charm doodles in your inbox</p>
            <EmailSignup
              className="mt-4"
              source="home-instagram"
              theme="on-light"
              onSuccess={(payload) => {
                const key = STORAGE_KEYS.shopWaitlist
                const list = readJson(key, [])
                list.push({ ...payload, kind: 'newsletter', at: new Date().toISOString() })
                writeJson(key, list)
              }}
            />
          </div>
        </div>
      </section>
    </>
  )
}
