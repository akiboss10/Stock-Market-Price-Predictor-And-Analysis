import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="px-4 py-12 max-w-2xl mx-auto">
      <Empty>
        <EmptyHeader>
          <SearchX className="size-10 text-muted-foreground mb-2" />
          <EmptyTitle>Symbol not found</EmptyTitle>
          <EmptyDescription>
            We couldn&apos;t find a stock with that ticker. Try searching with the search bar above.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
