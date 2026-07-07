import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SparkleRow, FloatingHearts } from '../components/RetroAccents'

const values = [
  {
    title: 'Handmade heart',
    body: 'Each bracelet is curated link-by-link with care — nothing mass-assembled, nothing generic.',
  },
  {
    title: 'Local sparkle',
    body: 'Rooted in Utah and inspired by real people, real stories, and everyday moments worth celebrating.',
  },
  {
    title: 'Personal ritual',
    body: 'We slow down so you can remember birthdays, milestones, inside jokes — one charm at a time.',
  },
  {
    title: 'Retro soul',
    body: 'Nostalgic icons meet modern link styles — cassette tapes beside wildflowers, because you contain multitudes.',
  },
]

export default function About() {
  return (
    <>
      <Helmet>
        <title>About Us | Retro Charm Co</title>
        <meta
          name="description"
          content="The story behind Retro Charm Co — handmade Italian charm bracelets with retro soul, built and ordered online."
        />
      </Helmet>

      <section className="relative overflow-hidden bg-gradient-to-br from-jscolors-cream via-white to-jscolors-cream px-4 py-16 md:py-24">
        <FloatingHearts className="pointer-events-none absolute left-8 top-24 w-24 opacity-80" />
        <div className="relative mx-auto max-w-3xl text-center">
          <SparkleRow />
          <h1 className="mt-8 font-display text-4xl font-bold text-jscolors-navy md:text-5xl">Our story, link by link</h1>
          <p className="mt-6 text-lg leading-relaxed text-jscolors-charcoal/85">
            Retro Charm Co began as a small dream: bring the vintage joy of Italian charm bracelets to more people.
            Today, that same playful spirit lives online so you can build a bracelet that feels like you, charm by charm.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:flex md:items-center md:gap-12 md:py-24">
        <motion.figure
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="retro-card relative mx-auto max-w-md overflow-hidden border-2 border-dashed border-jscolors-pink/35 bg-jscolors-navy/5 p-0 md:mx-0 md:w-1/2"
        >
          <div className="flex aspect-[4/5] flex-col items-center justify-center bg-gradient-to-b from-jscolors-charcoal/10 to-jscolors-pink/15 p-8 text-center">
            <span className="text-4xl" aria-hidden>
              ✶
            </span>
            <figcaption className="mt-4 font-display text-lg font-semibold text-jscolors-navy">The maker behind the magic</figcaption>
            <p className="mt-2 text-sm text-jscolors-charcoal/75">
              Photo placeholder — frame your favorite bracelet polaroid here with that warm retro border.
            </p>
          </div>
        </motion.figure>
        <div className="mt-10 md:mt-0 md:w-1/2">
          <h2 className="font-display text-3xl font-bold text-jscolors-navy">Meet the hands behind the brand</h2>
          <p className="mt-4 text-jscolors-charcoal/85">
            The maker behind the magic threads patience into every clasp, helping each customer turn memories, milestones,
            and inside jokes into a bracelet they love.
          </p>
          <p className="mt-4 text-jscolors-charcoal/85">
            This little brand is family-run, detail-obsessed, and always learning — thank you for supporting a tiny Utah
            business and building with us online.
          </p>
          <Link
            to="/create"
            className="mt-8 inline-flex rounded-full border-2 border-jscolors-gold bg-white px-6 py-3 text-sm font-semibold text-jscolors-navy transition hover:bg-jscolors-gold"
          >
            Charm Studio
          </Link>
        </div>
      </section>

      <section className="border-y border-jscolors-gold/25 bg-white px-4 py-16 md:py-24" aria-labelledby="values-heading">
        <div className="mx-auto max-w-6xl">
          <h2 id="values-heading" className="text-center font-display text-3xl font-bold text-jscolors-navy">
            What we believe
          </h2>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <li key={v.title} className="retro-card retro-card-hover p-6">
                <h3 className="font-display text-xl font-semibold text-jscolors-pink">{v.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-jscolors-charcoal/85">{v.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {['Bracelet close-up', 'Charm wall', 'Styled stack'].map((label) => (
            <figure
              key={label}
              className="retro-card overflow-hidden border-2 border-dashed border-jscolors-gold/40 bg-gradient-to-br from-jscolors-cream to-white"
            >
              <div className="flex aspect-video items-center justify-center">
                <span className="font-display text-2xl text-jscolors-navy/25" aria-hidden>
                  ◈
                </span>
              </div>
              <figcaption className="border-t border-jscolors-gold/20 px-4 py-3 text-center text-sm font-medium text-jscolors-navy">
                {label} — image placeholder with retro rounded corners
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  )
}
