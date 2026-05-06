"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * US equity market clock indicator.
 * NYSE/Nasdaq: 9:30am - 4:00pm ET, Mon-Fri (ignoring holidays for simplicity).
 */
function getMarketState(): { open: boolean; label: string } {
  const now = new Date()
  // Convert to America/New_York
  const nyParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now)
  const wd = nyParts.find((p) => p.type === "weekday")?.value ?? ""
  const hour = parseInt(nyParts.find((p) => p.type === "hour")?.value ?? "0", 10)
  const minute = parseInt(nyParts.find((p) => p.type === "minute")?.value ?? "0", 10)
  const minutesOfDay = hour * 60 + minute
  const isWeekday = !["Sat", "Sun"].includes(wd)
  const open = isWeekday && minutesOfDay >= 9 * 60 + 30 && minutesOfDay < 16 * 60
  if (open) return { open: true, label: "Markets Open" }
  if (isWeekday && minutesOfDay < 9 * 60 + 30) return { open: false, label: "Pre-Market" }
  if (isWeekday && minutesOfDay >= 16 * 60) return { open: false, label: "After Hours" }
  return { open: false, label: "Markets Closed" }
}

export function MarketStatus() {
  const [state, setState] = useState<{ open: boolean; label: string } | null>(null)

  useEffect(() => {
    setState(getMarketState())
    const id = setInterval(() => setState(getMarketState()), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!state) return null
  return (
    <div className="hidden sm:flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs">
      <span
        className={cn(
          "relative flex size-2",
          state.open ? "text-bullish" : "text-muted-foreground",
        )}
      >
        {state.open && (
          <span className="absolute inset-0 rounded-full bg-bullish/60 animate-ping" />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full size-2",
            state.open ? "bg-bullish" : "bg-muted-foreground/60",
          )}
        />
      </span>
      <span className="font-medium">{state.label}</span>
    </div>
  )
}
