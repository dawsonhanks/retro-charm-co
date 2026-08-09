import { useCallback, useSyncExternalStore } from 'react'
import { STORAGE_KEYS, readJson, writeJson } from './storage'

const FAVORITES_EVENT = 'retrocharm:favorites-change'

function readFavoriteIds() {
  const raw = readJson(STORAGE_KEYS.wishlist, [])
  if (!Array.isArray(raw)) return []
  return raw.filter((id) => typeof id === 'string')
}

function writeFavoriteIds(ids) {
  writeJson(STORAGE_KEYS.wishlist, ids)
  window.dispatchEvent(new CustomEvent(FAVORITES_EVENT))
}

/** @returns {string[]} */
export function getFavoriteCharmIds() {
  return readFavoriteIds()
}

/**
 * @param {string} charmId
 * @returns {boolean} whether the charm is favorited after the toggle
 */
export function toggleFavoriteCharmId(charmId) {
  const current = readFavoriteIds()
  const has = current.includes(charmId)
  const next = has ? current.filter((id) => id !== charmId) : [...current, charmId]
  writeFavoriteIds(next)
  return !has
}

/** @param {string} charmId */
export function isFavoriteCharmId(charmId) {
  return readFavoriteIds().includes(charmId)
}

function subscribe(callback) {
  const onStorage = (event) => {
    if (event.key === STORAGE_KEYS.wishlist || event.key === null) callback()
  }
  const onLocal = () => callback()
  window.addEventListener('storage', onStorage)
  window.addEventListener(FAVORITES_EVENT, onLocal)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(FAVORITES_EVENT, onLocal)
  }
}

function getSnapshot() {
  return JSON.stringify(readFavoriteIds())
}

/**
 * Reactive favorites list backed by localStorage (`retrocharm_wishlist`).
 * @returns {{ favoriteIds: string[], favoriteSet: Set<string>, isFavorite: (id: string) => boolean, toggleFavorite: (id: string) => void }}
 */
export function useCharmFavorites() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => '[]')
  const favoriteIds = JSON.parse(snapshot)
  const favoriteSet = new Set(favoriteIds)

  const isFavorite = useCallback((id) => JSON.parse(snapshot).includes(id), [snapshot])

  const toggleFavorite = useCallback((id) => {
    toggleFavoriteCharmId(id)
  }, [])

  return { favoriteIds, favoriteSet, isFavorite, toggleFavorite }
}

/**
 * Lightweight non-hook helpers for one-off reads (e.g. tests).
 */
export function clearFavoriteCharmIds() {
  writeFavoriteIds([])
}
