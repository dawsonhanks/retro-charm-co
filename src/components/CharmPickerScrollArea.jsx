import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Scrollable charm panel with a persistent styled scrollbar (WebKit/Firefox)
 * and a custom rail + edge fades so overflow stays obvious on iOS Safari.
 */
export function CharmPickerScrollArea({ children, className = '', maxHeightClassName = 'max-h-[320px] md:max-h-[380px]' }) {
  const scrollRef = useRef(null)
  const [metrics, setMetrics] = useState({
    overflow: false,
    canScrollUp: false,
    canScrollDown: false,
    thumbTop: 0,
    thumbHeight: 0,
  })

  const updateMetrics = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const { scrollTop, scrollHeight, clientHeight } = el
    const overflow = scrollHeight > clientHeight + 1
    const maxScroll = Math.max(scrollHeight - clientHeight, 1)
    const trackHeight = clientHeight
    const thumbHeight = overflow
      ? Math.max((clientHeight / scrollHeight) * trackHeight, 28)
      : 0
    const thumbTop = overflow ? (scrollTop / maxScroll) * (trackHeight - thumbHeight) : 0

    setMetrics({
      overflow,
      canScrollUp: scrollTop > 4,
      canScrollDown: scrollTop < maxScroll - 4,
      thumbTop,
      thumbHeight,
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateMetrics()

    const onScroll = () => updateMetrics()
    el.addEventListener('scroll', onScroll, { passive: true })

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateMetrics) : null
    resizeObserver?.observe(el)
    if (el.firstElementChild) resizeObserver?.observe(el.firstElementChild)

    window.addEventListener('resize', updateMetrics)

    return () => {
      el.removeEventListener('scroll', onScroll)
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateMetrics)
    }
  }, [updateMetrics, children])

  return (
    <div className={`relative mt-4 ${className}`}>
      <div
        ref={scrollRef}
        className={`charm-picker-scroll ${maxHeightClassName}`}
        tabIndex={0}
        aria-label="Charm list"
      >
        {children}
      </div>

      {metrics.overflow && (
        <>
          {/* Edge fades — always on when there's more content (works on iOS). */}
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-7 bg-gradient-to-b from-jscolors-cream to-transparent transition-opacity duration-200 ${
              metrics.canScrollUp ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
          />
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-11 bg-gradient-to-t from-jscolors-cream via-jscolors-cream/90 to-transparent transition-opacity duration-200 ${
              metrics.canScrollDown ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
          />

          {/* Custom rail — primary affordance where overlay scrollbars hide (iOS). */}
          <div
            className="pointer-events-none absolute bottom-2 right-1 top-2 z-20 w-1.5 rounded-full bg-jscolors-gold/30"
            aria-hidden
          >
            <div
              className="absolute inset-x-0 rounded-full bg-jscolors-gold shadow-sm shadow-jscolors-ink/15"
              style={{
                height: `${metrics.thumbHeight}px`,
                transform: `translateY(${metrics.thumbTop}px)`,
              }}
            />
          </div>

          {metrics.canScrollDown && (
            <p
              className="pointer-events-none absolute inset-x-0 bottom-1.5 z-20 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-jscolors-gold-warm"
              aria-hidden
            >
              Scroll for more
            </p>
          )}
        </>
      )}
    </div>
  )
}
