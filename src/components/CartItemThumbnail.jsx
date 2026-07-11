import { BASE_OPTIONS, getCharmById } from '../data/charms'

export function CartItemThumbnail({ item }) {
  const image = item.image ?? getCharmById(item.id)?.image

  if (image) {
    return (
      <img
        src={image}
        alt=""
        className="h-14 w-14 shrink-0 rounded-lg border border-gold/20 bg-white object-contain"
      />
    )
  }

  const base = BASE_OPTIONS.find((b) => b.id === item.id)
  if (base) {
    const isGold = base.id === 'gold'
    return (
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-gold/30 ${
          isGold ? 'bg-gradient-to-br from-amber-100 to-amber-300' : 'bg-gradient-to-br from-slate-100 to-slate-300'
        }`}
        aria-hidden
      >
        <svg className="h-7 w-7 text-navy/45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M4 12a8 8 0 0116 0" />
          <circle cx="8" cy="12" r="1.2" fill="currentColor" />
          <circle cx="12" cy="12" r="1.2" fill="currentColor" />
          <circle cx="16" cy="12" r="1.2" fill="currentColor" />
        </svg>
      </div>
    )
  }

  return <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-200" aria-hidden />
}
