/**
 * Site identity and absolute URL helpers for SEO / social sharing.
 * Prefer VITE_SITE_URL in production; never end with a trailing slash.
 */

import { getHomeHeroPhoto } from './customerProof'

export const SITE_NAME = 'RetroCharm Co'

export const DEFAULT_SITE_URL = 'https://www.theretrocharmco.com'

export const DEFAULT_TITLE = 'RetroCharm Co | Italian Charm Bracelets in Utah'

export const DEFAULT_DESCRIPTION =
  'Custom Italian charm bracelets built online. Pick your base, choose your charms, and wear your story — handmade with love in Utah.'

/**
 * Default Open Graph / Twitter share image (existing brand asset).
 * Absolute URL is built at render time via `absoluteUrl`.
 */
export const DEFAULT_OG_IMAGE_PATH = '/images/brand/retro-charm-logo.png'

/** Homepage share image — permitted customer lifestyle shot (same as hero). */
export const HOME_OG_IMAGE_PATH = getHomeHeroPhoto().src

/**
 * @returns {string} Canonical site origin without trailing slash.
 */
export function getSiteUrl() {
  const raw = import.meta.env.VITE_SITE_URL || DEFAULT_SITE_URL
  return String(raw).trim().replace(/\/+$/, '') || DEFAULT_SITE_URL
}

/**
 * @param {string} [path='/'] Absolute path or full URL.
 * @returns {string}
 */
export function absoluteUrl(path = '/') {
  if (!path) return getSiteUrl()
  const trimmed = String(path).trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const origin = getSiteUrl()
  if (trimmed === '/') return `${origin}/`
  return `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`
}
