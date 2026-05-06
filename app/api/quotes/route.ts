import { NextResponse } from "next/server"
import { getQuotes } from "@/lib/yahoo"

export const revalidate = 30

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbolsParam = searchParams.get("symbols") ?? ""
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
  if (symbols.length === 0) return NextResponse.json({ quotes: [] })
  const quotes = await getQuotes(symbols)
  return NextResponse.json({ quotes })
}
