import Link from "next/link"
import { searchSymbols } from "@/lib/yahoo"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Search } from "lucide-react"

export const metadata = {
  title: "Search - Quanta",
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = "" } = await searchParams
  const results = q.trim() ? await searchSymbols(q) : []

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Search Results</h1>
        <p className="text-sm text-muted-foreground">
          {q ? <>Showing matches for &quot;<span className="font-mono">{q}</span>&quot;</> : "Type a query to begin."}
        </p>
      </div>

      {results.length === 0 ? (
        <Empty className="border border-dashed border-border rounded-xl">
          <EmptyHeader>
            <EmptyMedia variant="icon"><Search className="size-5" /></EmptyMedia>
            <EmptyTitle>No matches</EmptyTitle>
            <EmptyDescription>Try a ticker symbol like AAPL or a company name like Apple.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {results.map((r) => (
                <li key={r.symbol}>
                  <Link
                    href={`/stock/${r.symbol}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-secondary/40"
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-semibold">{r.symbol}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {r.longname ?? r.shortname}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right shrink-0">
                      <div>{r.exchDisp}</div>
                      <div>{r.typeDisp}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
