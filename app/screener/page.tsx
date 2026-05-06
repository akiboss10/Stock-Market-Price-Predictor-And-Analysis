import { ScreenerClient } from "@/components/screener/screener-client"

export const metadata = {
  title: "Stock Screener - Quanta",
  description: "Filter and rank stocks by price, market cap, P/E, and momentum.",
}

export default function ScreenerPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Screener</h1>
        <p className="text-sm text-muted-foreground">
          Rank a curated universe of large-cap stocks by your chosen filters.
        </p>
      </div>
      <ScreenerClient />
    </div>
  )
}
