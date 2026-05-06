import { Suspense } from "react"
import { getQuotes, MAJOR_INDICES, POPULAR_TICKERS } from "@/lib/yahoo"
import { QuoteCard } from "@/components/quote-card"
import { ChangePill } from "@/components/change-pill"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Activity, Sparkles } from "lucide-react"
import Link from "next/link"
import { formatCompact, formatCurrency } from "@/lib/format"
import { MarketHeatmap } from "@/components/market-heatmap"

export const revalidate = 60

export default function DashboardPage() {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader />
      <Suspense fallback={<IndicesSkeleton />}>
        <IndicesSection />
      </Suspense>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<MoversSkeleton />}>
            <MoversSection />
          </Suspense>
          <Suspense fallback={<HeatmapSkeleton />}>
            <HeatmapSection />
          </Suspense>
        </div>
        <div className="space-y-6">
          <FeaturesCard />
          <PopularSidebar />
        </div>
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Sparkles className="size-3.5" />
        <span>AI-Powered Market Intelligence</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
        Market Dashboard
      </h1>
      <p className="text-sm text-muted-foreground max-w-2xl">
        Real-time quotes, ML-driven price forecasts, technical indicators, and news
        sentiment in one institutional-grade workspace.
      </p>
    </div>
  )
}

async function IndicesSection() {
  const quotes = await getQuotes(MAJOR_INDICES.map((i) => i.symbol))
  if (quotes.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          Live market data is temporarily unavailable. Try refreshing in a moment.
        </CardContent>
      </Card>
    )
  }
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Major Indices
        </h2>
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {quotes.map((q) => {
          const name = MAJOR_INDICES.find((i) => i.symbol === q.symbol)?.name ?? q.symbol
          return <QuoteCard key={q.symbol} quote={q} displayName={name} variant="stat" />
        })}
      </div>
    </section>
  )
}

function IndicesSkeleton() {
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-[110px] rounded-lg" />
      ))}
    </div>
  )
}

async function MoversSection() {
  const quotes = await getQuotes(POPULAR_TICKERS)
  const sorted = [...quotes].sort(
    (a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent,
  )
  const gainers = sorted.slice(0, 5)
  const losers = sorted.slice(-5).reverse()

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-bullish" />
            Top Gainers
          </CardTitle>
          <CardDescription className="text-xs">
            Best performers from the popular set today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {gainers.map((q) => (
            <QuoteCard key={q.symbol} quote={q} variant="compact" />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="size-4 text-bearish" />
            Top Losers
          </CardTitle>
          <CardDescription className="text-xs">
            Worst performers from the popular set today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {losers.map((q) => (
            <QuoteCard key={q.symbol} quote={q} variant="compact" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function MoversSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Skeleton className="h-[420px] rounded-lg" />
      <Skeleton className="h-[420px] rounded-lg" />
    </div>
  )
}

async function HeatmapSection() {
  const quotes = await getQuotes(POPULAR_TICKERS)
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4" />
          Market Heatmap
        </CardTitle>
        <CardDescription className="text-xs">
          Sized by market capitalization, colored by daily change
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MarketHeatmap quotes={quotes} />
      </CardContent>
    </Card>
  )
}

function HeatmapSkeleton() {
  return <Skeleton className="h-[300px] rounded-lg" />
}

async function PopularSidebar() {
  const quotes = await getQuotes(POPULAR_TICKERS.slice(0, 8))
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Popular Stocks</CardTitle>
        <CardDescription className="text-xs">
          Trending names this session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {quotes.map((q) => (
          <Link
            key={q.symbol}
            href={`/stock/${q.symbol}`}
            className="flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-accent text-sm"
          >
            <div className="min-w-0">
              <div className="font-medium">{q.symbol}</div>
              <div className="text-xs text-muted-foreground truncate">
                {q.shortName ?? q.longName}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="num text-sm">
                {formatCurrency(q.regularMarketPrice, q.currency ?? "USD")}
              </div>
              <ChangePill
                value={q.regularMarketChangePercent}
                size="sm"
                showIcon={false}
              />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

function FeaturesCard() {
  const features = [
    {
      title: "ML Price Forecasts",
      desc: "7-day predictions from a 3-model ensemble with confidence intervals.",
    },
    {
      title: "Technical Indicators",
      desc: "RSI, MACD, Bollinger Bands, and SMA/EMA overlays.",
    },
    {
      title: "News Sentiment",
      desc: "Lexicon-based sentiment analysis on real-time financial news.",
    },
    {
      title: "Portfolio Tracking",
      desc: "Track holdings, gains, and losses with live mark-to-market.",
    },
  ]
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="size-4" />
          What&apos;s Inside
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {features.map((f) => (
          <div key={f.title} className="text-sm">
            <div className="font-medium">{f.title}</div>
            <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
