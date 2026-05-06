import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompact, formatCurrency, formatNumber, formatPercent } from "@/lib/format"
import type { Quote } from "@/lib/types"

export function StatsGrid({ quote }: { quote: Quote }) {
  const cur = quote.currency ?? "USD"
  const stats: { label: string; value: string }[] = []

  if (quote.regularMarketOpen != null)
    stats.push({ label: "Open", value: formatCurrency(quote.regularMarketOpen, cur) })
  if (quote.regularMarketPreviousClose != null)
    stats.push({
      label: "Prev Close",
      value: formatCurrency(quote.regularMarketPreviousClose, cur),
    })
  if (quote.regularMarketDayHigh != null)
    stats.push({ label: "Day High", value: formatCurrency(quote.regularMarketDayHigh, cur) })
  if (quote.regularMarketDayLow != null)
    stats.push({ label: "Day Low", value: formatCurrency(quote.regularMarketDayLow, cur) })
  if (quote.fiftyTwoWeekHigh != null)
    stats.push({ label: "52W High", value: formatCurrency(quote.fiftyTwoWeekHigh, cur) })
  if (quote.fiftyTwoWeekLow != null)
    stats.push({ label: "52W Low", value: formatCurrency(quote.fiftyTwoWeekLow, cur) })
  if (quote.regularMarketVolume != null)
    stats.push({ label: "Volume", value: formatCompact(quote.regularMarketVolume) })
  if (quote.averageVolume != null)
    stats.push({ label: "Avg Volume", value: formatCompact(quote.averageVolume) })
  if (quote.marketCap != null)
    stats.push({ label: "Market Cap", value: formatCompact(quote.marketCap) })
  if (quote.trailingPE != null)
    stats.push({ label: "P/E (TTM)", value: formatNumber(quote.trailingPE, 2) })
  if (quote.forwardPE != null)
    stats.push({ label: "Forward P/E", value: formatNumber(quote.forwardPE, 2) })
  if (quote.epsTrailingTwelveMonths != null)
    stats.push({
      label: "EPS (TTM)",
      value: formatCurrency(quote.epsTrailingTwelveMonths, cur),
    })
  if (quote.dividendYield != null && quote.dividendYield > 0)
    stats.push({
      label: "Div Yield",
      value: formatPercent(quote.dividendYield * 100, 2),
    })
  if (quote.beta != null) stats.push({ label: "Beta", value: formatNumber(quote.beta, 2) })

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Key Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="num text-sm font-medium">{s.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
