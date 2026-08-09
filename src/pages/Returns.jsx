import { InfoPageLayout, InfoSection } from '../components/InfoPageLayout'
import { RETURNS_INFO } from '../data/storeInfo'

const META = {
  path: '/returns',
  title: 'Returns & Exchanges | RetroCharm Co',
  description:
    'Return eligibility, damaged-order help, and how to contact RetroCharm Co about your order.',
}

const linkClassName =
  'font-semibold text-jscolors-blue underline decoration-jscolors-gold-warm/70 underline-offset-2'

export default function Returns() {
  const { sizing, damagedOrder, cancellations, refundTiming } = RETURNS_INFO

  return (
    <InfoPageLayout
      title={META.title}
      description={META.description}
      heading="Returns, Exchanges, and Order Problems"
      intro={RETURNS_INFO.intro}
      currentPath={META.path}
    >
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
          </a>
          .
        </p>
        {sizing.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </InfoSection>

      <InfoSection title="Damaged, defective, or incorrect orders">
        <p>{damagedOrder.summary}</p>
        <p>{damagedOrder.includeIntro}</p>
        <ul className="list-disc space-y-2 pl-5">
          {damagedOrder.include.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{damagedOrder.resolution}</p>
      </InfoSection>

      <InfoSection title="Cancellations and changes">
        {cancellations.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </InfoSection>

      <InfoSection title="Return authorization">
        <p>{RETURNS_INFO.returnAuthorization}</p>
      </InfoSection>

      <InfoSection title="Refund timing">
        {refundTiming.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </InfoSection>

      <InfoSection title="Contact">
        <p>{RETURNS_INFO.contactNote}</p>
        <p>
          <a href={`mailto:${RETURNS_INFO.contactEmail}`} className={linkClassName}>
            {RETURNS_INFO.contactEmail}
          </a>
        </p>
      </InfoSection>
    </InfoPageLayout>
  )
}
