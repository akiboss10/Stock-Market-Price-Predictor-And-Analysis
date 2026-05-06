import { ArrowDown, ArrowUp, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatPercent } from "@/lib/format"

interface ChangePillProps {
  value: number
  showIcon?: boolean
  size?: "sm" | "md"
  className?: string
}

/** Colored pill displaying a percentage change. Bullish/bearish/neutral aware. */
export function ChangePill({ value, showIcon = true, size = "sm", className }: ChangePillProps) {
  const dir = value > 0.0001 ? "up" : value < -0.0001 ? "down" : "flat"
  const Icon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md font-medium num",
        size === "sm" ? "px-1.5 py-0.5 text-xs" : "px-2 py-1 text-sm",
        dir === "up" && "bg-bullish-soft text-bullish",
        dir === "down" && "bg-bearish-soft text-bearish",
        dir === "flat" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {showIcon && <Icon className={size === "sm" ? "size-3" : "size-3.5"} />}
      {formatPercent(value)}
    </span>
  )
}

interface PriceChangeProps {
  change: number
  changePercent: number
  className?: string
}

/** Formatted absolute + percentage change combo */
export function PriceChange({ change, changePercent, className }: PriceChangeProps) {
  const dir = change > 0.0001 ? "up" : change < -0.0001 ? "down" : "flat"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 num text-sm",
        dir === "up" && "text-bullish",
        dir === "down" && "text-bearish",
        dir === "flat" && "text-muted-foreground",
        className,
      )}
    >
      <span>
        {change >= 0 ? "+" : ""}
        {change.toFixed(2)}
      </span>
      <ChangePill value={changePercent} size="sm" showIcon={false} />
    </span>
  )
}
