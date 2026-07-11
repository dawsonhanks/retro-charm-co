import { Helmet } from 'react-helmet-async'
import { SparkleRow, FloatingHearts } from '../components/RetroAccents'

const placeholderCount = 8

export default function About() {
  return (
    <>
      <Helmet>
        <title>Customer Photos | RetroCharm Co</title>
        <meta
          name="description"
          content="See how our customers style their RetroCharm Co charm bracelets — real photos from the community."
        />
      </Helmet>

      <section className="relative overflow-hidden bg-gradient-to-br from-jscolors-cream via-white to-jscolors-cream px-4 py-16 md:py-24">
        <FloatingHearts className="pointer-events-none absolute left-8 top-24 w-24 opacity-80" />
        <div className="relative mx-auto max-w-3xl text-center">
          <SparkleRow />
          <h1 className="mt-8 font-display text-4xl font-bold text-jscolors-navy md:text-5xl">Customer Photos</h1>
          <p className="mt-6 text-lg leading-relaxed text-jscolors-charcoal/85">
            See how our customers style their charm bracelets
          </p>
        </div>
      </section>

      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {Array.from({ length: placeholderCount }, (_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-200" aria-hidden />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
