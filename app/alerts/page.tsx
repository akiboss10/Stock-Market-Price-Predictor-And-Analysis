import { AlertsClient } from "@/components/alerts/alerts-client"

export const metadata = {
  title: "Price Alerts - Quanta",
  description: "Manage your price alerts. Get notified when stocks hit target prices.",
}

export default function AlertsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Price Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Get notified when symbols cross target prices. Alerts are evaluated client-side against live quotes.
        </p>
      </div>
      <AlertsClient />
    </div>
  )
}
