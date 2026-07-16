import { Helmet } from 'react-helmet-async'
import { SparkleRow, FloatingHearts } from '../components/RetroAccents'

const CUSTOMER_PHOTOS = [
  {
    src: '/images/customer-photos/customer-photo-1.webp',
    alt: 'Two customers showing layered Italian charm bracelets with gold and silver links, featuring heart, flag, and fish dangle charms',
  },
  {
    src: '/images/customer-photos/customer-photo-2.webp',
    alt: 'Close-up of a wrist wearing stacked bracelets with a silver Italian charm bracelet, gold chain, and gold beaded cross bracelet',
  },
  {
    src: '/images/customer-photos/customer-photo-3.webp',
    alt: 'Two customers wearing gold Italian charm bracelets with checkered and pearl dangle charms',
  },
  {
    src: '/images/customer-photos/customer-photo-4.webp',
    alt: 'Apple Watch with a gold Italian charm band featuring fish, flag, cross, star, and heart dangle charms',
  },
  {
    src: '/images/customer-photos/customer-photo-5.webp',
    alt: 'Wrist wearing a stacked silver Italian charm bracelet with black beaded and cord bracelets at an outdoor market',
  },
  {
    src: '/images/customer-photos/customer-photo-6.webp',
    alt: 'Hand wearing layered gold and silver Italian charm bracelets with flag, heart, flower, checkerboard, cherry, and WWJD charms',
  },
  {
    src: '/images/customer-photos/customer-photo-7.webp',
    alt: 'Wrist with layered silver chains and a gold Italian charm bracelet with star, I love you, checkerboard links, and fish and pearl dangle charms',
  },
  {
    src: '/images/customer-photos/customer-photo-8.webp',
    alt: 'Wrist wearing stacked gold and silver Italian charm bracelets with cherries, Diet Coke, American flag, and checkerboard charms',
  },
]

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
          <h1 className="mt-8 font-display text-4xl font-bold text-jscolors-ink md:text-5xl">Customer Photos</h1>
          <p className="mt-6 text-lg leading-relaxed text-jscolors-ink/85">
            See how our customers style their charm bracelets
          </p>
        </div>
      </section>

      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {CUSTOMER_PHOTOS.map((photo) => (
              <div key={photo.src} className="aspect-square overflow-hidden rounded-xl">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
