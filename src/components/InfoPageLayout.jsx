import { Link } from 'react-router-dom'
import { PageMeta } from './PageMeta'
import { SparkleRow } from './RetroAccents'
import { INFO_PAGES } from '../data/storeInfo'
import { buildWebPageJsonLd } from '../data/structuredData'

/**
 * Shared layout for Shipping / Returns / Materials / FAQ information pages.
 * @param {{
 *   title: string,
 *   description: string,
 *   heading: string,
 *   intro?: string,
 *   currentPath: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export function InfoPageLayout({ title, description, heading, intro, currentPath, children }) {
  return (
    <>
      <PageMeta
        title={title}
        description={description}
        path={currentPath}
        jsonLd={buildWebPageJsonLd({ title, description, path: currentPath })}
      />

      <header className="border-b border-jscolors-gold/25 bg-jscolors-blue px-4 py-14 text-center text-jscolors-cream md:py-20">
        <SparkleRow className="mx-auto opacity-90" />
        <h1 className="mt-6 font-display text-4xl font-bold md:text-5xl">{heading}</h1>
        {intro ? <p className="mx-auto mt-4 max-w-2xl text-jscolors-cream/85">{intro}</p> : null}
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <nav aria-label="Store information pages" className="mb-10">
          <ul className="flex flex-wrap justify-center gap-2">
            {INFO_PAGES.map((page) => {
              const isCurrent = page.path === currentPath
              return (
                <li key={page.path}>
                  <Link
                    to={page.path}
                    aria-current={isCurrent ? 'page' : undefined}
                    className={`inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold ${
                      isCurrent
                        ? 'border-jscolors-gold bg-jscolors-gold/20 text-jscolors-ink'
                        : 'border-jscolors-gold/40 bg-white/80 text-jscolors-ink/80 hover:border-jscolors-gold hover:text-jscolors-ink'
                    }`}
                  >
                    {page.shortLabel}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="space-y-8">{children}</div>
      </div>
    </>
  )
}

/**
 * @param {{ title: string, children: import('react').ReactNode }} props
 */
export function InfoSection({ title, children }) {
  return (
    <section className="rounded-3xl border-2 border-jscolors-gold/30 bg-white/80 p-6 shadow-sm md:p-8">
      <h2 className="font-display text-xl font-bold text-jscolors-ink md:text-2xl">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-jscolors-ink/85 md:text-base">{children}</div>
    </section>
  )
}

/**
 * Renders confirmed copy, or a contact fallback when the owner has not confirmed yet.
 * @param {{ value: string | null | undefined, topic: string, fallback: string }} props
 */
export function ConfirmedOrFallback({ value, fallback }) {
  if (value) {
    return <p>{value}</p>
  }
  return <p>{fallback}</p>
}
