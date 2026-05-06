import { NextResponse } from "next/server"
import { getQuotes, MAJOR_INDICES, POPULAR_TICKERS, getTrending } from "@/lib/yahoo"

export const revalidate = 60

export async function GET() {
  const [indices, popular, trendingSymbols] = await Promise.all([
    getQuotes(MAJOR_INDICES.map((i) => i.symbol)),
    getQuotes(POPULAR_TICKERS),
    getTrending().catch(() => [] as string[]),
  ])
  const trending = trendingSymbols.length > 0 ? await getQuotes(trendingSymbols) : []
  // top gainers / losers from popular set
  const sorted = [...popular].sort(
    (a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent,
  )
  const gainers = sorted.slice(0, 5)
  const losers = sorted.slice(-5).reverse()
  return NextResponse.json({
    indices: indices.map((q) => ({
      ...q,
      displayName: MAJOR_INDICES.find((i) => i.symbol === q.symbol)?.name ?? q.symbol,
    })),
    popular,
    trending,
    gainers,
    losers,
  })
}
