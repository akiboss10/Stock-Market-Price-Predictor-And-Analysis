import type { Metadata } from "next"
import { WatchlistClient } from "@/components/watchlist/watchlist-client"

export const metadata: Metadata = {
  title: "Watchlist",
  description: "Track stocks you're monitoring with live quotes.",
}

export default function WatchlistPage() {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Watchlist</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stocks you&apos;re monitoring. Tap any row to view full analysis.
        </p>
      </div>
      <WatchlistClient />
    </div>
  )
}
