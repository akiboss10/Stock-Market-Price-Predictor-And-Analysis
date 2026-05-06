"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { Loader2 } from "lucide-react"
import { computeIndicators } from "@/lib/indicators"
import type {
  HistoricalPoint,
  IndicatorBundle,
  TimeRange,
} from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/format"

const RANGES: TimeRange[] = ["1M", "3M", "6M", "1Y", "5Y", "MAX"]

interface Props {
  symbol: string
  initialData: HistoricalPoint[]
  initialIndicators: IndicatorBundle
}

interface ChartRow {
  date: string
  close: number
  sma20: number | null
  sma50: number | null
  sma200: number | null
  bbUpper: number | null
  bbLower: number | null
  volume: number
}

export function PriceChartSection({ symbol, initialData, initialIndicators }: Props) {
  const [range, setRange] = useState<TimeRange>("1Y")
  const [data, setData] = useState<HistoricalPoint[]>(initialData)
  const [indicators, setIndicators] = useState<IndicatorBundle>(initialIndicators)
  const [loading, setLoading] = useState(false)
  const [showSMA20, setShowSMA20] = useState(true)
  const [showSMA50, setShowSMA50] = useState(true)
  const [showSMA200, setShowSMA200] = useState(false)
  const [showBB, setShowBB] = useState(false)

  useEffect(() => {
    if (range === "1Y" && data === initialData) return
    let active = true
    setLoading(true)
    fetch(`/api/historical/${symbol}?range=${range}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return
        const newData: HistoricalPoint[] = j.data ?? []
        setData(newData)
        setIndicators(computeIndicators(newData))
      })
      .catch(() => {})
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [range, symbol, data, initialData])

  const rows: ChartRow[] = useMemo(() => {
    return data.map((p, i) => ({
      date: p.date,
      close: p.close,
      sma20: indicators.sma20[i]?.value ?? null,
      sma50: indicators.sma50[i]?.value ?? null,
      sma200: indicators.sma200[i]?.value ?? null,
      bbUpper: indicators.bollinger[i]?.upper ?? null,
      bbLower: indicators.bollinger[i]?.lower ?? null,
      volume: p.volume,
    }))
  }, [data, indicators])

  const first = data[0]?.close ?? 0
  const last = data[data.length - 1]?.close ?? 0
  const isUp = last >= first
  const stroke = isUp ? "var(--bullish)" : "var(--bearish)"
  const fillId = isUp ? "fillUp" : "fillDown"

  const yMin = Math.min(...rows.map((r) => r.close))
  const yMax = Math.max(...rows.map((r) => r.close))
  const padding = (yMax - yMin) * 0.05

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-base">Price History</CardTitle>
          <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
            <TabsList className="h-8">
              {RANGES.map((r) => (
                <TabsTrigger key={r} value={r} className="text-xs px-2 h-6">
                  {r}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-xs text-muted-foreground mr-1">Overlays:</span>
          <Toggle
            size="sm"
            pressed={showSMA20}
            onPressedChange={setShowSMA20}
            className="text-xs h-7 data-[state=on]:bg-chart-3/20 data-[state=on]:text-chart-3"
          >
            SMA 20
          </Toggle>
          <Toggle
            size="sm"
            pressed={showSMA50}
            onPressedChange={setShowSMA50}
            className="text-xs h-7 data-[state=on]:bg-chart-4/20 data-[state=on]:text-chart-4"
          >
            SMA 50
          </Toggle>
          <Toggle
            size="sm"
            pressed={showSMA200}
            onPressedChange={setShowSMA200}
            className="text-xs h-7 data-[state=on]:bg-chart-5/20 data-[state=on]:text-foreground"
          >
            SMA 200
          </Toggle>
          <Toggle
            size="sm"
            pressed={showBB}
            onPressedChange={setShowBB}
            className="text-xs h-7"
          >
            Bollinger
          </Toggle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/60 backdrop-blur-sm rounded">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillUp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--bullish)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--bullish)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillDown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--bearish)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--bearish)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v)}
                stroke="var(--muted-foreground)"
                fontSize={11}
                minTickGap={40}
              />
              <YAxis
                domain={[yMin - padding, yMax + padding]}
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                stroke="var(--muted-foreground)"
                fontSize={11}
                width={55}
                orientation="right"
              />
              <Tooltip content={<PriceTooltip />} />
              <Area
                type="monotone"
                dataKey="close"
                stroke={stroke}
                strokeWidth={1.8}
                fill={`url(#${fillId})`}
                isAnimationActive={false}
              />
              {showSMA20 && (
                <Line
                  type="monotone"
                  dataKey="sma20"
                  stroke="var(--chart-3)"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showSMA50 && (
                <Line
                  type="monotone"
                  dataKey="sma50"
                  stroke="var(--chart-4)"
                  strokeWidth={1.2}
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showSMA200 && (
                <Line
                  type="monotone"
                  dataKey="sma200"
                  stroke="var(--chart-5)"
                  strokeWidth={1.2}
                  strokeDasharray="4 2"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              {showBB && (
                <>
                  <Line
                    type="monotone"
                    dataKey="bbUpper"
                    stroke="var(--muted-foreground)"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="bbLower"
                    stroke="var(--muted-foreground)"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                </>
              )}
              <ReferenceLine y={first} stroke="var(--muted-foreground)" strokeDasharray="2 4" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function PriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; dataKey?: string; color?: string }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-medium mb-1.5">
        {label ? formatDate(label, { year: "numeric", month: "short", day: "numeric" }) : ""}
      </div>
      {payload.map((p, i) => {
        if (p.value == null) return null
        return (
          <div key={i} className="flex items-center justify-between gap-4 num">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ background: p.color }}
              />
              {labelFor(p.dataKey)}
            </span>
            <span className="font-medium">{formatCurrency(p.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

function labelFor(key: string | undefined): string {
  switch (key) {
    case "close":
      return "Close"
    case "sma20":
      return "SMA 20"
    case "sma50":
      return "SMA 50"
    case "sma200":
      return "SMA 200"
    case "bbUpper":
      return "BB Upper"
    case "bbLower":
      return "BB Lower"
    default:
      return key ?? ""
  }
}
