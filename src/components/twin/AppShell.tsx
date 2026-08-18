import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity,
  Bell,
  Boxes,
  ChevronLeft,
  Gauge,
  LayoutDashboard,
  LineChart,
  PackageSearch,
  Search,
  Settings,
  Truck,
  Warehouse,
  Wifi,
  WifiOff,
} from "lucide-react";
import { WAREHOUSES } from "@/lib/twin/data";
import { useTwin } from "@/lib/twin/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/live-twin", label: "Live Twin", icon: Warehouse },
  { to: "/simulation", label: "Simulation Lab", icon: Gauge },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/fleet", label: "Fleet", icon: Truck },
  { to: "/orders", label: "Orders", icon: PackageSearch },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const { connected, simTime, alerts, warehouseId, setWarehouseId } = useTwin();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const openAlerts = alerts.filter((a) => a.state === "open").length;

  return (
    <div className="min-h-screen bg-background text-foreground grid-backdrop">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl transition-[width] duration-300 md:flex",
            collapsed ? "w-[76px]" : "w-64",
          )}
        >
          <div className="flex items-center gap-3 px-4 py-5">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--gradient-primary)] shadow-[var(--shadow-elegant)]">
              <Activity className="size-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">TwinForge AI</p>
                <p className="truncate text-xs text-muted-foreground">Digital Twin Simulator</p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-1 px-3" aria-label="Main navigation">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-label={label}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {!collapsed && label === "Alerts" && openAlerts > 0 && (
                    <span className="ml-auto rounded-full bg-destructive/20 px-2 py-0.5 text-[11px] font-medium text-destructive">
                      {openAlerts}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
              {!collapsed && "Collapse"}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
              <div className="relative min-w-[180px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search SKUs, orders, assets, zones…"
                  aria-label="Global search"
                  className="pl-9"
                />
              </div>

              <Select value={warehouseId} onValueChange={setWarehouseId}>
                <SelectTrigger className="w-[190px]" aria-label="Select warehouse">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAREHOUSES.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs">
                {connected ? (
                  <>
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-2 rounded-full bg-success [animation:pulse-ring_1.6s_ease-out_infinite]" />
                      <span className="inline-flex size-2 rounded-full bg-success" />
                    </span>
                    <Wifi className="size-3.5 text-success" />
                    <span className="text-muted-foreground">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Connecting…</span>
                  </>
                )}
              </div>

              <div className="hidden rounded-full border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground lg:block">
                Sim clock {simTime.toISOString().slice(11, 16)}
              </div>

              <Button asChild variant="ghost" size="icon" aria-label="Notifications">
                <Link to="/alerts" className="relative">
                  <Bell className="size-4" />
                  {openAlerts > 0 && (
                    <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
                  )}
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <span className="grid size-6 place-items-center rounded-full bg-[var(--gradient-primary)] text-[11px] font-semibold text-primary-foreground">
                      MK
                    </span>
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>M. Kiet — Administrator</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings">Settings &amp; roles</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/analytics">My reports</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 lg:px-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">{title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}