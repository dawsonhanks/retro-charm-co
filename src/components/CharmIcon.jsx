export function CharmSvgIcon({ charm, className = 'h-8 w-8', accentClass = 'text-jscolors-pink' }) {
  if (!charm) return null
  const vb = charm.viewBox || '0 0 24 24'

  if (charm.iconType === 'letter') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" className="fill-white stroke-jscolors-gold" strokeWidth="1.5" />
        <text
          x="12"
          y="13"
          textAnchor="middle"
          className="fill-jscolors-navy"
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
      />
    )
  }

  return (
    <svg className={`${className} ${accentClass}`} viewBox={vb} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {charm.paths
        ? charm.paths.map((p, i) => <path key={i} d={p.d} fill={p.fillRule ? 'currentColor' : 'none'} fillRule={p.fillRule} />)
        : charm.path && <path d={charm.path} />}
    </svg>
  )
}

export function CharmPickerGrid({ charms: list, onPick, maxReached }) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
      {list.map((c) => {
        const disabled = maxReached
        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(c)}
            title={c.name}
            className="flex flex-col items-center rounded-xl border border-jscolors-gold/25 bg-white/90 p-2 text-center shadow-sm transition hover:border-jscolors-gold hover:shadow-md disabled:cursor-not-allowed disabled:opacity-45"
          >
            <CharmSvgIcon charm={c} className="h-7 w-7 text-jscolors-charcoal" accentClass="text-jscolors-pink" />
            <span className="mt-1 line-clamp-2 text-[10px] font-medium leading-tight text-jscolors-charcoal">{c.name}</span>
          </button>
        )
      })}
    </div>
  )
}
