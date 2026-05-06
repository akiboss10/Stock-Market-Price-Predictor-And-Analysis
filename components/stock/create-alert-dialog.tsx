"use client"

import { useState } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { addAlert } from "@/lib/storage"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"

interface Props {
  open: boolean
  onOpenChange: (o: boolean) => void
  symbol: string
  currentPrice: number
}

export function CreateAlertDialog({ open, onOpenChange, symbol, currentPrice }: Props) {
  const [direction, setDirection] = useState<"above" | "below">("above")
  const [targetPrice, setTargetPrice] = useState((currentPrice * 1.05).toFixed(2))

  const handleSave = () => {
    const v = parseFloat(targetPrice)
    if (!Number.isFinite(v) || v <= 0) {
      toast.error("Enter a valid price")
      return
    }
    addAlert({ symbol, direction, targetPrice: v })
    toast.success("Alert created", {
      description: `${symbol} will alert when price goes ${direction} ${formatCurrency(v)}.`,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Price Alert</DialogTitle>
          <DialogDescription>
            Get notified when {symbol} reaches your target price.
            Current price: {formatCurrency(currentPrice)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Trigger when price is</Label>
            <RadioGroup
              value={direction}
              onValueChange={(v) => setDirection(v as "above" | "below")}
              className="grid grid-cols-2 gap-2"
            >
              <Label
                htmlFor="above"
                className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-bullish has-[[data-state=checked]]:bg-bullish-soft"
              >
                <RadioGroupItem value="above" id="above" />
                <span>Above</span>
              </Label>
              <Label
                htmlFor="below"
                className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 cursor-pointer hover:bg-accent has-[[data-state=checked]]:border-bearish has-[[data-state=checked]]:bg-bearish-soft"
              >
                <RadioGroupItem value="below" id="below" />
                <span>Below</span>
              </Label>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="threshold">Target Price (USD)</Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="num"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Create Alert</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
