import { CompareClient } from "@/components/compare/compare-client"

export const metadata = {
  title: "Compare Stocks - Quanta",
  description: "Compare price performance, fundamentals, and forecasts across multiple symbols.",
}

export default function ComparePage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Compare</h1>
        <p className="text-sm text-muted-foreground">
          Side-by-side performance and fundamentals for up to 5 symbols.
        </p>
      </div>
      <CompareClient />
    </div>
  )
}
