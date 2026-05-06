"use client"

import Link from "next/link"
import type { Quote } from "@/lib/types"
import { cn } from "@/lib/utils"
import { formatPercent } from "@/lib/format"

interface MarketHeatmapProps {
  quotes: Quote[]
}

/**
 * Treemap-like heatmap. Tile area roughly proportional to market cap,
 * tile color intensity proportional to |change %|.
 */
export function MarketHeatmap({ quotes }: MarketHeatmapProps) {
  if (quotes.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        No data available
      </div>
    )
  }
  const totalCap = quotes.reduce((s, q) => s + (q.marketCap ?? 1), 0)

  return (
    <div className="grid grid-cols-6 gap-1 auto-rows-[80px] md:auto-rows-[100px]">
      {quotes.map((q) => {
        const weight = (q.marketCap ?? 1) / totalCap
        // Map weight to 1-3 column / row span
        const span =
          weight > 0.18 ? "col-span-3 row-span-2" : weight > 0.1 ? "col-span-2 row-span-2" : weight > 0.05 ? "col-span-2 row-span-1" : "col-span-1 row-span-1"
        const change = q.regularMarketChangePercent
        const intensity = Math.min(1, Math.abs(change) / 5)
        const dir = change > 0.0001 ? "up" : change < -0.0001 ? "down" : "flat"
        return (
          <Link
            key={q.symbol}
            href={`/stock/${q.symbol}`}
            className={cn(
              "relative flex flex-col justify-between rounded-md p-2 overflow-hidden border transition-transform hover:scale-[1.01] hover:z-10",
              span,
              dir === "up"
                ? "bg-bullish-soft border-bullish/30 text-foreground"
                : dir === "down"
                  ? "bg-bearish-soft border-bearish/30 text-foreground"
                  : "bg-muted border-border",
            )}
            style={{
              boxShadow:
                dir !== "flat"
                  ? `inset 0 0 0 9999px rgb(${dir === "up" ? "0 200 130" : "230 60 60"} / ${intensity * 0.18})`
                  : undefined,
            }}
          >
            <div className="font-medium text-xs md:text-sm leading-none truncate">
              {q.symbol}
            </div>
            <div
              className={cn(
                "num text-xs md:text-sm font-semibold leading-none",
                dir === "up" && "text-bullish",
                dir === "down" && "text-bearish",
                dir === "flat" && "text-muted-foreground",
              )}
            >
              {formatPercent(change)}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
