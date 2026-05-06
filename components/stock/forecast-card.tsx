"use client"

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { formatCurrency, formatDate, formatPercent } from "@/lib/format"
import type { PredictionResult } from "@/lib/types"

interface Props {
  prediction: PredictionResult
  lastClose: number
}

export function ForecastCard({ prediction, lastClose }: Props) {
  const horizonDays = prediction.forecast.length
  const targetPrice = prediction.forecast[horizonDays - 1].predicted
  const expectedReturn = (targetPrice - lastClose) / lastClose

  const rows = [
    {
      date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
      actual: lastClose,
      predicted: lastClose,
      lower: lastClose,
      upper: lastClose,
    },
    ...prediction.forecast.map((f) => ({
      date: f.date,
      actual: null as number | null,
      predicted: f.predicted,
      lower: f.lower,
      upper: f.upper,
    })),
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4" />
            ML Forecast
          </CardTitle>
          <span className="text-xs text-muted-foreground">{horizonDays}-day horizon</span>
        </div>
        <CardDescription className="text-xs">
          Ensemble of linear regression, drift, and Holt&apos;s exponential smoothing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Target Price" value={formatCurrency(targetPrice)} />
          <Stat
            label="Expected Return"
            value={formatPercent(expectedReturn * 100)}
            tone={expectedReturn > 0 ? "up" : expectedReturn < 0 ? "down" : "flat"}
          />
        </div>

        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => formatDate(v)}
                stroke="var(--muted-foreground)"
                fontSize={10}
                minTickGap={20}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={10}
                width={50}
                orientation="right"
                tickFormatter={(v) => `$${v.toFixed(0)}`}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<ForecastTooltip />} />
              <ReferenceLine y={lastClose} stroke="var(--muted-foreground)" strokeDasharray="2 4" />
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="url(#bandFill)"
                stackId="band"
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="var(--background)"
                stackId="band2"
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="var(--chart-3)"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "var(--chart-3)" }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1.5 pt-2 border-t">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Model Outputs
          </h4>
          <ModelLine label="Linear Regression" value={prediction.modelEnsemble.linearRegression} />
          <ModelLine label="Drift Method" value={prediction.modelEnsemble.movingAverageDrift} />
          <ModelLine label="Holt Smoothing" value={prediction.modelEnsemble.exponentialSmoothing} />
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
          <Metric label="RMSE" value={prediction.metrics.rmse.toFixed(2)} />
          <Metric label="MAE" value={prediction.metrics.mae.toFixed(2)} />
          <Metric
            label="R²"
            value={prediction.metrics.rSquared.toFixed(3)}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  tone = "flat",
}: {
  label: string
  value: string
  tone?: "up" | "down" | "flat"
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={
          "num text-lg font-semibold " +
          (tone === "up" ? "text-bullish" : tone === "down" ? "text-bearish" : "")
        }
      >
        {value}
      </div>
    </div>
  )
}

function ModelLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="num font-medium">{formatCurrency(value)}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="num font-medium">{value}</div>
    </div>
  )
}

function ForecastTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; dataKey?: string; payload?: Record<string, unknown> }>
  label?: string
}) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0].payload as
    | { predicted?: number; lower?: number; upper?: number }
    | undefined
  if (!row) return null
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md space-y-1">
      <div className="font-medium">
        {label ? formatDate(label, { year: "numeric", month: "short", day: "numeric" }) : ""}
      </div>
      {row.predicted != null && (
        <div className="flex justify-between gap-4 num">
          <span className="text-muted-foreground">Predicted</span>
          <span className="font-medium">{formatCurrency(row.predicted)}</span>
        </div>
      )}
      {row.lower != null && row.upper != null && (
        <div className="flex justify-between gap-4 num text-muted-foreground">
          <span>95% CI</span>
          <span>
            {formatCurrency(row.lower)} – {formatCurrency(row.upper)}
          </span>
        </div>
      )}
    </div>
  )
}
