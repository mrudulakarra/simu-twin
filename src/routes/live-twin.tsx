import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/twin/AppShell";
import { SelectionPanel, WarehouseMap, type Selection } from "@/components/twin/WarehouseMap";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTwin } from "@/lib/twin/store";
import { zoneName } from "@/lib/twin/data";

export const Route = createFileRoute("/live-twin")({
  head: () => ({
    meta: [
      { title: "Live Twin — TwinForge AI Warehouse Map" },
      {
        name: "description",
        content:
          "Interactive warehouse floor map with racks, docks, forklifts, AMRs and workers moving in real time.",
      },
      { property: "og:title", content: "Live Twin — TwinForge AI" },
      {
        property: "og:description",
        content: "Pan, zoom and click any object to inspect live status and tasks.",
      },
    ],
  }),
  component: LiveTwin,
});

function LiveTwin() {
  const [selection, setSelection] = useState<Selection>(null);
  const { assets, orders, tick } = useTwin();
  const events = assets.slice(0, 6).map((a, i) => ({
    id: a.id,
    text: `${a.name} ${a.status === "charging" ? "docked to charge in" : "moved through"} ${zoneName(a.zoneId)}`,
    at: `${(tick + i) % 60}s ago`,
  }));

  return (
    <AppShell
      title="Live Warehouse Twin"
      subtitle="A moving replica of the floor. Every vehicle, worker and rack reflects simulated live telemetry."
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <WarehouseMap selection={selection} onSelect={setSelection} />
        <div className="space-y-4">
          <SelectionPanel selection={selection} />
          <Card className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Recent floor events</h2>
            <ul className="mt-3 space-y-2 text-xs">
              {events.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">{e.text}</span>
                  <span className="shrink-0 font-mono text-[11px]">{e.at}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Order flow right now</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["queued", "picking", "packing", "shipped", "delayed"] as const).map((s) => (
                <Badge key={s} variant="secondary" className="capitalize">
                  {s}: {orders.filter((o) => o.status === s).length}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}