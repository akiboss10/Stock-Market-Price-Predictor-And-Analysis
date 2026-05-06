import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Newspaper } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { NewsItem } from "@/lib/types"

export function NewsFeed({ news }: { news: NewsItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Newspaper className="size-4" />
          Latest News
        </CardTitle>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No recent news available for this symbol.
          </p>
        ) : (
          <ul className="divide-y -mx-2">
            {news.map((n, i) => {
              const sentiment = n.sentiment?.label ?? "NEUTRAL"
              return (
                <li key={i} className="px-2 py-3">
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex gap-3 hover:opacity-90"
                  >
                    {n.thumbnail && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.thumbnail}
                        alt=""
                        className="size-16 rounded-md object-cover shrink-0 bg-muted"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:underline">
                        {n.title}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        {n.publisher && <span>{n.publisher}</span>}
                        {n.publisher && <span>·</span>}
                        <span>{timeAgo(n.publishTime)}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase tracking-wide font-medium px-1.5 py-0 h-4",
                            sentiment === "POSITIVE" && "border-bullish/40 text-bullish",
                            sentiment === "NEGATIVE" && "border-bearish/40 text-bearish",
                            sentiment === "NEUTRAL" && "text-muted-foreground",
                          )}
                        >
                          {sentiment}
                          {n.sentiment ? (
                            <span className="num ml-1">
                              {n.sentiment.score >= 0 ? "+" : ""}
                              {n.sentiment.score.toFixed(2)}
                            </span>
                          ) : null}
                        </Badge>
                      </div>
                    </div>
                    <ExternalLink className="size-3.5 text-muted-foreground shrink-0 mt-1" />
                  </a>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
