"use client"

import Link from "next/link"
import { ChangePill } from "@/components/change-pill"
import { formatCurrency, formatCompact } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Quote } from "@/lib/types"

interface QuoteCardProps {
  quote: Quote
  displayName?: string
  href?: string
  variant?: "default" | "compact" | "stat"
}

export function QuoteCard({ quote, displayName, href, variant = "default" }: QuoteCardProps) {
  const link = href ?? `/stock/${quote.symbol}`
  const dir =
    quote.regularMarketChangePercent > 0.0001
      ? "up"
      : quote.regularMarketChangePercent < -0.0001
        ? "down"
        : "flat"

  if (variant === "compact") {
    return (
      <Link
        href={link}
        className="flex items-center justify-between gap-3 rounded-md border bg-card px-3 py-2.5 hover:bg-accent transition-colors"
      >
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{quote.symbol}</div>
          <div className="text-xs text-muted-foreground truncate">
            {displayName ?? quote.shortName ?? quote.longName}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="num text-sm font-medium">
            {formatCurrency(quote.regularMarketPrice, quote.currency ?? "USD")}
          </div>
          <ChangePill value={quote.regularMarketChangePercent} size="sm" showIcon={false} />
        </div>
      </Link>
    )
  }

  if (variant === "stat") {
    return (
      <Link
        href={link}
        className={cn(
          "flex flex-col gap-1 rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors",
          dir === "up" && "border-l-2 border-l-bullish",
          dir === "down" && "border-l-2 border-l-bearish",
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {displayName ?? quote.symbol}
          </span>
          <ChangePill value={quote.regularMarketChangePercent} size="sm" showIcon={false} />
        </div>
        <div className="num text-2xl font-semibold tracking-tight">
          {formatCurrency(quote.regularMarketPrice, quote.currency ?? "USD")}
        </div>
        <div className="num text-xs text-muted-foreground">
          {quote.regularMarketChange >= 0 ? "+" : ""}
          {quote.regularMarketChange.toFixed(2)} today
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={link}
      className="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-semibold text-base">{quote.symbol}</div>
          <div className="text-xs text-muted-foreground truncate">
            {displayName ?? quote.shortName ?? quote.longName}
          </div>
        </div>
        <ChangePill value={quote.regularMarketChangePercent} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="num text-2xl font-semibold tracking-tight">
          {formatCurrency(quote.regularMarketPrice, quote.currency ?? "USD")}
        </div>
        {quote.marketCap ? (
          <div className="text-xs text-muted-foreground">
            <span className="num">{formatCompact(quote.marketCap)}</span> mkt cap
          </div>
        ) : null}
      </div>
    </Link>
  )
}
