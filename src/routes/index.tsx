import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Boxes,
  CircleDollarSign,
  Gauge,
  PackageCheck,
  Percent,
  Timer,
  Truck,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/twin/AppShell";
import { KpiCard } from "@/components/twin/KpiCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HOURLY_THROUGHPUT, INVENTORY, ZONES } from "@/lib/twin/data";
import { BASELINE } from "@/lib/twin/engine";
import { useTwin } from "@/lib/twin/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TwinForge AI — Warehouse Digital Twin Command Center" },
      {
        name: "description",
        content:
          "Live warehouse digital twin with KPIs, 3D-style floor map, bottleneck detection and what-if simulation for logistics teams.",
      },
      { property: "og:title", content: "TwinForge AI — Warehouse Digital Twin" },
      {
        property: "og:description",
        content: "Visualise inventory, fleet and orders, then run what-if scenarios before you act.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { orders, assets, workers, alerts } = useTwin();
  const [onboarding, setOnboarding] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem("twinforge_onboarded") !== "1") setOnboarding(true);
  }, []);

  const totalUnits = INVENTORY.reduce((s, i) => s + i.available, 0);
  const activeOrders = orders.filter((o) => o.status !== "shipped").length;
  const activeWorkers = workers.filter((w) => w.status === "active").length;
  const fleetUtil = Math.round(
    assets.reduce((s, a) => s + a.utilization, 0) / Math.max(assets.length, 1),
  );
  const openAlerts = alerts.filter((a) => a.state === "open").length;

  const zoneData = ZONES.map((z) => ({ name: z.name.split(" ")[0], load: z.load }));
  const fulfil = [
    { name: "Shipped", value: orders.filter((o) => o.status === "shipped").length },
    { name: "In progress", value: orders.filter((o) => ["picking", "packing"].includes(o.status)).length },
    { name: "Queued", value: orders.filter((o) => o.status === "queued").length },
    { name: "Delayed", value: orders.filter((o) => o.status === "delayed").length },
  ];
  const pieColors = [
    "oklch(0.75 0.16 162)",
    "oklch(0.79 0.15 197)",
    "oklch(0.64 0.19 295)",
    "oklch(0.64 0.21 22)",
  ];

  return (
    <AppShell
      title="Live Command Overview"
      subtitle="A single view of how the warehouse is performing right now, in plain business language."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <KpiCard
          label="Total inventory units"
          value={totalUnits.toLocaleString()}
          icon={Boxes}
          explain="Every sellable unit currently stored in this building."
          delta="+2.4% vs. yesterday"
        />
        <KpiCard
          label="Active orders"
          value={activeOrders}
          icon={PackageCheck}
          tone="accent"
          explain="Orders that have not shipped yet."
          delta={`${orders.filter((o) => o.priority !== "standard").length} priority orders`}
        />
        <KpiCard
          label="Throughput / hour"
          value={BASELINE.throughput}
          unit="lines"
          icon={Activity}
          tone="success"
          explain="Order lines the warehouse can complete in one hour at the current setup."
        />
        <KpiCard
          label="Picking accuracy"
          value="98.4"
          unit="%"
          icon={Percent}
          tone="success"
          explain="Share of picks with the right item and quantity. Below 98% means rework."
        />
        <KpiCard
          label="On-time shipment"
          value={BASELINE.onTimeRate}
          unit="%"
          icon={Timer}
          tone="warning"
          explain="Orders leaving before the promised cut-off time."
        />
        <KpiCard
          label="Active workers"
          value={activeWorkers}
          icon={Users}
          explain="Staff currently clocked in and working on tasks."
        />
        <KpiCard
          label="Fleet utilisation"
          value={fleetUtil}
          unit="%"
          icon={Truck}
          tone="accent"
          explain="How busy forklifts, robots and conveyors are. Above 90% leaves no slack."
        />
        <KpiCard
          label="Bottlenecks"
          value={BASELINE.bottlenecks.length}
          icon={AlertTriangle}
          tone="destructive"
          explain="Steps where work arrives faster than it can be completed."
        />
        <KpiCard
          label="Operational cost / hour"
          value={`$${BASELINE.costPerHour}`}
          icon={CircleDollarSign}
          tone="warning"
          explain="Labour, equipment and late-delivery penalties combined."
        />
        <KpiCard
          label="Open alerts"
          value={openAlerts}
          icon={AlertTriangle}
          tone="destructive"
          explain="Issues nobody has picked up yet."
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Hourly throughput</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Units and orders completed each hour of the current shift.
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={HOURLY_THROUGHPUT}>
              <defs>
                <linearGradient id="tp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.79 0.15 197)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="oklch(0.79 0.15 197)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
              <XAxis dataKey="hour" stroke="oklch(0.72 0.026 254)" fontSize={11} />
              <YAxis stroke="oklch(0.72 0.026 254)" fontSize={11} />
              <RTooltip
                contentStyle={{
                  background: "oklch(0.19 0.03 258)",
                  border: "1px solid oklch(1 0 0 / 0.12)",
                  borderRadius: 12,
                  color: "oklch(0.96 0.008 250)",
                }}
              />
              <Area dataKey="units" stroke="oklch(0.79 0.15 197)" fill="url(#tp)" strokeWidth={2} />
              <Line dataKey="orders" stroke="oklch(0.64 0.19 295)" dot={false} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Warehouse Health Score</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            0–100 summary of flow, delays and congestion.
          </p>
          <div className="flex items-center gap-4">
            <div className="relative grid size-28 place-items-center rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] from-primary to-accent">
              <div className="grid size-24 place-items-center rounded-full bg-card">
                <span className="text-3xl font-semibold">{BASELINE.healthScore}</span>
              </div>
            </div>
            <ul className="flex-1 space-y-2 text-xs">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Utilisation</span>
                <span>{BASELINE.utilization}%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Delay risk</span>
                <span>{BASELINE.delayRisk}%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Congestion</span>
                <span>{BASELINE.congestion}%</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Queue</span>
                <span>{BASELINE.queueLength} lines</span>
              </li>
            </ul>
          </div>
          <div className="mt-4 space-y-2">
            {BASELINE.recommendations.slice(0, 2).map((r) => (
              <div key={r.title} className="rounded-lg border border-border bg-card/40 p-3">
                <p className="text-xs font-medium">{r.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
                <Badge variant="secondary" className="mt-2 text-[11px]">
                  {r.impact}
                </Badge>
              </div>
            ))}
          </div>
          <Button asChild className="mt-4 w-full">
            <Link to="/simulation">Open Simulation Lab</Link>
          </Button>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Zone utilisation</h2>
          <p className="mb-4 text-xs text-muted-foreground">How full each area of the floor is.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={zoneData}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
              <XAxis dataKey="name" stroke="oklch(0.72 0.026 254)" fontSize={10} />
              <YAxis stroke="oklch(0.72 0.026 254)" fontSize={10} />
              <RTooltip
                contentStyle={{
                  background: "oklch(0.19 0.03 258)",
                  border: "1px solid oklch(1 0 0 / 0.12)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="load" radius={[6, 6, 0, 0]} fill="oklch(0.64 0.19 295)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Order fulfilment mix</h2>
          <p className="mb-4 text-xs text-muted-foreground">Where open orders sit in the flow.</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={fulfil} dataKey="value" nameKey="name" innerRadius={52} outerRadius={82}>
                {fulfil.map((_, i) => (
                  <Cell key={i} fill={pieColors[i]} />
                ))}
              </Pie>
              <RTooltip
                contentStyle={{
                  background: "oklch(0.19 0.03 258)",
                  border: "1px solid oklch(1 0 0 / 0.12)",
                  borderRadius: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Order processing time</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Average minutes from order received to shipped.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={HOURLY_THROUGHPUT}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
              <XAxis dataKey="hour" stroke="oklch(0.72 0.026 254)" fontSize={10} />
              <YAxis stroke="oklch(0.72 0.026 254)" fontSize={10} />
              <RTooltip
                contentStyle={{
                  background: "oklch(0.19 0.03 258)",
                  border: "1px solid oklch(1 0 0 / 0.12)",
                  borderRadius: 12,
                }}
              />
              <Line
                dataKey="cycleTime"
                stroke="oklch(0.82 0.16 82)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link to="/live-twin">
            <Gauge className="mr-2 size-4" /> Explore the live twin
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/alerts">Review {openAlerts} open alerts</Link>
        </Button>
      </div>

      <Dialog open={onboarding} onOpenChange={setOnboarding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to TwinForge AI</DialogTitle>
            <DialogDescription>
              This is a working digital replica of a distribution centre, powered by simulated
              WMS and IoT data — no hardware needed.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Open <strong>Live Twin</strong> to pan, zoom and click any rack, robot or worker.</li>
            <li>2. Go to <strong>Simulation Lab</strong>, pick the “Peak Season Surge” template and press Run.</li>
            <li>3. Compare the result with today’s baseline and read the recommendations.</li>
          </ol>
          <DialogFooter>
            <Button
              onClick={() => {
                window.localStorage.setItem("twinforge_onboarded", "1");
                setOnboarding(false);
              }}
            >
              Start exploring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
