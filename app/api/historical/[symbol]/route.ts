import { NextResponse } from "next/server"
import { getHistorical } from "@/lib/yahoo"
import type { TimeRange } from "@/lib/types"

export const revalidate = 60

const VALID_RANGES: TimeRange[] = ["1D", "5D", "1M", "3M", "6M", "1Y", "5Y", "MAX"]

export async function GET(
  req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params
  const { searchParams } = new URL(req.url)
  const rangeParam = (searchParams.get("range") ?? "1Y") as TimeRange
  const range: TimeRange = VALID_RANGES.includes(rangeParam) ? rangeParam : "1Y"
  const data = await getHistorical(symbol.toUpperCase(), range)
  return NextResponse.json({ symbol: symbol.toUpperCase(), range, data })
}
