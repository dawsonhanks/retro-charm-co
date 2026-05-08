export const STORAGE_KEYS = {
  wishlist: 'retrocharm_wishlist',
  shopWaitlist: 'retrocharm_shop_waitlist',
  savedBuild: 'retrocharm_saved_build',
}

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadSavedBuild() {
  return readJson(STORAGE_KEYS.savedBuild, null)
}
