export const STORAGE_KEYS = {
  wishlist: 'retrocharm_wishlist',
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
  try {
    if (value == null) {
      localStorage.removeItem(key)
      return
    }
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota / private mode — ignore so the storefront keeps working.
  }
}

export function loadSavedBuild() {
  return readJson(STORAGE_KEYS.savedBuild, null)
}

/**
 * Persist an in-progress Charm Studio build for refresh / navigation recovery.
 * @param {{ baseId: string, charmCount: number | null, linkOrder: import('./braceletLinks').BraceletLink[] } | null} build
 */
export function persistSavedBuild(build) {
  if (!build || build.charmCount == null) {
    writeJson(STORAGE_KEYS.savedBuild, null)
    return
  }

  writeJson(STORAGE_KEYS.savedBuild, {
    baseId: build.baseId,
    charmCount: build.charmCount,
    linkOrder: (build.linkOrder ?? []).map((link) => {
      if (link.type === 'charm' && link.charm?.id) {
        return { id: link.id, type: 'charm', charmId: link.charm.id }
      }
      return { id: link.id, type: 'plain' }
    }),
  })
}
