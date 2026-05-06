// Combined endpoint: returns quote + historical + indicators + prediction in one call.
// Used by the stock detail page to keep the UI responsive with a single fetch.

import { NextResponse } from "next/server"
import { getQuote, getHistorical } from "@/lib/yahoo"
import { computeIndicators, generateSignal } from "@/lib/indicators"
import { predictPrices } from "@/lib/predict"
import type { TimeRange } from "@/lib/types"

export const revalidate = 60

export async function GET(
  req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params
  const { searchParams } = new URL(req.url)
  const range = (searchParams.get("range") as TimeRange) ?? "1Y"
  const sym = symbol.toUpperCase()

  const [quote, history] = await Promise.all([
    getQuote(sym),
    getHistorical(sym, range),
  ])

  if (!quote || history.length === 0) {
    return NextResponse.json({ error: "Symbol not found" }, { status: 404 })
  }

  // Use full 1Y data for indicators / predictions to ensure SMA200 etc. compute
  const oneYear = range === "1Y" || range === "5Y" || range === "MAX"
    ? history
    : await getHistorical(sym, "1Y")

  const indicators = computeIndicators(oneYear)
  const signal = generateSignal(oneYear, indicators)
  const prediction =
    oneYear.length >= 30 ? predictPrices(oneYear, 7, 90) : null
  if (prediction) prediction.symbol = sym

  return NextResponse.json({
    quote,
    history,
    indicators,
    signal,
    prediction,
    range,
  })
}
