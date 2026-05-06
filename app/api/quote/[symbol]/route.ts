import { NextResponse } from "next/server"
import { getQuote } from "@/lib/yahoo"

export const revalidate = 30

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params
  const quote = await getQuote(symbol.toUpperCase())
  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 })
  }
  return NextResponse.json({ quote })
}
