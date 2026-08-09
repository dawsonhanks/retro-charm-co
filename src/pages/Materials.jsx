import { InfoPageLayout, InfoSection } from '../components/InfoPageLayout'
import { MATERIALS_INFO } from '../data/storeInfo'

const META = {
  path: '/materials',
  title: 'Materials & Care | RetroCharm Co',
  description:
    'Stainless steel materials, gold-tone and silver-tone finishes, water and care guidance, and sizing for RetroCharm Co bracelets.',
}

const linkClassName =
  'font-semibold text-jscolors-blue underline decoration-jscolors-gold-warm/70 underline-offset-2'

export default function Materials() {
  const { materials, waterAndWear, finishAndTarnishing, sizing } = MATERIALS_INFO

  return (
    <InfoPageLayout
      title={META.title}
      description={META.description}
      heading="Materials & Care"
      intro={MATERIALS_INFO.intro}
      currentPath={META.path}
    >
      <InfoSection title="Materials">
        {materials.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <ul className="mt-2 space-y-2">
          {MATERIALS_INFO.availableFinishes.map((finish) => (
            <li key={finish.id}>
              <span className="font-semibold text-jscolors-ink">{finish.label}:</span> {finish.note}
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="Water and everyday wear">
        <p>{waterAndWear.summary}</p>
        <p>{waterAndWear.careIntro}</p>
        <ul className="list-disc space-y-2 pl-5">
          {waterAndWear.careTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection title="Finish and tarnishing">
        {finishAndTarnishing.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </InfoSection>

      <InfoSection title="Sizing and adjustments">
        <p>
          {sizing.lead}{' '}
          <a
            href={sizing.tutorial.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={sizing.tutorial.ariaLabel}
            className={linkClassName}
          >
            {sizing.tutorial.text}
          </a>{' '}
          for instructions.
        </p>
        <p>{sizing.contactNote}</p>
      </InfoSection>

      <InfoSection title="Questions">
        <p>{MATERIALS_INFO.contactNote}</p>
        <p>
          <a href={`mailto:${MATERIALS_INFO.contactEmail}`} className={linkClassName}>
            {MATERIALS_INFO.contactEmail}
          </a>
        </p>
      </InfoSection>
    </InfoPageLayout>
  )
}
