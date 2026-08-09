import { BASE_LINK_COUNT } from '../utils/braceletLinks'
import { BASE_OPTIONS, getCharmById, isFillerCharm } from '../data/charms'
import { buildOrderEstimate, formatMoney } from '../utils/orderEstimate'

/**
 * @param {{ buildId: string, label?: string | null, baseId?: string, metal: 'silver' | 'gold', charmCount?: number, charms: { id: string, image?: string, name: string }[] }[]} builds
 * @param {{ className?: string }} props
 */
export function BraceletBuildsPreview({ builds, className = '' }) {
  if (!builds.length) return null

  return (
    <div className={`space-y-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-jscolors-ink/60">Your bracelet builds</p>
      {builds.map((build) => (
        <BraceletBuildRow key={build.buildId} build={build} />
      ))}
    </div>
  )
}

function BraceletBuildRow({ build }) {
  const chainStroke = build.metal === 'gold' ? '#d4af37' : '#b8bcc6'
  const linkCount = Math.max(build.charms.length * 2 + 2, BASE_LINK_COUNT)
  const base = BASE_OPTIONS.find((b) => b.id === (build.baseId ?? build.metal))
  const baseLabel = base?.label ?? `${build.metal} bracelet`
  const title = build.label ? build.label : 'Custom build'
  const paidCharms = build.charms
    .filter((charm) => !isFillerCharm(charm))
    .map((charm) => getCharmById(charm.id) ?? charm)
  const plainLinkCount = build.charms.filter((charm) => isFillerCharm(charm)).length
  const estimate = buildOrderEstimate({
    base: base ?? { id: build.baseId ?? build.metal, label: baseLabel, price: 0 },
    charms: paidCharms,
    plainLinkCount,
  })
  const subtitleParts = [
    baseLabel,
    build.charmCount ? `${build.charmCount} links` : null,
    `${paidCharms.length} paid charm${paidCharms.length === 1 ? '' : 's'}`,
    `${plainLinkCount} plain included free`,
  ].filter(Boolean)

  return (
    <div className="rounded-2xl border border-jscolors-gold/30 bg-white/70 p-3 shadow-sm">
      <p className="mb-0.5 text-sm font-semibold text-jscolors-ink">{title}</p>
      <p className="mb-2 text-xs font-medium leading-snug text-jscolors-ink/70">{subtitleParts.join(' · ')}</p>
      {estimate && (
        <p className="mb-2 text-xs text-jscolors-ink/65">
          Product {formatMoney(estimate.productSubtotal)} · Shipping {formatMoney(estimate.shipping)} ·{' '}
          <span className="font-semibold text-jscolors-ink">
            Estimated total before tax {formatMoney(estimate.estimatedTotalBeforeTax)}
          </span>
        </p>
      )}
      <p className="mb-2 text-[11px] text-jscolors-ink/60">
        You do not need a charm for every link — plain fillers are included free with the base.
      </p>
      <div className="relative min-w-0">
        <BraceletBaseGraphic stroke={chainStroke} linkCount={linkCount} />
        <div className="relative mx-auto flex w-full min-w-0 max-w-full items-center justify-center gap-0.5 overflow-x-auto overscroll-x-contain px-2 py-5">
          {build.charms.length === 0 ? (
            Array.from({ length: 6 }, (_, i) => <PlainLinkGraphic key={i} stroke={chainStroke} />)
          ) : (
            <>
              <PlainLinkGraphic stroke={chainStroke} />
              {build.charms.map((charm, index) => (
                <span key={`${charm.id}-${index}`} className="contents">
                  <CharmPreviewSlot charm={charm} />
                  <PlainLinkGraphic stroke={chainStroke} />
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CharmPreviewSlot({ charm }) {
  const filler = isFillerCharm(charm)
  return (
    <div
      className={`shrink-0 rounded-full border-2 bg-white p-1 shadow-sm ${
        filler ? 'border-jscolors-gold/35' : 'border-jscolors-gold'
      }`}
      title={filler ? `${charm.name} (included free)` : charm.name}
    >
      {charm.image ? (
        <img src={charm.image} alt="" className="h-6 w-6 object-contain" loading="lazy" decoding="async" />
      ) : (
        <div className="h-6 w-6 rounded-full bg-gray-200" aria-hidden />
      )}
    </div>
  )
}

function PlainLinkGraphic({ stroke }) {
  return (
    <svg className="h-7 w-3.5 shrink-0" viewBox="0 0 20 40" fill="none" aria-hidden>
      <rect x="3" y="10" width="14" height="20" rx="3" stroke={stroke} strokeWidth="3" fill="rgba(255,255,255,0.65)" />
      <line x1="10" y1="14" x2="10" y2="26" stroke={stroke} strokeWidth="1.5" opacity="0.5" />
    </svg>
  )
}

function BraceletBaseGraphic({ stroke, linkCount }) {
  const slots = Math.max(linkCount, 8)
  const width = Math.min(520, 32 + slots * 18)
  const height = 56

  return (
    <svg
      className="pointer-events-none absolute left-1/2 top-1/2 h-[72px] -translate-x-1/2 -translate-y-1/2"
      style={{ width: `min(100%, ${width}px)` }}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden
    >
      <path
        d={`M32 28c${Math.round((width - 64) * 0.12)}-20 ${Math.round((width - 64) * 0.32)}-20 ${Math.round((width - 64) * 0.44)} 0 ${Math.round((width - 64) * 0.12)} 20 ${Math.round((width - 64) * 0.32)} 20 ${Math.round((width - 64) * 0.44)} 0`}
        stroke={stroke}
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  )
}
