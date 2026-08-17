export function SaleBanner() {
  return (
    <aside
      className="bg-jscolors-cta px-4 py-2.5 text-center text-jscolors-cream"
      aria-label="Back-to-School sale"
    >
      <p className="text-sm font-semibold tracking-wide sm:text-base">
        Back-to-School Sale: 25% off with code{' '}
        <span className="inline-block rounded-md border border-jscolors-gold/70 bg-jscolors-cream/10 px-2 py-0.5 font-bold tracking-[0.12em] text-white">
          SCHOOL25
        </span>
      </p>
    </aside>
  )
}
