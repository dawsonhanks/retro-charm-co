export function CharmSvgIcon({ charm, className = 'h-8 w-8', accentClass = 'text-jscolors-pink' }) {
  if (!charm) return null
  const vb = charm.viewBox || '0 0 24 24'
  const colorClass = charm.iconClass ?? accentClass

  if (charm.iconType === 'letter') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" className="fill-white stroke-jscolors-gold" strokeWidth="1.5" />
        <text
          x="12"
          y="13"
          textAnchor="middle"
          className="fill-jscolors-blue"
          style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: '11px', fontWeight: 700 }}
        >
          {charm.letter}
        </text>
      </svg>
    )
  }

  if (charm.iconType === 'emoji') {
    return (
      <span className={className} aria-label={charm.name} role="img" style={{ fontSize: '1.5em', lineHeight: 1 }}>
        {charm.emoji}
      </span>
    )
  }

  if (charm.iconType === 'image') {
    return (
      <img
        src={charm.image}
        alt={charm.name}
        className={`${className} object-contain`}
        loading="lazy"
        decoding="async"
      />
    )
  }

  return (
    <svg className={`${className} ${colorClass}`} viewBox={vb} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {charm.paths
        ? charm.paths.map((p, i) => <path key={i} d={p.d} fill={p.fillRule ? 'currentColor' : 'none'} fillRule={p.fillRule} />)
        : charm.path && <path d={charm.path} />}
    </svg>
  )
}

export function CharmPickerGrid({
  charms: list,
  onPick,
  maxReached,
  onBraceletCounts = {},
  justAddedId = null,
  isOutOfStock,
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
      {list.map((c) => {
        const outOfStock = isOutOfStock?.(c) ?? false
        const disabled = maxReached || outOfStock
        const count = onBraceletCounts[c.id] ?? 0
        const onBracelet = count > 0
        const justAdded = justAddedId === c.id

        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (outOfStock) return
              onPick(c)
            }}
            title={
              outOfStock
                ? `${c.name} — out of stock`
                : onBracelet
                  ? `${c.name} — ${count} on bracelet`
                  : c.name
            }
            aria-pressed={onBracelet}
            aria-disabled={outOfStock || undefined}
            className={[
              'relative flex flex-col items-center rounded-xl border-2 p-2 text-center shadow-sm transition',
              'disabled:cursor-not-allowed',
              outOfStock
                ? 'border-jscolors-ink/15 bg-gray-100 opacity-50 grayscale'
                : 'disabled:opacity-45',
              !outOfStock && justAdded
                ? 'scale-[1.04] border-jscolors-pink bg-jscolors-pink/15 shadow-md ring-2 ring-jscolors-pink/40'
                : !outOfStock && onBracelet
                  ? 'border-jscolors-pink bg-jscolors-pink/10 hover:border-jscolors-pink hover:shadow-md'
                  : !outOfStock
                    ? 'border-jscolors-gold/25 bg-white/90 hover:border-jscolors-gold hover:shadow-md'
                    : '',
            ].join(' ')}
          >
            {outOfStock && (
              <span className="pointer-events-none absolute inset-x-1 top-1 z-10 rounded bg-jscolors-ink/80 px-1 py-0.5 text-[8px] font-bold uppercase leading-tight tracking-wide text-white">
                Out of Stock
              </span>
            )}
            {(justAdded || onBracelet) && !outOfStock && (
              <span
                className={[
                  'absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm',
                  justAdded ? 'bg-emerald-500' : 'bg-jscolors-pink',
                ].join(' ')}
                aria-hidden
              >
                {justAdded ? '✓' : count > 1 ? count : '✓'}
              </span>
            )}
            <CharmSvgIcon charm={c} className="h-7 w-7 text-jscolors-ink" accentClass="text-jscolors-pink" />
            <span className="mt-1 line-clamp-2 text-[10px] font-medium leading-tight text-jscolors-ink">{c.name}</span>
            {justAdded && !outOfStock && (
              <span className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-[10px] bg-emerald-500/95 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                Added
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
