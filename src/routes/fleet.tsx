import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BatteryLow, Bot, Forklift, ScanLine, Wrench } from "lucide-react";
import { AppShell } from "@/components/twin/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zoneName } from "@/lib/twin/data";
import { useTwin } from "@/lib/twin/store";
import type { AssetKind } from "@/lib/twin/types";

export const Route = createFileRoute("/fleet")({
  head: () => ({
    meta: [
      { title: "Fleet & Asset Tracking — Forklifts, AMRs, Conveyors | TwinForge AI" },
      {
        name: "description",
        content:
          "Track battery, task, health, utilisation and maintenance for every forklift, robot, conveyor and scanner.",
      },
      { property: "og:title", content: "Fleet & Asset Tracking — TwinForge AI" },
      {
        property: "og:description",
        content: "Live position, battery and maintenance status for the whole warehouse fleet.",
      },
    ],
  }),
  component: FleetPage,
});

const ICONS: Record<AssetKind, typeof Bot> = {
  forklift: Forklift,
  amr: Bot,
  conveyor: Wrench,
  scanner: ScanLine,
};

function FleetPage() {
  const { assets } = useTwin();
  const [filter, setFilter] = useState<"all" | AssetKind>("all");
  const list = assets.filter((a) => (filter === "all" ? true : a.kind === filter));

  const fleetAlerts = [
    ...assets.filter((a) => a.battery < 20).map((a) => `${a.name} battery at ${Math.round(a.battery)}% — send to charging zone`),
    ...assets.filter((a) => a.health < 70).map((a) => `${a.name} health at ${a.health}% — maintenance due`),
    ...assets.filter((a) => a.status === "idle").map((a) => `${a.name} idle in ${zoneName(a.zoneId)} — no task assigned`),
  ].slice(0, 6);

  return (
    <AppShell
      title="Fleet & Asset Tracking"
      subtitle="Every vehicle and device on the floor, with the reason it needs attention explained in plain words."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="forklift">Forklifts</TabsTrigger>
            <TabsTrigger value="amr">AMRs</TabsTrigger>
            <TabsTrigger value="conveyor">Conveyors</TabsTrigger>
            <TabsTrigger value="scanner">Scanners</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {fleetAlerts.length > 0 && (
        <Card className="glass-panel mb-4 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BatteryLow className="size-4 text-warning" /> Fleet attention list
          </h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {fleetAlerts.map((t) => (
              <li key={t} className="rounded-lg border border-border bg-card/40 p-3 text-xs">
                {t}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((a) => {
          const Icon = ICONS[a.kind];
          return (
            <Card key={a.id} className="glass-panel rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary">
                    <Icon className="size-5 text-primary" />
                  </span>
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{zoneName(a.zoneId)}</p>
                  </div>
                </div>
                <Badge
                  variant={a.status === "offline" || a.status === "maintenance" ? "destructive" : "secondary"}
                  className="capitalize"
                >
                  {a.status}
                </Badge>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">Task: {a.task}</p>

              <div className="mt-3 space-y-2">
                <Meter label="Battery" value={Math.round(a.battery)} />
                <Meter label="Health" value={a.health} />
                <Meter label="Utilisation" value={a.utilization} />
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                <div>
                  <dt>Position</dt>
                  <dd className="font-mono text-foreground">
                    {a.x.toFixed(1)}, {a.y.toFixed(1)}
                  </dd>
                </div>
                <div>
                  <dt>Speed</dt>
                  <dd className="text-foreground">{a.speed} m/s</dd>
                </div>
                <div>
                  <dt>Service</dt>
                  <dd className="text-foreground">{a.nextService}</dd>
                </div>
              </dl>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toast.success(`Maintenance scheduled for ${a.name}`)}
                >
                  Schedule service
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toast.info(`${a.name} recalled to the charging zone`)}
                >
                  Recall
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} className="mt-1 h-1.5" />
    </div>
  );
}