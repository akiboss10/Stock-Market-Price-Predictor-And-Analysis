"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  LineChart,
  Briefcase,
  Star,
  GitCompareArrows,
  Bell,
  Activity,
  Sparkles,
  Filter,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const NAV = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Portfolio", href: "/portfolio", icon: Briefcase },
  { title: "Watchlist", href: "/watchlist", icon: Star },
  { title: "Compare", href: "/compare", icon: GitCompareArrows },
  { title: "Screener", href: "/screener", icon: Filter },
  { title: "Alerts", href: "/alerts", icon: Bell },
]

const POPULAR = [
  { sym: "AAPL", name: "Apple" },
  { sym: "NVDA", name: "NVIDIA" },
  { sym: "MSFT", name: "Microsoft" },
  { sym: "GOOGL", name: "Alphabet" },
  { sym: "TSLA", name: "Tesla" },
  { sym: "META", name: "Meta" },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center"
        >
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
            <Activity className="size-4" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-none">Quantum Stocks</span>
            <span className="text-xs text-muted-foreground mt-1">AI Market Intelligence</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={!!isActive} tooltip={item.title}>
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Popular</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {POPULAR.map((p) => {
                const href = `/stock/${p.sym}`
                const isActive = pathname === href
                return (
                  <SidebarMenuItem key={p.sym}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={p.name}>
                      <Link href={href}>
                        <LineChart className="size-4" />
                        <span className="flex-1">
                          <span className="font-medium">{p.sym}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{p.name}</span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
            <Sparkles className="size-3.5" />
            ML Engine
          </div>
          <p className="leading-relaxed">
            Ensemble forecasting with linear regression, drift, and Holt smoothing.
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
