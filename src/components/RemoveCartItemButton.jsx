/** Shared per-line remove control for cart UI (drawer + cart page). */
export function RemoveCartItemButton({ itemName, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-jscolors-gold/40 text-jscolors-ink/55 transition hover:border-jscolors-pink hover:bg-jscolors-pink/25 hover:text-jscolors-ink ${className}`}
      aria-label={`Remove ${itemName} from cart`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}
