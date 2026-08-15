export function HowItWorks() {
  const steps = [
    {
      title: 'Pick Your Base',
      body: 'Silver-tone or gold-tone Italian link bracelet — the blank canvas for your story.',
      Icon: BraceletIcon,
    },
    {
      title: 'Choose Your Charms',
      body: 'Add as many as you like. Mix categories, initials, and icons.',
      Icon: SparkIcon,
    },
    {
      title: 'Wear Your Story',
      body: 'Shipped to your door — one-of-a-kind, made by you, ready to wear.',
      Icon: HeartStarIcon,
    },
  ]

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-24" aria-labelledby="how-heading">
      <div className="text-center">
        <h2 id="how-heading" className="font-display text-3xl font-bold text-jscolors-ink md:text-4xl">
          How It Works
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-jscolors-ink/75">
          Three easy steps online — no tools, no stress, just playful building and instant sparkle.
        </p>
      </div>

      <ol className="mt-12 grid gap-8 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.title} className="retro-card retro-card-hover relative overflow-hidden p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-jscolors-gold/60 bg-jscolors-cream text-jscolors-pink">
              <s.Icon />
            </div>
            <h3 className="mt-6 font-display text-xl font-semibold text-jscolors-ink">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-jscolors-ink/75">{s.body}</p>
          </li>
        ))}
      </ol>
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
