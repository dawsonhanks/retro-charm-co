import { Link } from 'react-router-dom'
import {
  BENEFIT_META,
  getDevPreviewTestimonials,
  getNearCtaProofPhotos,
  getProofStripPhotos,
  getPublishableCustomerPhotos,
  getPublishableTestimonials,
  getTestimonialAttribution,
} from '../data/customerProof'

/**
 * @param {{
 *   photo: import('../data/customerProof').CustomerPhoto,
 *   sizes: string,
 *   className?: string,
 *   imgClassName?: string,
 *   priority?: boolean,
 * }} props
 */
function ProofImage({ photo, sizes, className = '', imgClassName = '', priority = false }) {
  return (
    <div className={`overflow-hidden bg-jscolors-cream/40 ${className}`}>
      <img
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes={sizes}
        className={`h-full w-full object-cover ${imgClassName}`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'low' : undefined}
      />
    </div>
  )
}

/**
 * Homepage customer-proof strip — benefit-tagged photos near the buying decision.
 */
export function CustomerProofStrip({ className = '' }) {
  const photos = getProofStripPhotos()
  const publishable = getPublishableTestimonials()
  const preview = getDevPreviewTestimonials()
  const testimonials = publishable.length > 0 ? publishable : preview
  const showingPlaceholders = publishable.length === 0 && preview.length > 0

  return (
    <section
      className={`border-y border-jscolors-gold/25 bg-gradient-to-b from-jscolors-cream/90 via-white/50 to-jscolors-cream/90 py-12 md:py-16 ${className}`}
      aria-labelledby="customer-proof-heading"
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-jscolors-gold-warm">
            Customer proof
          </p>
          <h2 id="customer-proof-heading" className="mt-3 font-display text-3xl font-bold text-jscolors-ink md:text-4xl">
            Real wrists. Real custom looks.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-jscolors-ink/75">
            See how customers use RetroCharm for fit, personalization, gifting, and stacking — then build yours in Charm
            Studio.
          </p>
        </div>

        <ul className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:mt-10 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:pb-0">
          {photos.map((photo) => {
            const meta = BENEFIT_META[photo.benefit]
            return (
              <li
                key={photo.id}
                className="w-[72%] shrink-0 snap-center sm:w-[46%] md:w-auto"
              >
                <figure className="h-full">
                  <ProofImage
                    photo={photo}
                    sizes="(max-width: 767px) 72vw, (max-width: 1023px) 22vw, 240px"
                    className="aspect-[4/5] rounded-xl"
                  />
                  <figcaption className="mt-3 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-jscolors-gold-warm">
                      {meta.label}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-jscolors-ink/85">{photo.benefitCaption}</p>
                  </figcaption>
                </figure>
              </li>
            )
          })}
        </ul>

        {testimonials.length > 0 ? (
          <div
            className="mt-10"
            aria-label={showingPlaceholders ? 'Placeholder testimonials for layout preview' : 'Customer testimonials'}
          >
            {showingPlaceholders ? (
              <p
                className="mb-4 rounded-xl border border-dashed border-amber-600/50 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-900"
                role="status"
              >
                Placeholder testimonials — local preview only. These never publish to production.
              </p>
            ) : null}
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((entry) => {
                const attribution = getTestimonialAttribution(entry)
                return (
                  <li
                    key={entry.id}
                    className={`rounded-2xl border p-4 ${
                      showingPlaceholders
                        ? 'border-dashed border-amber-600/40 bg-amber-50/80'
                        : 'border-jscolors-gold/30 bg-white/70'
                    }`}
                    data-placeholder={showingPlaceholders ? 'true' : undefined}
                  >
                    {showingPlaceholders ? (
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                        Placeholder — do not publish
                      </p>
                    ) : null}
                    <blockquote className="mt-1 text-sm leading-relaxed text-jscolors-ink/80">
                      {showingPlaceholders
                        ? '“[Approved customer quote goes here — replace SET_TESTIMONIAL_QUOTE in customerProof.js.]”'
                        : `“${entry.quote}”`}
                    </blockquote>
                    {attribution ? (
                      <p className="mt-3 text-xs font-medium text-jscolors-ink/65">— {attribution}</p>
                    ) : showingPlaceholders ? (
                      <p className="mt-3 text-xs text-jscolors-ink/50">Attribution hidden until permission is granted</p>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-8 text-center">
          <Link
            to="/about"
            className="text-sm font-semibold text-jscolors-ink underline decoration-jscolors-gold-warm/70 underline-offset-2 transition hover:text-jscolors-gold-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-jscolors-gold"
          >
            Browse more customer photos
          </Link>
        </div>
      </div>
    </section>
  )
}

/**
 * Compact proof near Charm Studio estimate / cart summary.
 * @param {{ className?: string, heading?: string }} props
 */
export function CustomerProofNearCta({ className = '', heading = 'How customers wear theirs' }) {
  const photos = getNearCtaProofPhotos()

  return (
    <aside className={className} aria-label="Customer photos">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-jscolors-gold-warm">{heading}</p>
      <ul className="mt-3 grid grid-cols-3 gap-2">
        {photos.map((photo) => {
          const meta = BENEFIT_META[photo.benefit]
          return (
            <li key={photo.id}>
              <figure>
                <ProofImage
                  photo={photo}
                  sizes="(max-width: 767px) 28vw, 120px"
                  className="aspect-square rounded-lg"
                />
                <figcaption className="mt-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-jscolors-gold-warm">
                    {meta.label}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-jscolors-ink/70">
                    {meta.studioHint}
                  </p>
                </figcaption>
              </figure>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

/**
 * Full community gallery with benefit captions (About + homepage deeper section).
 * @param {{ className?: string, headingId?: string, title?: string, intro?: string }} props
 */
export function CustomerPhotoGallery({
  className = '',
  headingId = 'customer-photos-heading',
  title = 'Customer Photos',
  intro = 'Fit, personalization, gifting, and stacking — real RetroCharm bracelets on real wrists.',
}) {
  return (
    <section className={className} aria-labelledby={headingId}>
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 id={headingId} className="font-display text-3xl font-bold text-jscolors-ink">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-jscolors-ink/75">{intro}</p>
        <ul className="mt-10 grid grid-cols-2 gap-4 text-left md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {getPublishableCustomerPhotos().map((photo) => {
            const meta = BENEFIT_META[photo.benefit]
            return (
              <li key={photo.id}>
                <figure>
                  <ProofImage
                    photo={photo}
                    sizes="(max-width: 767px) 45vw, (max-width: 1023px) 30vw, 240px"
                    className="aspect-square rounded-xl"
                  />
                  <figcaption className="mt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-jscolors-gold-warm">
                      {meta.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-jscolors-ink/70">{photo.benefitCaption}</p>
                  </figcaption>
                </figure>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
