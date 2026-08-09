import { PageMeta } from '../components/PageMeta'
import { CustomerPhotoGallery } from '../components/CustomerProof'
import { SparkleRow, FloatingHearts } from '../components/RetroAccents'
import { HOME_OG_IMAGE_PATH } from '../data/site'
import { buildWebPageJsonLd } from '../data/structuredData'

const TITLE = 'Customer Photos | RetroCharm Co'
const DESCRIPTION =
  'See how customers style RetroCharm Co bracelets for fit, personalization, gifting, and stacking — real photos from the community.'

export default function About() {
  return (
    <>
      <PageMeta
        title={TITLE}
        description={DESCRIPTION}
        path="/about"
        image={HOME_OG_IMAGE_PATH}
        jsonLd={buildWebPageJsonLd({ title: TITLE, description: DESCRIPTION, path: '/about' })}
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-jscolors-cream via-white to-jscolors-cream px-4 py-16 md:py-24">
        <FloatingHearts className="pointer-events-none absolute left-8 top-24 w-24 opacity-80" />
        <div className="relative mx-auto max-w-3xl text-center">
          <SparkleRow />
          <h1 className="mt-8 font-display text-4xl font-bold text-jscolors-ink md:text-5xl">Customer Photos</h1>
          <p className="mt-6 text-lg leading-relaxed text-jscolors-ink/85">
            Fit, personalization, gifting, and stacking — real RetroCharm bracelets on real wrists.
          </p>
        </div>
      </section>

      <CustomerPhotoGallery
        className="px-4 py-16 md:py-24"
        headingId="about-customer-photos-heading"
        title="From the community"
        intro="Each photo highlights how customers wear their charms day to day."
      />
    </>
  )
}
