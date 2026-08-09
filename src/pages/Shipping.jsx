import { Link } from 'react-router-dom'
import { InfoPageLayout, InfoSection } from '../components/InfoPageLayout'
import { SHIPPING_INFO } from '../data/storeInfo'
import { FLAT_RATE_SHIPPING } from '../data/shipping'

const META = {
  path: '/shipping',
  title: 'Shipping | RetroCharm Co',
  description:
    'Flat $6 USPS shipping, 3–5 business day processing, U.S. destinations, and delivery help for RetroCharm Co orders.',
}

const linkClassName =
  'font-semibold text-jscolors-blue underline decoration-jscolors-gold-warm/70 underline-offset-2'

export default function Shipping() {
  const { destinations, processing, nonArrival } = SHIPPING_INFO

  return (
    <InfoPageLayout
      title={META.title}
      description={META.description}
      heading="Shipping"
      intro={SHIPPING_INFO.intro}
      currentPath={META.path}
    >
      <InfoSection title="Shipping cost">
        <p>
          <span className="font-semibold text-jscolors-ink">{SHIPPING_INFO.flatRateLabel}</span>
          {` — $${FLAT_RATE_SHIPPING.toFixed(2)} per online order.`}
        </p>
        <p>{SHIPPING_INFO.flatRateDetail}</p>
      </InfoSection>

      <InfoSection title="Processing time">
        <p>{processing.lead}</p>
        <p>{processing.detail}</p>
        <p>{processing.delayPolicy}</p>
      </InfoSection>

      <InfoSection title="Shipping destinations">
        <p>{destinations.summary}</p>
        <ul className="list-disc space-y-2 pl-5">
          {destinations.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{destinations.international}</p>
      </InfoSection>

      <InfoSection title="Tracking">
        <p>{SHIPPING_INFO.tracking}</p>
      </InfoSection>

      <InfoSection title="Orders that do not arrive">
        <p>{nonArrival.lead}</p>
        <p>{nonArrival.replacement}</p>
        <p>{nonArrival.addressNote}</p>
      </InfoSection>

      <InfoSection title="Tax">
        <p>{SHIPPING_INFO.taxNote}</p>
      </InfoSection>

      <InfoSection title="Need help?">
        <p>{SHIPPING_INFO.contactNote}</p>
        <p>
          <a href={`mailto:${SHIPPING_INFO.contactEmail}`} className={linkClassName}>
            {SHIPPING_INFO.contactEmail}
          </a>
        </p>
        <p className="pt-2">
          <Link to="/returns" className="font-semibold text-jscolors-blue underline underline-offset-2">
            Returns &amp; damaged orders
          </Link>
          {' · '}
          <Link to="/faq" className="font-semibold text-jscolors-blue underline underline-offset-2">
            FAQ
          </Link>
        </p>
      </InfoSection>
    </InfoPageLayout>
  )
}
