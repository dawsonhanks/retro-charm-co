import { InfoPageLayout } from '../components/InfoPageLayout'
import { FAQ } from '../components/FAQ'
import { FAQ_ENTRIES } from '../data/storeInfo'

const META = {
  path: '/faq',
  title: 'FAQ | RetroCharm Co',
  description:
    'Answers about building bracelets, shipping, materials, sizing, checkout, and contacting RetroCharm Co.',
}

export default function FaqPage() {
  return (
    <InfoPageLayout
      title={META.title}
      description={META.description}
      heading="Frequently asked questions"
      intro="Quick answers before you build or checkout. Policies live on their own pages so we can keep them up to date."
      currentPath={META.path}
    >
      <FAQ entries={FAQ_ENTRIES} embedded headingLevel="none" />
    </InfoPageLayout>
  )
}
