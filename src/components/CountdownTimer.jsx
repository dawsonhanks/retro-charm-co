import { useEffect, useMemo, useState } from 'react'

function pad(n) {
  return String(n).padStart(2, '0')
}

export function CountdownTimer({ targetDate }) {
  const target = useMemo(() => new Date(targetDate).getTime(), [targetDate])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, target - now)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  const units = [
    { label: 'Days', value: days, format: (v) => String(v) },
    { label: 'Hours', value: hours, format: pad },
    { label: 'Minutes', value: minutes, format: pad },
    { label: 'Seconds', value: seconds, format: pad },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {units.map((u) => (
        <div key={u.label} className="retro-card border-jscolors-gold/40 p-4 text-center">
          <p className="font-display text-3xl font-bold tabular-nums text-jscolors-ink md:text-4xl">{u.format(u.value)}</p>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-jscolors-ink/70">{u.label}</p>
        </div>
      ))}
    </div>
  )
}
