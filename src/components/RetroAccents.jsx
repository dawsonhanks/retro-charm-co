export function StarField({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 400 120" fill="none" aria-hidden>
      <path d="M40 60l8-12 8 12-12-4-12 4 8-12z" fill="#F5A623" opacity="0.35" />
      <path d="M320 30l6-9 6 9-9-3-9 3 6-9z" fill="#E94560" opacity="0.45" />
      <path d="M200 90l10-15 10 15-15-5-15 5 10-15z" fill="#F5A623" opacity="0.3" />
      <circle cx="120" cy="24" r="3" fill="#FFF9F0" opacity="0.6" />
      <circle cx="280" cy="70" r="2.5" fill="#E94560" opacity="0.5" />
      <circle cx="360" cy="48" r="2" fill="#F5A623" opacity="0.55" />
      <path d="M160 18l4-7 4 7M168 11v14" stroke="#FFF9F0" strokeWidth="1.2" opacity="0.5" />
    </svg>
  )
}

export function FloatingHearts({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 120 80" fill="none" aria-hidden>
      <path d="M24 44s-8-6-8-12a6 6 0 0112 0 6 6 0 0112 0c0 6-8 12-8 12s-8-6-8-12z" fill="#E94560" opacity="0.2" />
      <path d="M60 24s-6-4.5-6-9a4.5 4.5 0 019 0 4.5 4.5 0 019 0c0 4.5-6 9-6 9s-6-4.5-6-9z" fill="#F5A623" opacity="0.25" />
    </svg>
  )
}

export function SparkleRow({ className = '' }) {
  return (
    <div className={`flex justify-center gap-3 ${className}`} aria-hidden>
      {['✦', '✧', '★', '✧', '✦'].map((s, i) => (
        <span key={i} className="text-jscolors-gold/80" style={{ fontSize: i % 2 ? '1rem' : '1.25rem' }}>
          {s}
        </span>
      ))}
    </div>
  )
}
