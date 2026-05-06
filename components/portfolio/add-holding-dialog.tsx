"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addHolding } from "@/lib/storage"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Quote } from "@/lib/types"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  defaultSymbol?: string
}

export function AddHoldingDialog({ open, onOpenChange, defaultSymbol }: Props) {
  const [symbol, setSymbol] = useState(defaultSymbol ?? "")
  const [shares, setShares] = useState("")
  const [avgCost, setAvgCost] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [verifying, setVerifying] = useState(false)
  const [validQuote, setValidQuote] = useState<Quote | null>(null)

  useEffect(() => {
    if (open) {
      setSymbol(defaultSymbol ?? "")
      setShares("")
      setAvgCost("")
      setDate(new Date().toISOString().slice(0, 10))
      setValidQuote(null)
    }
  }, [open, defaultSymbol])

  // Verify symbol when user pauses typing
  useEffect(() => {
    if (!symbol.trim()) {
      setValidQuote(null)
      return
    }
    let active = true
    setVerifying(true)
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/quote/${encodeURIComponent(symbol.trim().toUpperCase())}`)
        if (!active) return
        if (res.ok) {
          const j = await res.json()
          setValidQuote(j.quote)
          if (!avgCost && j.quote?.regularMarketPrice) {
            setAvgCost(j.quote.regularMarketPrice.toFixed(2))
          }
        } else {
          setValidQuote(null)
        }
      } catch {
        if (active) setValidQuote(null)
      } finally {
        if (active) setVerifying(false)
      }
    }, 400)
    return () => {
      active = false
      clearTimeout(id)
    }
  }, [symbol, avgCost])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sh = parseFloat(shares)
    const cost = parseFloat(avgCost)
    if (!validQuote) {
      toast.error("Symbol not recognized", { description: "Please enter a valid ticker." })
      return
    }
    if (!Number.isFinite(sh) || sh <= 0) {
      toast.error("Enter a valid number of shares")
      return
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      toast.error("Enter a valid average cost")
      return
    }
    addHolding({
      symbol: validQuote.symbol,
      shares: sh,
      avgCost: cost,
      purchaseDate: date,
    })
    toast.success("Holding added", {
      description: `${sh} share${sh === 1 ? "" : "s"} of ${validQuote.symbol} at ${cost.toFixed(2)}.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Holding</DialogTitle>
          <DialogDescription>
            Add a position to track gains and losses against the live market price.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="symbol">Ticker Symbol</Label>
            <div className="relative">
              <Input
                id="symbol"
                placeholder="e.g. AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                autoComplete="off"
                autoFocus
              />
              {verifying && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
              )}
            </div>
            {validQuote && (
              <p className="text-xs text-muted-foreground">
                {validQuote.shortName ?? validQuote.longName} · Last: $
                {validQuote.regularMarketPrice.toFixed(2)}
              </p>
            )}
            {!verifying && symbol && !validQuote && (
              <p className="text-xs text-bearish">Symbol not found.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="shares">Shares</Label>
              <Input
                id="shares"
                type="number"
                min="0"
                step="0.0001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="num"
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Avg Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                className="num"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Purchase Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!validQuote}>
              Add Holding
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
