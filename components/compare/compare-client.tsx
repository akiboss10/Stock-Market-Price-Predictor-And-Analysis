"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { X, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { GlobalSearch } from "@/components/global-search"
import { Skeleton } from "@/components/ui/skeleton"
import { fmtPrice, fmtPct, fmtNum } from "@/lib/format"
import type { HistoricalPoint, Quote } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function CompareClient() {
  const [symbols, setSymbols] = useState<string[]>(["AAPL", "MSFT", "NVDA"])
  const [adding, setAdding] = useState(false)

  function add(s: string) {
    const sym = s.toUpperCase().trim()
    if (!sym || symbols.includes(sym) || symbols.length >= 5) return
    setSymbols([...symbols, sym])
    setAdding(false)
  }
  function remove(s: string) {
    setSymbols(symbols.filter((x) => x !== s))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {symbols.map((s, i) => (
          <Badge key={s} variant="outline" className="gap-1.5 pl-2.5 pr-1 py-1">
            <span className="size-2 rounded-full" style={{ backgroundColor: COLORS[i] }} aria-hidden />
            <span className="font-mono">{s}</span>
            <button
              onClick={() => remove(s)}
              className="ml-1 rounded p-0.5 hover:bg-secondary"
              aria-label={`Remove ${s}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {symbols.length < 5 && (
          <>
            {adding ? (
              <div className="w-64">
                <GlobalSearch onSelect={(sym) => add(sym)} placeholder="Add symbol..." />
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAdding(true)} className="h-7">
                <Plus className="size-3.5 mr-1" /> Add Symbol
              </Button>
            )}
          </>
        )}
      </div>

      {symbols.length > 0 && <PerformanceChart symbols={symbols} />}
      {symbols.length > 0 && <FundamentalsTable symbols={symbols} />}
    </div>
  )
}

function PerformanceChart({ symbols }: { symbols: string[] }) {
  const { data, isLoading } = useSWR<{ data: Record<string, HistoricalPoint[]> }>(
    `/api/historical-multi?symbols=${symbols.join(",")}&range=1Y`,
    fetcher,
  )

  const merged = useMemo(() => {
    if (!data?.data) return []
    // Normalize each series to % change from the first date.
    const seriesByDate = new Map<string, Record<string, number | string>>()
    symbols.forEach((sym) => {
      const points = data.data[sym] ?? []
      if (points.length === 0) return
      const base = points[0].close
      points.forEach((p) => {
        const row = seriesByDate.get(p.date) ?? { date: p.date }
        row[sym] = ((p.close - base) / base) * 100
        seriesByDate.set(p.date, row)
      })
    })
    return Array.from(seriesByDate.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date)),
    )
  }, [data, symbols])

  const chartConfig = symbols.reduce<ChartConfig>((acc, s, i) => {
    acc[s] = { label: s, color: COLORS[i] }
    return acc
  }, {})

  return (
    <Card>
      <CardHeader>
        <CardTitle>Normalized Performance (1Y, % change)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={merged} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: "var(--border)" }}
                  tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                  width={50}
                />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        `${(value as number).toFixed(2)}%`,
                        String(name),
                      ]}
                    />
                  }
                />
                <Legend />
                {symbols.map((s, i) => (
                  <Line
                    key={s}
                    type="monotone"
                    dataKey={s}
                    stroke={COLORS[i]}
                    strokeWidth={1.6}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

function FundamentalsTable({ symbols }: { symbols: string[] }) {
  const { data, isLoading } = useSWR<{ quotes: Quote[] }>(
    `/api/quotes?symbols=${symbols.join(",")}`,
    fetcher,
    { refreshInterval: 30_000 },
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fundamentals</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-6">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-4 py-2 font-medium">Metric</th>
                {symbols.map((s) => (
                  <th key={s} className="px-4 py-2 font-mono font-medium text-foreground">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {([
                ["Price", (q: Quote) => fmtPrice(q.regularMarketPrice)],
                ["Day Change %", (q: Quote) => fmtPct(q.regularMarketChangePercent)],
                ["52W High", (q: Quote) => fmtPrice(q.fiftyTwoWeekHigh)],
                ["52W Low", (q: Quote) => fmtPrice(q.fiftyTwoWeekLow)],
                ["Market Cap", (q: Quote) => fmtNum(q.marketCap)],
                ["P/E (TTM)", (q: Quote) => (q.trailingPE ? q.trailingPE.toFixed(2) : "—")],
                ["Forward P/E", (q: Quote) => (q.forwardPE ? q.forwardPE.toFixed(2) : "—")],
                ["EPS (TTM)", (q: Quote) => (q.epsTrailingTwelveMonths?.toFixed(2) ?? "—")],
                ["Volume", (q: Quote) => fmtNum(q.regularMarketVolume)],
              ] as const).map(([label, fn]) => (
                <tr key={label}>
                  <td className="px-4 py-2 text-muted-foreground">{label}</td>
                  {symbols.map((s) => {
                    const q = data?.quotes?.find((x) => x.symbol === s)
                    return (
                      <td key={s} className="px-4 py-2 font-mono">
                        {q ? fn(q) : "—"}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
