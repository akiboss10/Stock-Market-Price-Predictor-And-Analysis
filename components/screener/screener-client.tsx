"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { ChangePill } from "@/components/change-pill"
import { fmtPrice, fmtNum } from "@/lib/format"
import type { Quote } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const UNIVERSE = [
  "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B",
  "JPM", "V", "WMT", "JNJ", "MA", "PG", "HD", "CVX", "XOM", "ABBV",
  "PFE", "KO", "PEP", "BAC", "AVGO", "COST", "MRK", "TMO", "DIS",
  "ADBE", "NFLX", "CSCO", "CRM", "ORCL", "AMD", "INTC", "QCOM",
]

type SortKey = "symbol" | "price" | "changePct" | "marketCap" | "pe" | "volume"

export function ScreenerClient() {
  const { data, isLoading } = useSWR<{ quotes: Quote[] }>(
    `/api/quotes?symbols=${UNIVERSE.join(",")}`,
    fetcher,
    { refreshInterval: 60_000 },
  )

  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(2000)
  const [minChange, setMinChange] = useState(-50)
  const [sortKey, setSortKey] = useState<SortKey>("marketCap")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const filtered = useMemo(() => {
    if (!data?.quotes) return []
    return data.quotes
      .filter(
        (q) =>
          q.regularMarketPrice >= minPrice &&
          q.regularMarketPrice <= maxPrice &&
          q.regularMarketChangePercent >= minChange,
      )
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1
        const get = (q: Quote): number | string => {
          switch (sortKey) {
            case "symbol": return q.symbol
            case "price": return q.regularMarketPrice
            case "changePct": return q.regularMarketChangePercent
            case "marketCap": return q.marketCap ?? 0
            case "pe": return q.trailingPE ?? 0
            case "volume": return q.regularMarketVolume ?? 0
          }
        }
        const va = get(a), vb = get(b)
        if (typeof va === "string" && typeof vb === "string") return va.localeCompare(vb) * dir
        return ((va as number) - (vb as number)) * dir
      })
  }, [data, minPrice, maxPrice, minChange, sortKey, sortDir])

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc")
    else { setSortKey(k); setSortDir("desc") }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card className="h-fit">
        <CardHeader><CardTitle className="text-sm">Filters</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Min Price: ${minPrice}</Label>
            <Slider value={[minPrice]} max={1000} step={5} onValueChange={(v) => setMinPrice(v[0])} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Max Price: ${maxPrice}</Label>
            <Slider value={[maxPrice]} max={2000} step={10} onValueChange={(v) => setMaxPrice(v[0])} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-xs">Min Day Change: {minChange}%</Label>
            <Slider value={[minChange]} min={-50} max={50} step={1} onValueChange={(v) => setMinChange(v[0])} />
          </div>
          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            {filtered.length} / {data?.quotes?.length ?? 0} match
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-6"><Skeleton className="h-96 w-full" /></div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-secondary/30">
                  <Th label="Symbol" k="symbol" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <Th label="Price" k="price" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <Th label="Day %" k="changePct" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <Th label="Mkt Cap" k="marketCap" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <Th label="P/E" k="pe" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <Th label="Volume" k="volume" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((q) => (
                  <tr key={q.symbol} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-2.5">
                      <Link href={`/stock/${q.symbol}`} className="flex flex-col">
                        <span className="font-mono font-semibold">{q.symbol}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {q.shortName ?? q.longName}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{fmtPrice(q.regularMarketPrice)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <ChangePill change={q.regularMarketChange} changePercent={q.regularMarketChangePercent} compact />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{fmtNum(q.marketCap)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">
                      {q.trailingPE ? q.trailingPE.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{fmtNum(q.regularMarketVolume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Th({
  label,
  k,
  sortKey,
  sortDir,
  onClick,
  align = "left",
}: {
  label: string
  k: SortKey
  sortKey: SortKey
  sortDir: "asc" | "desc"
  onClick: (k: SortKey) => void
  align?: "left" | "right"
}) {
  const active = sortKey === k
  return (
    <th className={`px-4 py-2.5 font-medium ${align === "right" ? "text-right" : ""}`}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto px-1 py-0.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        onClick={() => onClick(k)}
      >
        {label}
        <ArrowUpDown
          className={`size-3 ml-1 ${active ? "text-foreground" : "opacity-40"} ${
            active && sortDir === "asc" ? "rotate-180" : ""
          }`}
        />
      </Button>
    </th>
  )
}
