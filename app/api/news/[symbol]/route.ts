import { NextResponse } from "next/server"
import { getNews } from "@/lib/yahoo"
import { aggregateSentiment } from "@/lib/sentiment"

export const revalidate = 300

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ symbol: string }> },
) {
  const { symbol } = await ctx.params
  const news = await getNews(symbol.toUpperCase())
  const sentiments = news.map((n) => n.sentiment).filter(Boolean) as NonNullable<
    (typeof news)[number]["sentiment"]
  >[]
  const aggregate = aggregateSentiment(sentiments)
  return NextResponse.json({ news, aggregate })
}
