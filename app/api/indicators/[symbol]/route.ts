import { NextResponse } from "next/server"
import { getHistorical } from "@/lib/yahoo"
import { computeIndicators, generateSignal } from "@/lib/indicators"
import type { TimeRange } from "@/lib/types"

export const revalidate = 60

export async function GET(
  req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get("range") as TimeRange) ?? "1Y"
  const data = await getHistorical(symbol.toUpperCase(), range)
  if (data.length === 0) {
    return NextResponse.json({ error: "No historical data" }, { status: 404 })
  }
  const indicators = computeIndicators(data)
  const signal = generateSignal(data, indicators)
  return NextResponse.json({
    symbol: symbol.toUpperCase(),
    indicators,
    signal,
  })
}
