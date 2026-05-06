"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { getRecent, pushRecent } from "@/lib/storage"
import type { SearchResult } from "@/lib/types"

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    if (open) setRecent(getRecent())
  }, [open])

  // Keyboard shortcut Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(id)
  }, [query])

  const navigate = useCallback(
    (sym: string) => {
      pushRecent(sym)
      setOpen(false)
      setQuery("")
      router.push(`/stock/${sym}`)
    },
    [router],
  )

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="w-full justify-between text-muted-foreground font-normal h-9"
      >
        <span className="flex items-center gap-2">
          <Search className="size-4" />
          <span className="hidden sm:inline">Search stocks, ETFs, indices...</span>
          <span className="sm:hidden">Search...</span>
        </span>
        <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search by ticker or company name..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin mr-2" />
              Searching...
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <CommandEmpty>No results for &quot;{query}&quot;.</CommandEmpty>
          )}
          {!loading && results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((r) => (
                <CommandItem
                  key={r.symbol}
                  value={`${r.symbol} ${r.shortname ?? ""} ${r.longname ?? ""}`}
                  onSelect={() => navigate(r.symbol)}
                >
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <span className="font-medium">{r.symbol}</span>
                  <span className="text-muted-foreground truncate">
                    {r.shortname ?? r.longname}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {r.exchDisp ?? r.typeDisp}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {!query && recent.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recent.map((s) => (
                  <CommandItem key={s} value={s} onSelect={() => navigate(s)}>
                    <TrendingUp className="size-4 text-muted-foreground" />
                    <span className="font-medium">{s}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}
          {!query && (
            <CommandGroup heading="Popular">
              {["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "TSLA", "META"].map((s) => (
                <CommandItem key={s} value={s} onSelect={() => navigate(s)}>
                  <TrendingUp className="size-4 text-muted-foreground" />
                  <span className="font-medium">{s}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
