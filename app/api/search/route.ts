import { NextResponse } from "next/server"
import { searchSymbols } from "@/lib/yahoo"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  if (!q.trim()) return NextResponse.json({ results: [] })
  const results = await searchSymbols(q)
  return NextResponse.json({ results })
}
