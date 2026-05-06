// Client-side persistence layer using localStorage.
// All functions are SSR-safe and return defaults on the server.

"use client"

import type { PortfolioHolding } from "./types"

const KEY_WATCHLIST = "v0_stock_watchlist_v1"
const KEY_PORTFOLIO = "v0_stock_portfolio_v1"
const KEY_ALERTS = "v0_stock_alerts_v1"
const KEY_RECENT = "v0_stock_recent_v1"

function isBrowser() {
  return typeof window !== "undefined"
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent(`storage:${key}`))
  } catch {
    // ignore quota errors
  }
}

// Watchlist (array of symbols)
export function getWatchlist(): string[] {
  return read<string[]>(KEY_WATCHLIST, [])
}
export function setWatchlist(symbols: string[]) {
  write(KEY_WATCHLIST, symbols)
}
export function toggleWatchlist(symbol: string): boolean {
  const cur = getWatchlist()
  const has = cur.includes(symbol)
  const next = has ? cur.filter((s) => s !== symbol) : [...cur, symbol]
  setWatchlist(next)
  return !has
}
export function isInWatchlist(symbol: string): boolean {
  return getWatchlist().includes(symbol)
}

// Portfolio
export function getPortfolio(): PortfolioHolding[] {
  return read<PortfolioHolding[]>(KEY_PORTFOLIO, [])
}
export function setPortfolio(holdings: PortfolioHolding[]) {
  write(KEY_PORTFOLIO, holdings)
}
export function addHolding(h: Omit<PortfolioHolding, "id">): PortfolioHolding {
  const cur = getPortfolio()
  const newH: PortfolioHolding = { ...h, id: crypto.randomUUID() }
  setPortfolio([...cur, newH])
  return newH
}
export function removeHolding(id: string) {
  setPortfolio(getPortfolio().filter((h) => h.id !== id))
}
export function updateHolding(id: string, patch: Partial<PortfolioHolding>) {
  setPortfolio(
    getPortfolio().map((h) => (h.id === id ? { ...h, ...patch } : h)),
  )
}

// Alerts

/** Extended alert shape used by the alerts UI. */
export interface Alert {
  id: string
  symbol: string
  direction: "above" | "below"
  targetPrice: number
  note?: string
  triggered: boolean
  triggeredAt?: string
  createdAt: string
  active: boolean
}

export function getAlerts(): Alert[] {
  return read<Alert[]>(KEY_ALERTS, [])
}
export function setAlerts(alerts: Alert[]) {
  write(KEY_ALERTS, alerts)
}
export function addAlert(a: Omit<Alert, "id" | "createdAt" | "active" | "triggered">): Alert {
  const cur = getAlerts()
  const newA: Alert = {
    ...a,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    active: true,
    triggered: false,
  }
  setAlerts([...cur, newA])
  return newA
}
export function removeAlert(id: string) {
  setAlerts(getAlerts().filter((a) => a.id !== id))
}
export function updateAlert(id: string, patch: Partial<Alert>) {
  setAlerts(
    getAlerts().map((a) => (a.id === id ? { ...a, ...patch } : a)),
  )
}
export function toggleAlert(id: string) {
  setAlerts(
    getAlerts().map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
  )
}

// Recent searches
export function getRecent(): string[] {
  return read<string[]>(KEY_RECENT, [])
}
export function pushRecent(symbol: string) {
  const cur = getRecent().filter((s) => s !== symbol)
  cur.unshift(symbol)
  write(KEY_RECENT, cur.slice(0, 8))
}

// Subscribe to changes (for cross-component reactivity)
export function subscribe(key: "watchlist" | "portfolio" | "alerts" | "recent", cb: () => void) {
  if (!isBrowser()) return () => {}
  const map = {
    watchlist: KEY_WATCHLIST,
    portfolio: KEY_PORTFOLIO,
    alerts: KEY_ALERTS,
    recent: KEY_RECENT,
  } as const
  const evt = `storage:${map[key]}`
  const handler = () => cb()
  window.addEventListener(evt, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(evt, handler)
    window.removeEventListener("storage", handler)
  }
}
