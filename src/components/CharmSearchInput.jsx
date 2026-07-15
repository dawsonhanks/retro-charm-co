/**
 * Rounded-pill charm search field matching filter-tab chrome.
 * Uses text-base (16px) to avoid iOS focus zoom; min 44px touch height.
 */
export function CharmSearchInput({
  id,
  value,
  onChange,
  onClear,
  placeholder = 'Search charms...',
  className = '',
}) {
  const hasValue = value.trim().length > 0

  return (
    <div className={`relative w-full ${className}`}>
      <span
        className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-jscolors-ink/45"
        aria-hidden
      >
        <SearchIcon />
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className="w-full min-h-11 rounded-full border-2 border-jscolors-gold/30 bg-white py-2.5 pl-11 pr-11 text-base font-medium text-jscolors-ink shadow-sm outline-none transition placeholder:text-jscolors-ink/40 focus:border-jscolors-gold focus:ring-2 focus:ring-jscolors-gold/25 [&::-webkit-search-cancel-button]:appearance-none"
        aria-label="Search charms"
      />
      {hasValue && (
        <button
          type="button"
          onClick={onClear}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-full text-jscolors-ink/55 transition hover:text-jscolors-ink"
          aria-label="Clear search"
        >
          <ClearIcon />
        </button>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
    </svg>
  )
}

function ClearIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}
