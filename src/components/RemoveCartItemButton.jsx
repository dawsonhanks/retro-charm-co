/** Quantity stepper: − / count / + (qty ≤ 0 removes the line via updateQuantity). */
export function CartItemQuantityControls({ itemName, quantity, onDecrease, onIncrease }) {
  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onDecrease}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-jscolors-gold/50 text-lg leading-none text-jscolors-ink transition hover:bg-jscolors-gold/15"
        aria-label={`Decrease quantity of ${itemName}`}
      >
        −
      </button>
      <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums text-jscolors-ink" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-jscolors-gold/50 text-lg leading-none text-jscolors-ink transition hover:bg-jscolors-gold/15"
        aria-label={`Increase quantity of ${itemName}`}
      >
        +
      </button>
    </div>
  )
}

/** Full-line remove — trash + label so customers can clear the selection in one tap. */
export function RemoveCartItemButton({ itemName, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold text-jscolors-ink/55 transition hover:text-jscolors-pink ${className}`}
      aria-label={`Remove all ${itemName} from cart`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-3.5 w-3.5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 6h18M8 6V4.5A1.5 1.5 0 019.5 3h5A1.5 1.5 0 0116 4.5V6m2 0v13.5A1.5 1.5 0 0116.5 21h-9A1.5 1.5 0 016 19.5V6h12z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
      </svg>
      Remove
    </button>
  )
}
