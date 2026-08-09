import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getInventory,
  INVENTORY_OUTAGE_MESSAGE,
  INVENTORY_RETRY_BACKOFF_MS,
  INVENTORY_STALE_AFTER_MS,
  isInventoryAuthoritative,
  isInventoryStale,
} from '../lib/inventory'
import { logInventoryDiagnostic } from '../lib/inventoryDiagnostics'
import { logInventoryMismatches } from '../utils/inventory'

/**
 * Live inventory with fail-safe status, manual retry, and exponential backoff.
 * Does not clear builds/favorites — only refreshes stock state.
 */
export function useInventory() {
  const [status, setStatus] = useState('loading')
  const [map, setMap] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [message, setMessage] = useState(null)
  const [reason, setReason] = useState(null)
  const [retrying, setRetrying] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  const attemptRef = useRef(0)
  const timerRef = useRef(null)
  const prevAuthoritativeRef = useRef(false)
  const mismatchLoggedRef = useRef(false)

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const result = await getInventory()
        if (cancelled) return

        const authoritative = isInventoryAuthoritative(result)
        setStatus(result.status === 'unconfigured' ? 'unavailable' : result.status)
        setMap(result.map ?? {})
        setFetchedAt(result.fetchedAt ?? null)
        setReason(result.reason ?? null)
        setMessage(authoritative ? null : (result.message ?? INVENTORY_OUTAGE_MESSAGE))
        setRetrying(false)

        if (authoritative && !mismatchLoggedRef.current) {
          mismatchLoggedRef.current = true
          logInventoryMismatches(result.map)
        }

        if (authoritative && !prevAuthoritativeRef.current && attemptRef.current > 0) {
          logInventoryDiagnostic('inventory_recovered', { reason: result.status })
        }
        prevAuthoritativeRef.current = authoritative

        clearTimer()
        if (authoritative) {
          attemptRef.current = 0
          return
        }

        const delay =
          INVENTORY_RETRY_BACKOFF_MS[
            Math.min(attemptRef.current, INVENTORY_RETRY_BACKOFF_MS.length - 1)
          ]
        attemptRef.current += 1
        timerRef.current = setTimeout(() => {
          if (!cancelled) setRetryToken((n) => n + 1)
        }, delay)
      } catch {
        if (cancelled) return
        setStatus('unavailable')
        setMap({})
        setFetchedAt(null)
        setReason('network_error')
        setMessage(INVENTORY_OUTAGE_MESSAGE)
        setRetrying(false)
      }
    }

    void run()

    return () => {
      cancelled = true
      clearTimer()
    }
  }, [retryToken])

  useEffect(() => {
    if (status !== 'ready' && status !== 'mock') return undefined
    const id = setInterval(() => {
      if (isInventoryStale(fetchedAt)) {
        logInventoryDiagnostic('inventory_stale', {
          ageMs: fetchedAt == null ? -1 : Date.now() - fetchedAt,
          staleAfterMs: INVENTORY_STALE_AFTER_MS,
        })
        setRetryToken((n) => n + 1)
      }
    }, 60_000)
    return () => clearInterval(id)
  }, [status, fetchedAt])

  const retry = useCallback(() => {
    setRetrying(true)
    clearTimer()
    setRetryToken((n) => n + 1)
  }, [])

  const verified = status === 'ready' || status === 'mock'

  return {
    status,
    map,
    fetchedAt,
    message,
    reason,
    retrying,
    verified,
    purchasesBlocked: !verified,
    outageMessage: !verified ? (message ?? INVENTORY_OUTAGE_MESSAGE) : null,
    retry,
    refresh: retry,
  }
}
