"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Briefcase, TrendingUp, Wallet, PieChartIcon } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import Link from "next/link"
import { useFetch } from "@/hooks/use-fetch"
import {
  getPortfolio,
  removeHolding,
  subscribe,
} from "@/lib/storage"
import { formatCompact, formatCurrency, formatPercent } from "@/lib/format"
import { ChangePill } from "@/components/change-pill"
import { AddHoldingDialog } from "@/components/portfolio/add-holding-dialog"
import { toast } from "sonner"
import type { PortfolioHolding, Quote } from "@/lib/types"
import { cn } from "@/lib/utils"

interface QuotesResp {
  quotes: Quote[]
}

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-2)",
  "var(--chart-5)",
  "var(--bullish)",
  "var(--bearish)",
]

export function PortfolioClient() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  useEffect(() => {
    setHoldings(getPortfolio())
    setHydrated(true)
    return subscribe("portfolio", () => setHoldings(getPortfolio()))
  }, [])

  const symbols = useMemo(
    () => Array.from(new Set(holdings.map((h) => h.symbol))).sort(),
    [holdings],
  )
  const url = symbols.length > 0 ? `/api/quotes?symbols=${symbols.join(",")}` : null
  const { data, loading } = useFetch<QuotesResp>(url, 60_000)
  const quotes = data?.quotes ?? []
  const quoteMap = useMemo(() => new Map(quotes.map((q) => [q.symbol, q])), [quotes])

  const enriched = holdings.map((h) => {
    const q = quoteMap.get(h.symbol)
    const price = q?.regularMarketPrice ?? h.avgCost
    const value = price * h.shares
    const cost = h.avgCost * h.shares
    const pl = value - cost
    const plPct = cost > 0 ? (pl / cost) * 100 : 0
    const dayChange = (q?.regularMarketChange ?? 0) * h.shares
    const dayChangePct = q?.regularMarketChangePercent ?? 0
    return { holding: h, quote: q, price, value, cost, pl, plPct, dayChange, dayChangePct }
  })

  const totalValue = enriched.reduce((s, e) => s + e.value, 0)
  const totalCost = enriched.reduce((s, e) => s + e.cost, 0)
  const totalPL = totalValue - totalCost
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0
  const totalDayChange = enriched.reduce((s, e) => s + e.dayChange, 0)
  const totalDayChangePct =
    totalValue > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0

  const allocation = enriched
    .filter((e) => e.value > 0)
    .map((e, i) => ({
      name: e.holding.symbol,
      value: e.value,
      pct: totalValue > 0 ? (e.value / totalValue) * 100 : 0,
      color: PALETTE[i % PALETTE.length],
    }))
    .sort((a, b) => b.value - a.value)

  const handleDelete = (id: string, sym: string) => {
    removeHolding(id)
    toast.success("Holding removed", { description: `${sym} has been removed from your portfolio.` })
  }

  if (!hydrated) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <Empty>
            <EmptyHeader>
              <Briefcase className="size-10 text-muted-foreground mb-2" />
              <EmptyTitle>Your portfolio is empty</EmptyTitle>
              <EmptyDescription>
                Add your first holding to start tracking gains, losses, and asset allocation.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                Add Holding
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
        <AddHoldingDialog open={addOpen} onOpenChange={setAddOpen} />
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Value"
          value={formatCurrency(totalValue)}
          icon={Wallet}
        />
        <SummaryCard
          label="Total Cost"
          value={formatCurrency(totalCost)}
          icon={Briefcase}
        />
        <SummaryCard
          label="Total P&L"
          value={formatCurrency(totalPL)}
          subValue={formatPercent(totalPLPct)}
          tone={totalPL > 0 ? "up" : totalPL < 0 ? "down" : "flat"}
          icon={TrendingUp}
        />
        <SummaryCard
          label="Today's Change"
          value={formatCurrency(totalDayChange)}
          subValue={formatPercent(totalDayChangePct)}
          tone={totalDayChange > 0 ? "up" : totalDayChange < 0 ? "down" : "flat"}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Holdings</CardTitle>
              <CardDescription className="text-xs">
                {loading && quotes.length === 0 ? "Loading prices..." : `${holdings.length} position${holdings.length === 1 ? "" : "s"}`}
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">P&amp;L</TableHead>
                  <TableHead className="text-right">Today</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map((e) => (
                  <TableRow key={e.holding.id}>
                    <TableCell>
                      <Link
                        href={`/stock/${e.holding.symbol}`}
                        className="font-medium hover:underline"
                      >
                        {e.holding.symbol}
                      </Link>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {e.quote?.shortName ?? ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-right num">{e.holding.shares}</TableCell>
                    <TableCell className="text-right num">
                      {formatCurrency(e.holding.avgCost)}
                    </TableCell>
                    <TableCell className="text-right num">{formatCurrency(e.price)}</TableCell>
                    <TableCell className="text-right num font-medium">
                      {formatCurrency(e.value)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className={cn(
                          "num font-medium",
                          e.pl > 0 && "text-bullish",
                          e.pl < 0 && "text-bearish",
                        )}
                      >
                        {e.pl >= 0 ? "+" : ""}
                        {formatCurrency(e.pl)}
                      </div>
                      <div className="num text-xs text-muted-foreground">
                        {formatPercent(e.plPct)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <ChangePill value={e.dayChangePct} size="sm" showIcon={false} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(e.holding.id, e.holding.symbol)}
                        aria-label={`Remove ${e.holding.symbol}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="size-4" />
              Allocation
            </CardTitle>
            <CardDescription className="text-xs">By portfolio value</CardDescription>
          </CardHeader>
          <CardContent>
            {allocation.length > 0 ? (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={allocation}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={2}
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {allocation.map((a) => (
                          <Cell key={a.name} fill={a.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          fontSize: 12,
                        }}
                        formatter={(value: number, name: string, item) => {
                          const pct = (item?.payload as { pct?: number })?.pct ?? 0
                          return [
                            `${formatCompact(value)} (${pct.toFixed(1)}%)`,
                            name,
                          ]
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1.5">
                  {allocation.map((a) => (
                    <div
                      key={a.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ background: a.color }}
                        />
                        <span className="font-medium">{a.name}</span>
                      </div>
                      <span className="num text-muted-foreground">
                        {a.pct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No allocation to display.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AddHoldingDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  )
}

function SummaryCard({
  label,
  value,
  subValue,
  tone = "flat",
  icon: Icon,
}: {
  label: string
  value: string
  subValue?: string
  tone?: "up" | "down" | "flat"
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>
          <Icon className="size-3.5" />
        </div>
        <div
          className={cn(
            "num text-xl md:text-2xl font-semibold tracking-tight mt-1",
            tone === "up" && "text-bullish",
            tone === "down" && "text-bearish",
          )}
        >
          {value}
        </div>
        {subValue && (
          <div
            className={cn(
              "num text-xs mt-0.5",
              tone === "up" && "text-bullish",
              tone === "down" && "text-bearish",
              tone === "flat" && "text-muted-foreground",
            )}
          >
            {subValue}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
