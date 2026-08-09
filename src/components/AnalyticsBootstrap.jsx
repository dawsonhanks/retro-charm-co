import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { captureAttributionFromLocation, initOptionalPixels } from '../lib/analytics'

/**
 * Captures UTM params on first landing and loads optional ad pixels.
 * Mount inside BrowserRouter.
 */
export function AnalyticsBootstrap() {
  const location = useLocation()

  useEffect(() => {
    initOptionalPixels()
  }, [])

  useEffect(() => {
    captureAttributionFromLocation(location.search)
  }, [location.search])

  return null
}
