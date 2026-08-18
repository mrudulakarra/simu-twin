import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/twin/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HOURLY_THROUGHPUT, INVENTORY, UPTIME_SERIES, WORKERS, ZONES } from "@/lib/twin/data";
import { BASELINE, SCENARIO_TEMPLATES, runSimulation } from "@/lib/twin/engine";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Performance & Scenario Comparison | TwinForge AI" },
      {
        name: "description",
        content:
          "Compare warehouse performance by time, zone, category, shift and fleet type, plus before/after scenario impact.",
      },
      { property: "og:title", content: "Analytics — TwinForge AI" },
      { property: "og:description", content: "Before-and-after scenario analysis with estimated savings." },
    ],
  }),
  component: AnalyticsPage,
});

const tooltipStyle = {
  background: "oklch(0.19 0.03 258)",
  border: "1px solid oklch(1 0 0 / 0.12)",
  borderRadius: 12,
};

function AnalyticsPage() {
  const [templateId, setTemplateId] = useState(SCENARIO_TEMPLATES[0]!.id);
  const template = SCENARIO_TEMPLATES.find((t) => t.id === templateId)!;
  const after = runSimulation(template.params);

  const byCategory = [...new Set(INVENTORY.map((i) => i.category))].map((c) => {
    const items = INVENTORY.filter((i) => i.category === c);
    return {
      category: c,
      units: items.reduce((s, i) => s + i.available, 0),
      turnover: Number((items.reduce((s, i) => s + i.turnover, 0) / items.length).toFixed(1)),
    };
  });

  const byShift = (["Morning", "Evening", "Night"] as const).map((shift) => {
    const staff = WORKERS.filter((w) => w.shift === shift);
    return {
      shift,
      picks: staff.reduce((s, w) => s + w.picksPerHour, 0),
      accuracy: staff.length
        ? Number((staff.reduce((s, w) => s + w.accuracy, 0) / staff.length).toFixed(1))
        : 0,
    };
  });

  const compare = [
    { metric: "Throughput", before: BASELINE.throughput, after: after.throughput },
    { metric: "Cycle time", before: BASELINE.cycleTimeMin, after: after.cycleTimeMin },
    { metric: "Queue", before: BASELINE.queueLength, after: after.queueLength },
    { metric: "On-time %", before: BASELINE.onTimeRate, after: after.onTimeRate },
    { metric: "Cost/hour", before: BASELINE.costPerHour, after: after.costPerHour },
  ];

  const throughputDelta = after.throughput - BASELINE.throughput;
  const costDelta = after.costPerHour - BASELINE.costPerHour;

  return (
    <AppShell
      title="Analytics"
      subtitle="Performance broken down by time, zone, category, shift and fleet — plus the estimated impact of each scenario."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Throughput by hour</h2>
          <p className="mb-3 text-xs text-muted-foreground">Units completed per hour of the shift.</p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={HOURLY_THROUGHPUT}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
              <XAxis dataKey="hour" stroke="oklch(0.72 0.026 254)" fontSize={10} />
              <YAxis stroke="oklch(0.72 0.026 254)" fontSize={10} />
              <RTooltip contentStyle={tooltipStyle} />
              <Bar dataKey="units" fill="oklch(0.79 0.15 197)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Zone performance</h2>
          <p className="mb-3 text-xs text-muted-foreground">Utilisation across the eight floor zones.</p>
          <ResponsiveContainer width="100%" height={230}>
            <RadarChart data={ZONES.map((z) => ({ zone: z.name.split(" ")[0], load: z.load }))}>
              <PolarGrid stroke="oklch(1 0 0 / 0.1)" />
              <PolarAngleAxis dataKey="zone" stroke="oklch(0.72 0.026 254)" fontSize={10} />
              <Radar dataKey="load" stroke="oklch(0.64 0.19 295)" fill="oklch(0.64 0.19 295)" fillOpacity={0.35} />
              <RTooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Stock &amp; turnover by category</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            High turnover means the category sells through quickly.
          </p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={byCategory}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
              <XAxis dataKey="category" stroke="oklch(0.72 0.026 254)" fontSize={9} />
              <YAxis stroke="oklch(0.72 0.026 254)" fontSize={10} />
              <RTooltip contentStyle={tooltipStyle} />
              <Bar dataKey="units" fill="oklch(0.75 0.16 162)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Shift &amp; equipment reliability</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Picks per hour by shift and uptime by fleet type.
          </p>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={byShift}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
              <XAxis dataKey="shift" stroke="oklch(0.72 0.026 254)" fontSize={10} />
              <YAxis stroke="oklch(0.72 0.026 254)" fontSize={10} />
              <RTooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="picks" name="Picks / hour" fill="oklch(0.82 0.16 82)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="accuracy" name="Accuracy %" fill="oklch(0.79 0.15 197)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {UPTIME_SERIES.map((u) => (
              <li key={u.name} className="rounded-lg border border-border bg-card/40 p-2">
                <p className="text-muted-foreground">{u.name}</p>
                <p className="font-medium">{u.uptime}% uptime</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="glass-panel mt-4 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-sm font-semibold">Before vs. after scenario comparison</h2>
            <p className="text-xs text-muted-foreground">
              Today's baseline compared with the selected what-if scenario.
            </p>
          </div>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger className="ml-auto w-[230px]" aria-label="Select scenario to compare">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCENARIO_TEMPLATES.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={compare}>
            <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
            <XAxis dataKey="metric" stroke="oklch(0.72 0.026 254)" fontSize={11} />
            <YAxis stroke="oklch(0.72 0.026 254)" fontSize={11} />
            <RTooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="before" name="Baseline" fill="oklch(0.64 0.19 295)" radius={[6, 6, 0, 0]} />
            <Bar dataKey="after" name={template.name} fill="oklch(0.79 0.15 197)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="glass-panel mt-4 rounded-2xl p-5">
        <h2 className="text-sm font-semibold">Recommendation impact</h2>
        <p className="text-xs text-muted-foreground">
          What changes if you act on the advice for “{template.name}”.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Impact
            label="Throughput change"
            value={`${throughputDelta > 0 ? "+" : ""}${throughputDelta} lines/h`}
            good={throughputDelta >= 0}
          />
          <Impact
            label="Delay risk change"
            value={`${after.delayRisk - BASELINE.delayRisk > 0 ? "+" : ""}${after.delayRisk - BASELINE.delayRisk}%`}
            good={after.delayRisk <= BASELINE.delayRisk}
          />
          <Impact
            label="Cost change"
            value={`${costDelta > 0 ? "+" : ""}$${Math.abs(costDelta)} / hour`}
            good={costDelta <= 0}
          />
        </div>
        <ul className="mt-3 space-y-2">
          {after.recommendations.map((r) => (
            <li key={r.title} className="rounded-lg border border-border bg-card/40 p-3">
              <p className="text-xs font-medium">{r.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
              <Badge variant="secondary" className="mt-2 text-[11px]">
                {r.impact}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  );
}

function Impact({ label, value, good }: { label: string; value: string; good: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={good ? "mt-1 text-lg font-semibold text-success" : "mt-1 text-lg font-semibold text-destructive"}>
        {value}
      </p>
    </div>
  );
}