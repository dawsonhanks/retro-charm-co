import { Helmet } from 'react-helmet-async'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TITLE,
  SITE_NAME,
  absoluteUrl,
} from '../data/site'

/**
 * Shared document head for titles, canonical URLs, and social previews.
 *
 * @param {{
 *   title?: string,
 *   description?: string,
 *   path: string,
 *   image?: string,
 *   type?: 'website' | 'article' | 'product',
 *   noindex?: boolean,
 *   jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null,
 * }} props
 */
export function PageMeta({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path,
  image = DEFAULT_OG_IMAGE_PATH,
  type = 'website',
  noindex = false,
  jsonLd = null,
}) {
  const canonical = absoluteUrl(path)
  const ogImage = absoluteUrl(image)
  const graphs = jsonLd == null ? [] : Array.isArray(jsonLd) ? jsonLd : [jsonLd]

  return (
    <Helmet>
      <html lang="en" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} — custom Italian charm bracelets`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {graphs.map((graph, index) => (
        <script
          // Stable key per page graph index; content is deterministic for the route.
          key={`ld-json-${index}`}
          type="application/ld+json"
        >
          {JSON.stringify(graph)}
        </script>
      ))}
    </Helmet>
  )
}
