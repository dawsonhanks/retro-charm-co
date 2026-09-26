import { Component } from 'react'

/**
 * Catches render/lazy-load errors in routed pages so a broken page shows a
 * friendly "please refresh" message instead of a blank screen.
 *
 * Most commonly triggered by a stale JS chunk reference after a new deploy
 * (the browser has an old page loaded, then tries to fetch a page chunk that
 * no longer exists at that hash) — refreshing fetches the current build and
 * resolves it, but with no boundary the failed dynamic import unmounts the
 * whole app silently.
 */
export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('[RouteErrorBoundary] Caught render error:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="mx-auto flex min-h-[52vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center"
          role="alert"
        >
          <p className="font-display text-2xl font-semibold text-jscolors-ink">Something went wrong</p>
          <p className="mt-2 text-sm text-jscolors-ink/70">
            This page hit a snag loading — usually fixed with a refresh, especially if the site
            updated while you had it open.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-jscolors-cta px-6 py-2.5 text-sm font-semibold text-jscolors-cream transition hover:bg-jscolors-cta-hover"
          >
            Refresh page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
