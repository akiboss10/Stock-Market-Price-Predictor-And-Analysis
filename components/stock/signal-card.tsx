"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, MinusCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  signal: "BUY" | "SELL" | "HOLD"
  confidence: number
  rationale: string[]
}

export function SignalCard({ signal, confidence, rationale }: Props) {
  const meta = {
    BUY: {
      color: "text-bullish",
      bg: "bg-bullish-soft",
      ring: "ring-bullish/30",
      icon: CheckCircle2,
      label: "Bullish",
    },
    SELL: {
      color: "text-bearish",
      bg: "bg-bearish-soft",
      ring: "ring-bearish/30",
      icon: AlertCircle,
      label: "Bearish",
    },
    HOLD: {
      color: "text-foreground",
      bg: "bg-muted",
      ring: "ring-border",
      icon: MinusCircle,
      label: "Neutral",
    },
  }[signal]
  const Icon = meta.icon
  const pct = Math.round(confidence * 100)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Trading Signal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={cn("rounded-md p-4 ring-1", meta.bg, meta.ring)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon className={cn("size-7", meta.color)} />
              <div>
                <div className={cn("text-2xl font-bold leading-none", meta.color)}>
                  {signal}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{meta.label} bias</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Confidence</div>
              <div className="num text-lg font-semibold">{pct}%</div>
            </div>
          </div>
          <Progress value={pct} className="h-1.5 mt-3" />
        </div>

        {rationale.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Rationale
            </h4>
            <ul className="space-y-1.5 text-sm">
              {rationale.map((r, i) => (
                <li key={i} className="flex gap-2 text-muted-foreground">
                  <span className="text-foreground/40 select-none">•</span>
                  <span className="leading-snug">{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground leading-relaxed pt-2 border-t">
          Educational use only. Not investment advice. Past performance is not indicative
          of future results.
        </p>
      </CardContent>
    </Card>
  )
}
