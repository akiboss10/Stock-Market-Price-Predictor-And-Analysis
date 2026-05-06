import { notFound } from "next/navigation"
import { Suspense } from "react"
import type { Metadata } from "next"
import { getQuote, getHistorical, getNews } from "@/lib/yahoo"
import { computeIndicators, generateSignal } from "@/lib/indicators"
import { predictPrices } from "@/lib/predict"
import { aggregateSentiment } from "@/lib/sentiment"
import { StockHeader } from "@/components/stock/stock-header"
import { PriceChartSection } from "@/components/stock/price-chart-section"
import { IndicatorPanels } from "@/components/stock/indicator-panels"
import { ForecastCard } from "@/components/stock/forecast-card"
import { SignalCard } from "@/components/stock/signal-card"
import { StatsGrid } from "@/components/stock/stats-grid"
import { NewsFeed } from "@/components/stock/news-feed"
import { SentimentCard } from "@/components/stock/sentiment-card"
import { Skeleton } from "@/components/ui/skeleton"

export const revalidate = 60

interface PageProps {
  params: Promise<{ symbol: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { symbol } = await params
  const quote = await getQuote(symbol.toUpperCase())
  if (!quote) return { title: `${symbol.toUpperCase()} — Not Found` }
  return {
    title: `${quote.symbol} ${quote.shortName ? `· ${quote.shortName}` : ""}`,
    description: `Real-time quote, ML forecast, technical indicators, and news sentiment for ${quote.shortName ?? quote.symbol}.`,
  }
}

export default async function StockPage({ params }: PageProps) {
  const { symbol: rawSymbol } = await params
  const symbol = rawSymbol.toUpperCase()
  const quote = await getQuote(symbol)
  if (!quote) notFound()

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto space-y-6">
      <StockHeader quote={quote} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<Skeleton className="h-[480px] rounded-lg" />}>
            <ChartArea symbol={symbol} />
          </Suspense>
          <Suspense fallback={<Skeleton className="h-[420px] rounded-lg" />}>
            <NewsArea symbol={symbol} />
          </Suspense>
        </div>
        <div className="space-y-6">
          <StatsGrid quote={quote} />
          <Suspense fallback={<Skeleton className="h-[280px] rounded-lg" />}>
            <ForecastArea symbol={symbol} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

async function ChartArea({ symbol }: { symbol: string }) {
  const data = await getHistorical(symbol, "1Y")
  if (data.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        No historical data available for this symbol.
      </div>
    )
  }
  const indicators = computeIndicators(data)
  return (
    <div className="space-y-6">
      <PriceChartSection symbol={symbol} initialData={data} initialIndicators={indicators} />
      <IndicatorPanels symbol={symbol} initialData={data} initialIndicators={indicators} />
    </div>
  )
}

async function ForecastArea({ symbol }: { symbol: string }) {
  const data = await getHistorical(symbol, "1Y")
  if (data.length < 30) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        Not enough history for a forecast.
      </div>
    )
  }
  const indicators = computeIndicators(data)
  const sig = generateSignal(data, indicators)
  const prediction = predictPrices(data, 7, 90)
  prediction.symbol = symbol
  return (
    <div className="space-y-6">
      <SignalCard signal={sig.signal} confidence={prediction.confidence} rationale={prediction.rationale} />
      <ForecastCard prediction={prediction} lastClose={data[data.length - 1].close} />
    </div>
  )
}

async function NewsArea({ symbol }: { symbol: string }) {
  const news = await getNews(symbol)
  const sentiments = news.map((n) => n.sentiment).filter(Boolean) as NonNullable<
    (typeof news)[number]["sentiment"]
  >[]
  const aggregate = aggregateSentiment(sentiments)
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1">
        <SentimentCard aggregate={aggregate} />
      </div>
      <div className="md:col-span-2">
        <NewsFeed news={news} />
      </div>
    </div>
  )
}
