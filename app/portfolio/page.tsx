import type { Metadata } from "next"
import { PortfolioClient } from "@/components/portfolio/portfolio-client"

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Track your holdings, gains, and losses with live mark-to-market.",
}

export default function PortfolioPage() {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Portfolio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your positions with real-time mark-to-market valuation and unrealized P&amp;L.
        </p>
      </div>
      <PortfolioClient />
    </div>
  )
}
