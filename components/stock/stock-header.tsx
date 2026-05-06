"use client"

import { useEffect, useState } from "react"
import { Star, BellPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PriceChange } from "@/components/change-pill"
import { formatCurrency } from "@/lib/format"
import {
  isInWatchlist,
  toggleWatchlist,
  pushRecent,
} from "@/lib/storage"
import type { Quote } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { CreateAlertDialog } from "@/components/stock/create-alert-dialog"

export function StockHeader({ quote }: { quote: Quote }) {
  const [watching, setWatching] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)

  useEffect(() => {
    setWatching(isInWatchlist(quote.symbol))
    pushRecent(quote.symbol)
  }, [quote.symbol])

  const handleToggleWatch = () => {
    const isNow = toggleWatchlist(quote.symbol)
    setWatching(isNow)
    toast.success(isNow ? "Added to watchlist" : "Removed from watchlist", {
      description: `${quote.symbol} ${isNow ? "is now in your watchlist" : "removed from your watchlist"}.`,
    })
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight truncate">
            {quote.symbol}
          </h1>
          {quote.exchange && (
            <Badge variant="outline" className="font-normal text-xs">
              {quote.exchange}
            </Badge>
          )}
          {quote.quoteType && (
            <Badge variant="secondary" className="font-normal text-xs uppercase">
              {quote.quoteType}
            </Badge>
          )}
        </div>
        {(quote.longName || quote.shortName) && (
          <p className="text-sm text-muted-foreground truncate">
            {quote.longName ?? quote.shortName}
          </p>
        )}
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="num text-3xl md:text-4xl font-semibold tracking-tight">
            {formatCurrency(quote.regularMarketPrice, quote.currency ?? "USD")}
          </span>
          <PriceChange
            change={quote.regularMarketChange}
            changePercent={quote.regularMarketChangePercent}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleWatch}
          aria-pressed={watching}
        >
          <Star
            className={cn(
              "size-4",
              watching && "fill-amber-400 text-amber-400",
            )}
          />
          {watching ? "Watching" : "Watch"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAlertOpen(true)}>
          <BellPlus className="size-4" />
          Set Alert
        </Button>
      </div>
      <CreateAlertDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        symbol={quote.symbol}
        currentPrice={quote.regularMarketPrice}
      />
    </div>
  )
}
