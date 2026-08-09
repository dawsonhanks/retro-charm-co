import { INVENTORY_OUTAGE_MESSAGE } from '../lib/inventory'

/**
 * Friendly inventory outage banner with Retry Inventory control.
 * @param {{
 *   message?: string | null,
 *   onRetry?: () => void,
 *   retrying?: boolean,
 *   className?: string,
 * }} props
 */
export function InventoryStatusBanner({
  message = INVENTORY_OUTAGE_MESSAGE,
  onRetry,
  retrying = false,
  className = '',
}) {
  if (!message) return null

  return (
    <div
      className={`rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 ${className}`}
      role="status"
      aria-live="polite"
    >
      <p className="font-medium">{message}</p>
      {typeof onRetry === 'function' ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-2 inline-flex min-h-10 items-center rounded-full border border-amber-400 bg-white px-4 py-1.5 text-sm font-semibold text-amber-950 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {retrying ? 'Retrying…' : 'Retry Inventory'}
        </button>
      ) : null}
    </div>
  )
}
