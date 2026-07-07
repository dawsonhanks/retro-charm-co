import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
}

export function HowItWorks() {
  const categories = [
    {
      id: 'letters',
      label: 'Letters & Initials',
      blurb: 'The sweet spot for names and monograms.',
      icon: AIcon,
    },
    {
      id: 'hearts',
      label: 'Hearts & Love',
      blurb: 'Hearts in silver and gold, for the people you love.',
      icon: HeartIcon,
    },
    {
      id: 'florals',
      label: 'Florals & Nature',
      blurb: 'Flowers, palm trees, and garden blooms.',
      icon: LeafIcon,
    },
    {
      id: 'retro',
      label: 'Retro & Nostalgia',
      blurb: 'Racing flags, stars, and vintage vibes.',
      icon: TapeIcon,
    },
    {
      id: 'sports',
      label: 'Sports & Fun',
      blurb: 'Pickleball, basketball, and playful icons.',
      icon: TrophyIcon,
    },
    {
      id: 'spiritual',
      label: 'Spiritual & Symbolic',
      blurb: 'Crosses and faith-inspired charms.',
      icon: EyeIcon,
    },
  ]

  const steps = [
    {
      n: '01',
      title: 'Pick Your Base',
      body: 'Silver or gold Italian link bracelet — the blank canvas for your story.',
      Icon: BraceletIcon,
    },
    {
      n: '02',
      title: 'Choose Your Charms',
      body: 'Add as many as you like. Mix categories, initials, and icons.',
      Icon: SparkIcon,
    },
    {
      n: '03',
      title: 'Wear Your Story',
      body: 'Shipped to your door — one-of-a-kind, made by you, ready to wear.',
      Icon: HeartStarIcon,
    },
  ]

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24" aria-labelledby="how-heading">
      <div className="text-center">
        <h2 id="how-heading" className="font-display text-3xl font-bold text-jscolors-navy md:text-4xl">
          How It Works
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-jscolors-charcoal/80">
          Three easy steps at the booth — no tools, no stress, just playful building and instant sparkle.
        </p>
      </div>

      <motion.ol
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="mt-12 grid gap-8 md:grid-cols-3"
      >
        {steps.map((s) => (
          <motion.li
            key={s.n}
            variants={item}
            className="retro-card retro-card-hover relative overflow-hidden p-8 text-center"
          >
            <div className="absolute -right-6 -top-6 text-8xl font-display font-bold text-jscolors-gold/10">{s.n}</div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-jscolors-gold/60 bg-jscolors-cream text-jscolors-pink">
              <s.Icon />
            </div>
            <h3 className="mt-6 font-display text-xl font-semibold text-jscolors-navy">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-jscolors-charcoal/80">{s.body}</p>
          </motion.li>
        ))}
      </motion.ol>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {categories.map((c) => (
          <motion.article key={c.id} variants={item} className="retro-card retro-card-hover flex gap-4 p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-jscolors-gold/50 bg-white text-jscolors-navy">
              <c.icon />
            </span>
            <div>
              <h4 className="font-display font-semibold text-jscolors-navy">{c.label}</h4>
              <p className="mt-1 text-sm text-jscolors-charcoal/75">{c.blurb}</p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  )
}

function BraceletIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 12a8 8 0 0116 0" />
      <path d="M6 14h3l1 2h4l1-2h3" />
      <circle cx="8" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="16" cy="12" r="1.2" fill="currentColor" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.2 5.4L18 8l-4.8 1.4L12 15l-1.2-5.6L6 8l4.8-1.4L12 2z" opacity="0.9" />
      <path d="M19 14l.6 2.4L22 17l-2.4.8L19 20l-.8-2.8L16 17l2.8-.6L19 14z" />
    </svg>
  )
}

function HeartStarIcon() {
  return (
    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 21s-6-4.2-6-9a3.5 3.5 0 016-2.5A3.5 3.5 0 0118 12c0 4.8-6 9-6 9z" />
      <path d="M12 4l1-2 2 1 1-2" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M6 20c6-2 10-8 10-16-8 0-14 4-16 10 3 0 5 2 6 6z" />
    </svg>
  )
}

function TapeIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <rect x="4" y="7" width="16" height="10" rx="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
    </svg>
  )
}

function AIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M7 18L12 6l5 12M9 14h6" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M12 21s-6-4.2-6-9a3.5 3.5 0 016-2.5A3.5 3.5 0 0118 12c0 4.8-6 9-6 9z" />
    </svg>
  )
}

function TrophyIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M8 4h8v3a4 4 0 01-8 0V4z" />
      <path d="M6 4H4v1a3 3 0 003 3M18 4h2v1a3 3 0 01-3 3" />
      <path d="M12 11v3M9 20h6M10 14h4v3a2 2 0 01-4 0v-3z" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
