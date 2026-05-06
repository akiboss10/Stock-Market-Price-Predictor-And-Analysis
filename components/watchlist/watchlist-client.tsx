"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Star, Trash2 } from "lucide-react"
import { useFetch } from "@/hooks/use-fetch"
import { getWatchlist, setWatchlist, subscribe } from "@/lib/storage"
import { ChangePill } from "@/components/change-pill"
import { formatCompact, formatCurrency } from "@/lib/format"
import { toast } from "sonner"
import type { Quote } from "@/lib/types"

export function WatchlistClient() {
  const [symbols, setSymbols] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSymbols(getWatchlist())
    setHydrated(true)
    return subscribe("watchlist", () => setSymbols(getWatchlist()))
  }, [])

  const url = symbols.length > 0 ? `/api/quotes?symbols=${symbols.join(",")}` : null
  const { data, loading } = useFetch<{ quotes: Quote[] }>(url, 60_000)
  const quotes = data?.quotes ?? []

  const ordered = useMemo(() => {
    const map = new Map(quotes.map((q) => [q.symbol, q]))
    return symbols.map((s) => ({ symbol: s, quote: map.get(s) }))
  }, [symbols, quotes])

  const remove = (sym: string) => {
    const next = getWatchlist().filter((s) => s !== sym)
    setWatchlist(next)
    toast.success("Removed", { description: `${sym} removed from watchlist.` })
  }

  if (!hydrated) {
    return <Skeleton className="h-[300px] rounded-lg" />
  }

  if (symbols.length === 0) {
    return (
      <Card>
        <CardContent className="py-10">
          <Empty>
            <EmptyHeader>
              <Star className="size-10 text-muted-foreground mb-2" />
              <EmptyTitle>Your watchlist is empty</EmptyTitle>
              <EmptyDescription>
                Search for a stock and tap the star icon to add it to your watchlist.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/">Browse Markets</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="hidden md:table-cell">Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="hidden md:table-cell text-right">Volume</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Market Cap</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordered.map(({ symbol, quote }) => (
              <TableRow key={symbol}>
                <TableCell>
                  <Link
                    href={`/stock/${symbol}`}
                    className="font-medium hover:underline"
                  >
                    {symbol}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-[200px]">
                  {quote?.shortName ?? quote?.longName ?? (loading ? "—" : "Unknown")}
                </TableCell>
                <TableCell className="text-right num">
                  {quote ? formatCurrency(quote.regularMarketPrice, quote.currency ?? "USD") : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {quote ? (
                    <ChangePill
                      value={quote.regularMarketChangePercent}
                      size="sm"
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell text-right num text-muted-foreground">
                  {quote?.regularMarketVolume ? formatCompact(quote.regularMarketVolume) : "—"}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-right num text-muted-foreground">
                  {quote?.marketCap ? formatCompact(quote.marketCap) : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(symbol)}
                    aria-label={`Remove ${symbol}`}
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
  )
}
