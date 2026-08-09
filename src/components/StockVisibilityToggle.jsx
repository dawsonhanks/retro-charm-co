/**
 * Toggle for showing out-of-stock charms in catalog brows.
 * @param {{
 *   checked: boolean
 *   onChange: (next: boolean) => void
 *   id?: string
 *   className?: string
 * }} props
 */
export function StockVisibilityToggle({ checked, onChange, id = 'show-out-of-stock', className = '' }) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex cursor-pointer items-center gap-2 text-sm text-jscolors-ink/80 ${className}`}
    >
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          aria-checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          className="absolute inset-0 rounded-full bg-jscolors-ink/20 transition peer-checked:bg-jscolors-pink peer-focus-visible:ring-2 peer-focus-visible:ring-jscolors-gold"
          aria-hidden
        />
        <span
          className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"
          aria-hidden
        />
      </span>
      <span>Show out of stock</span>
    </label>
  )
}
