import { NextResponse } from "next/server"
import { getHistorical } from "@/lib/yahoo"
import { predictPrices } from "@/lib/predict"

export const revalidate = 300

export async function GET(
  req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params
  const { searchParams } = new URL(req.url)
  const horizon = Math.max(
    1,
    Math.min(30, parseInt(searchParams.get("horizon") ?? "7", 10) || 7),
  )
  const data = await getHistorical(symbol.toUpperCase(), "1Y")
  if (data.length < 30) {
    return NextResponse.json(
      { error: "Insufficient data for prediction" },
      { status: 400 },
    )
  }
  const result = predictPrices(data, horizon, 90)
  result.symbol = symbol.toUpperCase()
  return NextResponse.json({ prediction: result })
}
