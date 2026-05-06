// Server-only wrapper around yahoo-finance2.
// All exported functions must be called from API routes / Server Components.

import YahooFinance from "yahoo-finance2"
import type { Quote, HistoricalPoint, NewsItem, SearchResult, TimeRange } from "./types"
import { analyzeText } from "./sentiment"

// In yahoo-finance2 v3+ the default export is a class, not a singleton instance.
// We instantiate once at module scope and reuse across requests.
const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey", "ripHistorical"],
})

interface FetchOptions {
  revalidateSeconds?: number
}

function rangeToParams(range: TimeRange): { period1: Date; interval: "1d" | "1wk" | "1mo" | "1h" | "5m" | "15m" | "30m" | "60m" | "90m" } {
  const now = new Date()
  const period1 = new Date(now)
  switch (range) {
    case "1D":
      period1.setDate(now.getDate() - 5)
      return { period1, interval: "1d" }
    case "5D":
      period1.setDate(now.getDate() - 14)
      return { period1, interval: "1d" }
    case "1M":
      period1.setMonth(now.getMonth() - 1)
      return { period1, interval: "1d" }
    case "3M":
      period1.setMonth(now.getMonth() - 3)
      return { period1, interval: "1d" }
    case "6M":
      period1.setMonth(now.getMonth() - 6)
      return { period1, interval: "1d" }
    case "1Y":
      period1.setFullYear(now.getFullYear() - 1)
      return { period1, interval: "1d" }
    case "5Y":
      period1.setFullYear(now.getFullYear() - 5)
      return { period1, interval: "1wk" }
    case "MAX":
      period1.setFullYear(now.getFullYear() - 20)
      return { period1, interval: "1mo" }
  }
}

export async function getQuote(symbol: string): Promise<Quote | null> {
  try {
    const q = await yahooFinance.quote(symbol)
    if (!q || Array.isArray(q)) return null
    return {
      symbol: q.symbol ?? symbol,
      shortName: q.shortName,
      longName: q.longName,
      regularMarketPrice: q.regularMarketPrice ?? 0,
      regularMarketChange: q.regularMarketChange ?? 0,
      regularMarketChangePercent: q.regularMarketChangePercent ?? 0,
      regularMarketPreviousClose: q.regularMarketPreviousClose ?? 0,
      regularMarketOpen: q.regularMarketOpen,
      regularMarketDayHigh: q.regularMarketDayHigh,
      regularMarketDayLow: q.regularMarketDayLow,
      regularMarketVolume: q.regularMarketVolume,
      marketCap: q.marketCap,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow,
      trailingPE: q.trailingPE,
      forwardPE: q.forwardPE,
      dividendYield: q.dividendYield,
      currency: q.currency,
      exchange: q.fullExchangeName ?? q.exchange,
      quoteType: q.quoteType,
      averageVolume: q.averageDailyVolume3Month,
      epsTrailingTwelveMonths: q.epsTrailingTwelveMonths,
    }
  } catch (e) {
    console.error("[v0] getQuote error", symbol, e)
    return null
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return []
  try {
    const res = await Promise.all(symbols.map((s) => getQuote(s)))
    return res.filter((q): q is Quote => q !== null)
  } catch (e) {
    console.error("[v0] getQuotes error", e)
    return []
  }
}

export async function getHistorical(
  symbol: string,
  range: TimeRange,
): Promise<HistoricalPoint[]> {
  try {
    const { period1, interval } = rangeToParams(range)
    // chart() is the modern replacement for historical()
    const result = await yahooFinance.chart(symbol, {
      period1,
      interval,
      includePrePost: false,
    })
    const quotes = result.quotes ?? []
    return quotes
      .filter((r) => r.close != null && r.open != null)
      .map((r) => ({
        date: (r.date instanceof Date ? r.date : new Date(r.date as unknown as string))
          .toISOString()
          .slice(0, 10),
        open: r.open as number,
        high: (r.high ?? r.open) as number,
        low: (r.low ?? r.open) as number,
        close: r.close as number,
        adjClose: r.adjclose ?? r.close,
        volume: (r.volume ?? 0) as number,
      }))
  } catch (e) {
    console.error("[v0] getHistorical error", symbol, range, e)
    return []
  }
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return []
  try {
    const res = await yahooFinance.search(query, { quotesCount: 10, newsCount: 0 })
    return (res.quotes ?? [])
      .filter((q): q is typeof q & { symbol: string } => "symbol" in q && !!q.symbol)
      .slice(0, 10)
      .map((q) => ({
        symbol: q.symbol,
        shortname: "shortname" in q ? q.shortname : undefined,
        longname: "longname" in q ? q.longname : undefined,
        exchDisp: "exchDisp" in q ? q.exchDisp : undefined,
        typeDisp: "typeDisp" in q ? q.typeDisp : undefined,
      }))
  } catch (e) {
    console.error("[v0] searchSymbols error", query, e)
    return []
  }
}

export async function getNews(symbol: string): Promise<NewsItem[]> {
  try {
    const res = await yahooFinance.search(symbol, { quotesCount: 0, newsCount: 12 })
    const news = res.news ?? []
    return news.map((n) => {
      const text = `${n.title ?? ""}. ${("summary" in n ? (n as { summary?: string }).summary : "") ?? ""}`
      const sentiment = analyzeText(text)
      return {
        title: n.title ?? "",
        link: n.link ?? "",
        publisher: n.publisher,
        publishTime: n.providerPublishTime
          ? new Date(n.providerPublishTime as unknown as string).toISOString()
          : new Date().toISOString(),
        summary: "summary" in n ? (n as { summary?: string }).summary : undefined,
        thumbnail:
          n.thumbnail?.resolutions?.find((r) => r.width && r.width <= 200)?.url ??
          n.thumbnail?.resolutions?.[0]?.url,
        sentiment,
      }
    })
  } catch (e) {
    console.error("[v0] getNews error", symbol, e)
    return []
  }
}

export async function getTrending(): Promise<string[]> {
  try {
    const res = await yahooFinance.trendingSymbols("US", { count: 12 })
    return (res.quotes ?? []).map((q) => q.symbol).filter(Boolean) as string[]
  } catch (e) {
    console.error("[v0] getTrending error", e)
    return []
  }
}

export const MAJOR_INDICES = [
  { symbol: "^GSPC", name: "S&P 500" },
  { symbol: "^DJI", name: "Dow Jones" },
  { symbol: "^IXIC", name: "Nasdaq" },
  { symbol: "^RUT", name: "Russell 2000" },
  { symbol: "^VIX", name: "VIX" },
  { symbol: "^FTSE", name: "FTSE 100" },
]

export const POPULAR_TICKERS = [
  "AAPL",
  "MSFT",
  "GOOGL",
  "AMZN",
  "NVDA",
  "META",
  "TSLA",
  "BRK-B",
  "JPM",
  "V",
  "WMT",
  "JNJ",
]
