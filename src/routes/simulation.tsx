import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Pause, Play, RotateCcw, Save, Scale } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/twin/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { BASELINE, DEFAULT_PARAMS, SCENARIO_TEMPLATES, runSimulation } from "@/lib/twin/engine";
import type { SavedScenario, SimParams, SimResult } from "@/lib/twin/types";

export const Route = createFileRoute("/simulation")({
  head: () => ({
    meta: [
      { title: "Simulation Lab — What-if Warehouse Scenarios | TwinForge AI" },
      {
        name: "description",
        content:
          "Model demand spikes, staff shortages, equipment downtime and layout changes before applying them on the real floor.",
      },
      { property: "og:title", content: "Simulation Lab — TwinForge AI" },
      {
        property: "og:description",
        content: "Run, compare and export warehouse what-if scenarios in seconds.",
      },
    ],
  }),
  component: SimulationLab,
});

const CONTROLS: {
  key: keyof SimParams;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}[] = [
  { key: "orderVolume", label: "Incoming order volume (lines/h)", min: 100, max: 1600, step: 10, hint: "How much work arrives each hour." },
  { key: "workers", label: "Worker count", min: 2, max: 30, step: 1, hint: "People available for picking and packing." },
  { key: "forklifts", label: "Forklift count", min: 0, max: 15, step: 1, hint: "Pallet-moving vehicles on the floor." },
  { key: "amrs", label: "AMR / AGV count", min: 0, max: 20, step: 1, hint: "Autonomous robots carrying totes." },
  { key: "pickingSpeed", label: "Picking speed (% of normal)", min: 50, max: 160, step: 1, hint: "Above 100% means faster than a typical day." },
  { key: "conveyorSpeed", label: "Conveyor speed (% of normal)", min: 50, max: 160, step: 1, hint: "Belt speed feeding the packing lanes." },
  { key: "docks", label: "Dock doors available", min: 1, max: 10, step: 1, hint: "Loading bays open for outbound trucks." },
  { key: "failureProbability", label: "Equipment failure probability (%)", min: 0, max: 40, step: 1, hint: "Chance equipment breaks during the shift." },
  { key: "trafficDensity", label: "Traffic density (%)", min: 0, max: 100, step: 1, hint: "How crowded the aisles are." },
  { key: "supplierDelay", label: "Supplier delay (min)", min: 0, max: 120, step: 5, hint: "How late inbound shipments arrive." },
  { key: "demandSurge", label: "Demand surge (%)", min: 0, max: 150, step: 5, hint: "Extra demand on top of the planned volume." },
];

function toCsv(name: string, r: SimResult) {
  const rows = [
    ["metric", "value"],
    ["scenario", name],
    ["throughput_lines_per_hour", r.throughput],
    ["avg_cycle_time_min", r.cycleTimeMin],
    ["avg_pick_time_min", r.pickTimeMin],
    ["queue_length", r.queueLength],
    ["utilization_pct", r.utilization],
    ["delay_risk_pct", r.delayRisk],
    ["congestion_pct", r.congestion],
    ["cost_per_hour_usd", r.costPerHour],
    ["on_time_rate_pct", r.onTimeRate],
    ["health_score", r.healthScore],
  ];
  return rows.map((row) => row.join(",")).join("\n");
}

export function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function SimulationLab() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [result, setResult] = useState<SimResult>(BASELINE);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [name, setName] = useState("My scenario");
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [compareId, setCompareId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setRunning(false);
          return 100;
        }
        return p + 2 * speed;
      });
    }, 90);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [running, speed]);

  const set = (key: keyof SimParams, value: number) => {
    const next = { ...params, [key]: value };
    setParams(next);
    setResult(runSimulation(next));
  };

  const run = () => {
    setResult(runSimulation(params));
    setProgress(0);
    setRunning(true);
    toast.success("Simulation started", { description: `${name} · ${speed}x speed` });
  };

  const compare = saved.find((s) => s.id === compareId);
  const visible = result.timeline.slice(0, Math.max(2, Math.round((progress / 100) * 24)));

  return (
    <AppShell
      title="Simulation Lab"
      subtitle="Change the setup, run a what-if scenario and see the impact before touching the real warehouse."
    >
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card className="glass-panel space-y-5 rounded-2xl p-5">
          <div>
            <Label htmlFor="scenario-name">Scenario name</Label>
            <Input
              id="scenario-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <p className="text-sm font-semibold">Templates</p>
            <div className="mt-2 grid gap-2">
              {SCENARIO_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setParams(t.params);
                    setResult(runSimulation(t.params));
                    setName(t.name);
                    toast.info(`Loaded template: ${t.name}`);
                  }}
                  className="rounded-lg border border-border bg-card/40 p-3 text-left transition-colors hover:border-primary/60"
                >
                  <p className="text-xs font-medium">{t.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{t.blurb}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-semibold">Parameters</p>
            {CONTROLS.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between text-xs">
                  <Label htmlFor={c.key} className="text-xs">
                    {c.label}
                  </Label>
                  <span className="font-mono text-primary">{params[c.key]}</span>
                </div>
                <Slider
                  id={c.key}
                  className="mt-2"
                  value={[params[c.key]]}
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  onValueChange={([v]) => set(c.key, v!)}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">{c.hint}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="glass-panel rounded-2xl p-5">
            <div className="flex flex-wrap items-center gap-2">
              {running ? (
                <Button onClick={() => setRunning(false)} variant="secondary">
                  <Pause className="mr-2 size-4" /> Pause
                </Button>
              ) : (
                <Button onClick={progress > 0 && progress < 100 ? () => setRunning(true) : run}>
                  <Play className="mr-2 size-4" />
                  {progress > 0 && progress < 100 ? "Resume" : "Run simulation"}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => {
                  setRunning(false);
                  setProgress(0);
                  setParams(DEFAULT_PARAMS);
                  setResult(BASELINE);
                  toast.info("Scenario reset to today's baseline");
                }}
              >
                <RotateCcw className="mr-2 size-4" /> Reset
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const entry: SavedScenario = {
                    id: crypto.randomUUID(),
                    name,
                    params,
                    result,
                    savedAt: new Date().toISOString(),
                  };
                  setSaved((s) => [entry, ...s].slice(0, 8));
                  setCompareId((c) => c ?? entry.id);
                  toast.success("Scenario saved", { description: name });
                }}
              >
                <Save className="mr-2 size-4" /> Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!saved.length) {
                    toast.error("Save a scenario first to compare against it.");
                    return;
                  }
                  setCompareId(saved[0]!.id);
                  toast.info(`Comparing with “${saved[0]!.name}”`);
                }}
              >
                <Scale className="mr-2 size-4" /> Compare
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  download(`${name.replace(/\s+/g, "-").toLowerCase()}.csv`, toCsv(name, result));
                  toast.success("Results exported as CSV");
                }}
              >
                <Download className="mr-2 size-4" /> Export
              </Button>
              <div className="ml-auto flex items-center gap-1">
                {[1, 2, 5, 10].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={speed === s ? "default" : "ghost"}
                    onClick={() => setSpeed(s)}
                  >
                    {s}x
                  </Button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Time-lapse of a simulated 2-hour shift window</span>
                <span>{Math.min(100, Math.round(progress))}%</span>
              </div>
              <Progress value={Math.min(100, progress)} className="mt-2" />
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Throughput" value={`${result.throughput} lines/h`} base={BASELINE.throughput} current={result.throughput} />
            <Metric label="Avg order cycle time" value={`${result.cycleTimeMin} min`} base={BASELINE.cycleTimeMin} current={result.cycleTimeMin} invert />
            <Metric label="Queue length" value={`${result.queueLength} lines`} base={BASELINE.queueLength} current={result.queueLength} invert />
            <Metric label="Cost per hour" value={`$${result.costPerHour}`} base={BASELINE.costPerHour} current={result.costPerHour} invert />
            <Metric label="Utilisation" value={`${result.utilization}%`} base={BASELINE.utilization} current={result.utilization} />
            <Metric label="Delay risk" value={`${result.delayRisk}%`} base={BASELINE.delayRisk} current={result.delayRisk} invert />
            <Metric label="On-time rate" value={`${result.onTimeRate}%`} base={BASELINE.onTimeRate} current={result.onTimeRate} />
            <Metric label="Health score" value={`${result.healthScore}/100`} base={BASELINE.healthScore} current={result.healthScore} />
          </div>

          <Card className="glass-panel rounded-2xl p-5">
            <h2 className="text-sm font-semibold">Simulated shift timeline</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Output and waiting work minute by minute as the scenario plays out.
            </p>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={visible}>
                <CartesianGrid stroke="oklch(1 0 0 / 0.06)" vertical={false} />
                <XAxis dataKey="minute" stroke="oklch(0.72 0.026 254)" fontSize={11} unit="m" />
                <YAxis stroke="oklch(0.72 0.026 254)" fontSize={11} />
                <RTooltip
                  contentStyle={{
                    background: "oklch(0.19 0.03 258)",
                    border: "1px solid oklch(1 0 0 / 0.12)",
                    borderRadius: 12,
                  }}
                />
                <Line dataKey="throughput" stroke="oklch(0.79 0.15 197)" strokeWidth={2} dot={false} />
                <Line dataKey="queue" stroke="oklch(0.64 0.21 22)" strokeWidth={2} dot={false} />
                <Line dataKey="cycleTime" stroke="oklch(0.82 0.16 82)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold">Detected bottlenecks</h2>
              {result.bottlenecks.length === 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  No step is overloaded in this scenario — the flow is balanced.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {result.bottlenecks.map((b) => (
                    <li key={b.label} className="rounded-lg border border-border bg-card/40 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium">{b.zone}</p>
                        <Badge
                          variant={b.severity === "critical" ? "destructive" : "secondary"}
                          className="capitalize"
                        >
                          {b.severity}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{b.impact}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold">Recommendations</h2>
              <ul className="mt-3 space-y-2">
                {result.recommendations.map((r) => (
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
          </div>

          {compare && (
            <Card className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold">
                Comparison — current vs. “{compare.name}”
              </h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="py-2 text-left">Metric</th>
                      <th className="py-2 text-right">Saved</th>
                      <th className="py-2 text-right">Current</th>
                      <th className="py-2 text-right">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["Throughput (lines/h)", compare.result.throughput, result.throughput],
                        ["Cycle time (min)", compare.result.cycleTimeMin, result.cycleTimeMin],
                        ["Queue length", compare.result.queueLength, result.queueLength],
                        ["On-time rate (%)", compare.result.onTimeRate, result.onTimeRate],
                        ["Cost per hour ($)", compare.result.costPerHour, result.costPerHour],
                        ["Health score", compare.result.healthScore, result.healthScore],
                      ] as [string, number, number][]
                    ).map(([label, a, b]) => (
                      <tr key={label} className="border-t border-border">
                        <td className="py-2">{label}</td>
                        <td className="py-2 text-right">{a}</td>
                        <td className="py-2 text-right">{b}</td>
                        <td className="py-2 text-right font-medium">
                          {b - a > 0 ? "+" : ""}
                          {Number((b - a).toFixed(1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {saved.length > 0 && (
            <Card className="glass-panel rounded-2xl p-5">
              <h2 className="text-sm font-semibold">Saved scenarios</h2>
              <ul className="mt-3 space-y-2 text-xs">
                {saved.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-3"
                  >
                    <span>{s.name}</span>
                    <span className="flex items-center gap-2">
                      <Badge variant="secondary">{s.result.throughput} lines/h</Badge>
                      <Button size="sm" variant="ghost" onClick={() => setCompareId(s.id)}>
                        Compare
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setParams(s.params);
                          setResult(s.result);
                          setName(s.name);
                          toast.info(`Loaded “${s.name}”`);
                        }}
                      >
                        Load
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  base,
  current,
  invert,
}: {
  label: string;
  value: string;
  base: number;
  current: number;
  invert?: boolean;
}) {
  const diff = current - base;
  const good = invert ? diff <= 0 : diff >= 0;
  return (
    <Card className="glass-panel rounded-2xl p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className={good ? "mt-1 text-xs text-success" : "mt-1 text-xs text-destructive"}>
        {diff > 0 ? "+" : ""}
        {Number(diff.toFixed(1))} vs. baseline
      </p>
    </Card>
  );
}