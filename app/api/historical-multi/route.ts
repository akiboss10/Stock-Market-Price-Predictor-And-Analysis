import { NextResponse } from "next/server"
import { getHistorical } from "@/lib/yahoo"
import type { TimeRange } from "@/lib/types"

export const revalidate = 60

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get("symbols") ?? ""
  const range = (searchParams.get("range") as TimeRange) ?? "1Y"
  const symbols = raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 8)
  if (symbols.length === 0) return NextResponse.json({ data: {} })

  const results = await Promise.all(symbols.map((s) => getHistorical(s, range)))
  const data: Record<string, ReturnType<typeof Array.prototype.slice>> = {}
  symbols.forEach((s, i) => {
    data[s] = results[i]
  })
  return NextResponse.json({ data })
}
