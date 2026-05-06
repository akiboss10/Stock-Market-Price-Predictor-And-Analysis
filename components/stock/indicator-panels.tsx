"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
  Cell,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { HistoricalPoint, IndicatorBundle } from "@/lib/types"
import { formatDate } from "@/lib/format"

interface Props {
  symbol: string
  initialData: HistoricalPoint[]
  initialIndicators: IndicatorBundle
}

export function IndicatorPanels({ initialData, initialIndicators }: Props) {
  // Use the last 6 months of data for clarity in oscillator panels
  const slice = Math.min(initialData.length, 130)
  const start = Math.max(0, initialData.length - slice)

  const rsiRows = useMemo(
    () =>
      initialData.slice(start).map((p, i) => ({
        date: p.date,
        rsi: initialIndicators.rsi14[start + i]?.value ?? null,
      })),
    [initialData, initialIndicators, start],
  )

  const macdRows = useMemo(
    () =>
      initialData.slice(start).map((p, i) => {
        const m = initialIndicators.macd[start + i]
        return {
          date: p.date,
          macd: m?.macd ?? null,
          signal: m?.signal ?? null,
          histogram: m?.histogram ?? null,
        }
      }),
    [initialData, initialIndicators, start],
  )

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">RSI (14)</CardTitle>
          <CardDescription className="text-xs">
            Relative Strength Index. &gt; 70 overbought, &lt; 30 oversold.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rsiRows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatDate(v)}
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  minTickGap={40}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 30, 50, 70, 100]}
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  width={28}
                  orientation="right"
                />
                <Tooltip content={<MiniTooltip valueLabel="RSI" />} />
                <ReferenceLine y={70} stroke="var(--bearish)" strokeDasharray="3 3" strokeOpacity={0.6} />
                <ReferenceLine y={30} stroke="var(--bullish)" strokeDasharray="3 3" strokeOpacity={0.6} />
                <ReferenceLine y={50} stroke="var(--muted-foreground)" strokeDasharray="2 4" strokeOpacity={0.5} />
                <Line
                  type="monotone"
                  dataKey="rsi"
                  stroke="var(--chart-3)"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">MACD (12, 26, 9)</CardTitle>
          <CardDescription className="text-xs">
            Trend & momentum. Histogram = MACD − Signal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={macdRows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatDate(v)}
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  minTickGap={40}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  width={36}
                  orientation="right"
                />
                <Tooltip content={<MiniTooltip />} />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.6} />
                <Bar dataKey="histogram" isAnimationActive={false}>
                  {macdRows.map((row, i) => (
                    <Cell
                      key={i}
                      fill={
                        (row.histogram ?? 0) >= 0 ? "var(--bullish)" : "var(--bearish)"
                      }
                      fillOpacity={0.55}
                    />
                  ))}
                </Bar>
                <Line
                  type="monotone"
                  dataKey="macd"
                  stroke="var(--chart-3)"
                  strokeWidth={1.4}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="signal"
                  stroke="var(--chart-4)"
                  strokeWidth={1.4}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Volume</CardTitle>
          <CardDescription className="text-xs">
            Trading volume colored by daily price direction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={initialData.slice(start).map((p, i, arr) => ({
                  date: p.date,
                  volume: p.volume,
                  up: i === 0 ? p.close >= p.open : p.close >= arr[i - 1].close,
                }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatDate(v)}
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  minTickGap={40}
                />
                <YAxis
                  tickFormatter={(v) =>
                    new Intl.NumberFormat("en-US", { notation: "compact" }).format(v)
                  }
                  stroke="var(--muted-foreground)"
                  fontSize={10}
                  width={50}
                  orientation="right"
                />
                <Tooltip content={<MiniTooltip />} />
                <Bar dataKey="volume" isAnimationActive={false}>
                  {initialData.slice(start).map((p, i, arr) => {
                    const up = i === 0 ? p.close >= p.open : p.close >= arr[i - 1].close
                    return (
                      <Cell
                        key={i}
                        fill={up ? "var(--bullish)" : "var(--bearish)"}
                        fillOpacity={0.6}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MiniTooltip({
  active,
  payload,
  label,
  valueLabel,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; dataKey?: string; color?: string }>
  label?: string
  valueLabel?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-medium mb-1.5">
        {label ? formatDate(label, { year: "numeric", month: "short", day: "numeric" }) : ""}
      </div>
      {payload.map((p, i) => {
        if (p.value == null) return null
        const lbl = valueLabel ?? p.dataKey ?? p.name
        const formatted =
          p.dataKey === "volume"
            ? new Intl.NumberFormat("en-US", { notation: "compact" }).format(p.value)
            : Number(p.value).toFixed(2)
        return (
          <div key={i} className="flex items-center justify-between gap-4 num">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: p.color }} />
              {lbl}
            </span>
            <span className="font-medium">{formatted}</span>
          </div>
        )
      })}
    </div>
  )
}
