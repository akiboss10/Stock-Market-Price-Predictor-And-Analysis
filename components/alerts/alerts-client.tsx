"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { Bell, BellRing, Trash2, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ChangePill } from "@/components/change-pill"
import { type Alert, getAlerts, removeAlert, updateAlert } from "@/lib/storage"
import { fmtPrice } from "@/lib/format"
import type { Quote } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AlertsClient() {
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    setAlerts(getAlerts())
    const handler = () => setAlerts(getAlerts())
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  const symbols = useMemo(() => Array.from(new Set(alerts.map((a) => a.symbol))), [alerts])
  const { data: quotes } = useSWR<{ quotes: Quote[] }>(
    symbols.length > 0 ? `/api/quotes?symbols=${symbols.join(",")}` : null,
    fetcher,
    { refreshInterval: 30_000 },
  )

  const quoteMap = useMemo(() => {
    const m = new Map<string, Quote>()
    quotes?.quotes?.forEach((q) => m.set(q.symbol, q))
    return m
  }, [quotes])

  // Auto-trigger alerts when conditions are met
  useEffect(() => {
    if (!quotes?.quotes?.length) return
    let changed = false
    for (const a of alerts) {
      if (a.triggered) continue
      const q = quoteMap.get(a.symbol)
      if (!q) continue
      const price = q.regularMarketPrice
      const hit = a.direction === "above" ? price >= a.targetPrice : price <= a.targetPrice
      if (hit) {
        updateAlert(a.id, { triggered: true, triggeredAt: new Date().toISOString() })
        changed = true
      }
    }
    if (changed) setAlerts(getAlerts())
  }, [quoteMap, alerts])

  function handleDelete(id: string) {
    removeAlert(id)
    setAlerts(getAlerts())
  }

  if (alerts.length === 0) {
    return (
      <Empty className="border border-dashed border-border rounded-xl">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bell className="size-5" />
          </EmptyMedia>
          <EmptyTitle>No alerts yet</EmptyTitle>
          <EmptyDescription>
            Open any stock and click &quot;Set Alert&quot; to get notified when it crosses a target price.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const active = alerts.filter((a) => !a.triggered)
  const triggered = alerts.filter((a) => a.triggered)

  return (
    <div className="flex flex-col gap-6">
      <Section title="Active" icon={<Bell className="size-4" />} alerts={active} quoteMap={quoteMap} onDelete={handleDelete} />
      {triggered.length > 0 && (
        <Section
          title="Triggered"
          icon={<BellRing className="size-4 text-bullish" />}
          alerts={triggered}
          quoteMap={quoteMap}
          onDelete={handleDelete}
          triggered
        />
      )}
    </div>
  )
}

function Section({
  title,
  icon,
  alerts,
  quoteMap,
  onDelete,
  triggered = false,
}: {
  title: string
  icon: React.ReactNode
  alerts: Alert[]
  quoteMap: Map<string, Quote>
  onDelete: (id: string) => void
  triggered?: boolean
}) {
  if (alerts.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {icon}
          {title}
          <Badge variant="secondary" className="ml-1">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {alerts.map((a) => {
            const q = quoteMap.get(a.symbol)
            const price = q?.regularMarketPrice ?? 0
            const distancePct = q ? ((a.targetPrice - price) / price) * 100 : 0
            return (
              <div key={a.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary">
                  {a.direction === "above" ? (
                    <ArrowUp className="size-4 text-bullish" />
                  ) : (
                    <ArrowDown className="size-4 text-bearish" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/stock/${a.symbol}`} className="font-mono font-semibold text-sm hover:underline">
                      {a.symbol}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {a.direction === "above" ? "rises above" : "falls below"} {fmtPrice(a.targetPrice)}
                    </span>
                  </div>
                  {a.note && <div className="text-xs text-muted-foreground mt-0.5 truncate">{a.note}</div>}
                  {triggered && a.triggeredAt && (
                    <div className="text-xs text-bullish mt-0.5">
                      Triggered {new Date(a.triggeredAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-end gap-0.5">
                  <span className="font-mono text-sm">{q ? fmtPrice(price) : "—"}</span>
                  {q && !triggered && (
                    <span className="text-xs text-muted-foreground">
                      {distancePct > 0 ? "+" : ""}
                      {distancePct.toFixed(2)}% to target
                    </span>
                  )}
                  {q && <ChangePill change={q.regularMarketChange} changePercent={q.regularMarketChangePercent} compact />}
                </div>
                <Button variant="ghost" size="icon" onClick={() => onDelete(a.id)} aria-label="Delete alert">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
