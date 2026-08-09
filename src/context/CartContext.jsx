import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BASE_OPTIONS, DEFAULT_CHARM_PRICE, getCharmById, isFillerCharm } from '../data/charms'

const STORAGE_KEY = 'retro-charm-cart'
const BUILDS_STORAGE_KEY = 'retro-charm-bracelet-builds'

const CartContext = createContext(null)

function buildItemCounts(build) {
  const counts = new Map()
  const baseId = build.baseId ?? build.metal
  counts.set(baseId, (counts.get(baseId) ?? 0) + 1)
  for (const charm of build.charms) {
    if (isFillerCharm(charm)) continue
    counts.set(charm.id, (counts.get(charm.id) ?? 0) + 1)
  }
  return counts
}

function resolveCartItemTemplate(id, newBuild) {
  const base = BASE_OPTIONS.find((b) => b.id === id)
  if (base) {
    return { id: base.id, name: base.label, price: base.price, metal: base.metal, image: base.image }
  }

  const charm = getCharmById(id)
  const snapshot = newBuild.charms.find((c) => c.id === id)
  if (charm) {
    return {
      id: charm.id,
      name: charm.name,
      price: charm.price,
      metal: charm.metal,
      image: charm.image ?? snapshot?.image,
    }
  }

  if (snapshot) {
    return {
      id: snapshot.id,
      name: snapshot.name,
      price: DEFAULT_CHARM_PRICE,
      metal: newBuild.metal,
      image: snapshot.image,
    }
  }

  return null
}

function applyBuildDiffToItems(prevItems, oldBuild, newBuild) {
  const oldCounts = buildItemCounts(oldBuild)
  const newCounts = buildItemCounts(newBuild)
  const allIds = new Set([...oldCounts.keys(), ...newCounts.keys()])

  let nextItems = [...prevItems]

  for (const id of allIds) {
    const oldQty = oldCounts.get(id) ?? 0
    const newQty = newCounts.get(id) ?? 0
    const delta = newQty - oldQty
    if (delta === 0) continue

    const existingIndex = nextItems.findIndex((item) => item.id === id)

    if (delta > 0) {
      if (existingIndex >= 0) {
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + delta,
        }
      } else {
        const template = resolveCartItemTemplate(id, newBuild)
        if (template) {
          nextItems.push({ ...template, quantity: delta })
        }
      }
      continue
    }

    if (existingIndex < 0) continue

    const nextQuantity = nextItems[existingIndex].quantity + delta
    if (nextQuantity <= 0) {
      nextItems = nextItems.filter((item) => item.id !== id)
    } else {
      nextItems[existingIndex] = {
        ...nextItems[existingIndex],
        quantity: nextQuantity,
      }
    }
  }

  return nextItems
}

function cartItemsToCounts(items) {
  const counts = new Map()
  for (const item of items) {
    counts.set(item.id, (counts.get(item.id) ?? 0) + item.quantity)
  }
  return counts
}

function canAllocate(available, required) {
  for (const [id, qty] of required) {
    if ((available.get(id) ?? 0) < qty) return false
  }
  return true
}

function deductAllocation(available, required) {
  for (const [id, qty] of required) {
    available.set(id, (available.get(id) ?? 0) - qty)
  }
}

/**
 * Keep only builds that can still be fully "paid for" by the current cart totals.
 * Builds are checked in add-order; shared charms (e.g. two bracelets with Letter R)
 * are allocated to the earliest build first.
 */
function pruneUnrepresentedBuilds(items, builds) {
  if (builds.length === 0) return builds
  if (items.length === 0) return []

  const available = cartItemsToCounts(items)
  const kept = []

  for (const build of builds) {
    const required = buildItemCounts(build)
    if (canAllocate(available, required)) {
      deductAllocation(available, required)
      kept.push(build)
    }
  }

  return kept
}

function loadCart() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function loadBraceletBuilds() {
  try {
    const stored = localStorage.getItem(BUILDS_STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const [braceletBuilds, setBraceletBuilds] = useState(loadBraceletBuilds)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    localStorage.setItem(BUILDS_STORAGE_KEY, JSON.stringify(braceletBuilds))
  }, [braceletBuilds])

  const addItem = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: i.quantity + (item.quantity ?? 1),
                image: i.image ?? item.image,
              }
            : i,
        )
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }]
    })
  }

  const applyItemsChangeAndPruneBuilds = (computeNextItems) => {
    const snapshot = { nextItems: null }
    setItems((prevItems) => {
      snapshot.nextItems = computeNextItems(prevItems)
      return snapshot.nextItems
    })
    setBraceletBuilds((prevBuilds) => {
      if (snapshot.nextItems === null) return prevBuilds
      return pruneUnrepresentedBuilds(snapshot.nextItems, prevBuilds)
    })
  }

  const removeItem = (id) => {
    applyItemsChangeAndPruneBuilds((prev) => prev.filter((i) => i.id !== id))
  }

  const updateQuantity = (id, qty) => {
    if (qty <= 0) {
      removeItem(id)
      return
    }
    applyItemsChangeAndPruneBuilds((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    )
  }

  const clearCart = () => {
    setItems([])
    setBraceletBuilds([])
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]))
    localStorage.setItem(BUILDS_STORAGE_KEY, JSON.stringify([]))
  }

  const addBraceletBuild = (build) => {
    setBraceletBuilds((prev) => [
      ...prev,
      {
        buildId: build.buildId ?? crypto.randomUUID(),
        label: build.label ?? null,
        baseId: build.baseId ?? build.metal,
        metal: build.metal,
        charmCount: build.charmCount,
        charms: build.charms,
      },
    ])
  }

  const removeBraceletBuild = (buildId) => {
    setBraceletBuilds((prevBuilds) => {
      const oldBuild = prevBuilds.find((b) => b.buildId === buildId)
      if (!oldBuild) return prevBuilds

      const required = buildItemCounts(oldBuild)
      setItems((prevItems) => {
        let next = [...prevItems]
        for (const [id, qty] of required) {
          const existingIndex = next.findIndex((item) => item.id === id)
          if (existingIndex < 0) continue
          const nextQuantity = next[existingIndex].quantity - qty
          if (nextQuantity <= 0) {
            next = next.filter((item) => item.id !== id)
          } else {
            next[existingIndex] = {
              ...next[existingIndex],
              quantity: nextQuantity,
            }
          }
        }
        return next
      })

      return prevBuilds.filter((b) => b.buildId !== buildId)
    })
  }

  const replaceBraceletBuild = (buildId, newBuild) => {
    setBraceletBuilds((prevBuilds) => {
      const oldBuild = prevBuilds.find((b) => b.buildId === buildId)
      if (!oldBuild) return prevBuilds

      setItems((prevItems) => applyBuildDiffToItems(prevItems, oldBuild, newBuild))

      return prevBuilds.map((b) =>
        b.buildId === buildId
          ? {
              buildId,
              label: newBuild.label ?? b.label ?? null,
              baseId: newBuild.baseId ?? newBuild.metal,
              metal: newBuild.metal,
              charmCount: newBuild.charmCount,
              charms: newBuild.charms,
            }
          : b,
      )
    })
  }

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const value = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    braceletBuilds,
    addBraceletBuild,
    removeBraceletBuild,
    replaceBraceletBuild,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Hook colocated with provider — intentional for a single cart module.
// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
