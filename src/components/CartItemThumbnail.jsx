import { BASE_OPTIONS, getCharmById } from '../data/charms'

export function CartItemThumbnail({ item }) {
  const image = item.image ?? getCharmById(item.id)?.image ?? BASE_OPTIONS.find((b) => b.id === item.id)?.image

  if (image) {
    return (
      <img
        src={image}
        alt=""
        className="h-14 w-14 shrink-0 rounded-lg border border-gold/20 bg-white object-contain"
        loading="lazy"
        decoding="async"
      />
    )
  }

  return <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-200" aria-hidden />
}
