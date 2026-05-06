"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smile, Frown, Meh } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AggregateSentiment } from "@/lib/types"

export function SentimentCard({ aggregate }: { aggregate: AggregateSentiment }) {
  if (aggregate.count === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">News Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-6 text-center">
            No news available to analyze.
          </p>
        </CardContent>
      </Card>
    )
  }

  const data = [
    { name: "Positive", value: aggregate.positive, color: "var(--bullish)" },
    { name: "Neutral", value: aggregate.neutral, color: "var(--muted-foreground)" },
    { name: "Negative", value: aggregate.negative, color: "var(--bearish)" },
  ].filter((d) => d.value > 0)

  const label = aggregate.overall.label
  const Icon = label === "POSITIVE" ? Smile : label === "NEGATIVE" ? Frown : Meh

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">News Sentiment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative h-[140px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={42}
                outerRadius={62}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <Icon
              className={cn(
                "size-5 mb-1",
                label === "POSITIVE" && "text-bullish",
                label === "NEGATIVE" && "text-bearish",
                label === "NEUTRAL" && "text-muted-foreground",
              )}
            />
            <div className="num text-sm font-semibold">
              {aggregate.overall.score >= 0 ? "+" : ""}
              {aggregate.overall.score.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="space-y-1.5 text-xs">
          <Row label="Positive" value={aggregate.positive} total={aggregate.count} color="bullish" />
          <Row label="Neutral" value={aggregate.neutral} total={aggregate.count} color="neutral" />
          <Row label="Negative" value={aggregate.negative} total={aggregate.count} color="bearish" />
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed pt-2 border-t">
          Based on {aggregate.count} headlines analyzed via VADER-style financial lexicon.
        </p>
      </CardContent>
    </Card>
  )
}

function Row({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: "bullish" | "bearish" | "neutral"
}) {
  const pct = total === 0 ? 0 : (value / total) * 100
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="num font-medium">
          {value} <span className="text-muted-foreground font-normal">({pct.toFixed(0)}%)</span>
        </span>
      </div>
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            color === "bullish" && "bg-bullish",
            color === "bearish" && "bg-bearish",
            color === "neutral" && "bg-muted-foreground/60",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
