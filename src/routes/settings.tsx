import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/twin/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings & Roles — TwinForge AI" },
      {
        name: "description",
        content:
          "Configure warehouse profile, alert thresholds, simulation defaults and role-based access for admins and analysts.",
      },
      { property: "og:title", content: "Settings & Roles — TwinForge AI" },
      { property: "og:description", content: "Warehouse profile, thresholds and access control." },
    ],
  }),
  component: SettingsPage,
});

const ROLES = [
  {
    role: "Administrator",
    who: "Operations leadership",
    can: "Full access: edit layout, run and publish scenarios, manage users, resolve alerts.",
  },
  {
    role: "Analyst",
    who: "Supply-chain analysts",
    can: "Read all data, run and save simulations, export reports. Cannot change layout or users.",
  },
  {
    role: "Viewer",
    who: "Shift supervisors",
    can: "Read dashboards and alerts only.",
  },
];

function SettingsPage() {
  const [name, setName] = useState("Rotterdam North DC");
  const [lowStock, setLowStock] = useState(120);
  const [battery, setBattery] = useState(20);
  const [liveTelemetry, setLiveTelemetry] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  return (
    <AppShell
      title="Settings"
      subtitle="Warehouse profile, alert thresholds and who is allowed to change what."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-panel space-y-4 rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Warehouse profile</h2>
          <div>
            <Label htmlFor="wh-name">Display name</Label>
            <Input id="wh-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <Label htmlFor="low-stock" className="text-xs">
                Low-stock alert threshold (units)
              </Label>
              <span className="font-mono text-primary">{lowStock}</span>
            </div>
            <Slider
              id="low-stock"
              className="mt-2"
              value={[lowStock]}
              min={20}
              max={500}
              step={10}
              onValueChange={([v]) => setLowStock(v!)}
            />
          </div>
          <div>
            <div className="flex justify-between text-xs">
              <Label htmlFor="battery" className="text-xs">
                Low-battery alert threshold (%)
              </Label>
              <span className="font-mono text-primary">{battery}</span>
            </div>
            <Slider
              id="battery"
              className="mt-2"
              value={[battery]}
              min={5}
              max={50}
              step={1}
              onValueChange={([v]) => setBattery(v!)}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm">Live telemetry stream</p>
              <p className="text-xs text-muted-foreground">Simulated IoT feed updating the twin.</p>
            </div>
            <Switch checked={liveTelemetry} onCheckedChange={setLiveTelemetry} aria-label="Live telemetry" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm">Daily email digest</p>
              <p className="text-xs text-muted-foreground">Morning summary of KPIs and open alerts.</p>
            </div>
            <Switch checked={emailDigest} onCheckedChange={setEmailDigest} aria-label="Email digest" />
          </div>
          <Button onClick={() => toast.success("Settings saved")}>Save settings</Button>
        </Card>

        <Card className="glass-panel space-y-4 rounded-2xl p-5">
          <h2 className="text-sm font-semibold">Roles &amp; permissions</h2>
          <ul className="space-y-2">
            {ROLES.map((r) => (
              <li key={r.role} className="rounded-lg border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{r.role}</p>
                  <Badge variant="secondary">{r.who}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.can}</p>
              </li>
            ))}
          </ul>
          <h2 className="pt-2 text-sm font-semibold">Audit log</h2>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li>M. Kiet ran scenario “Peak Season Surge” · 12 min ago</li>
            <li>L. Okafor acknowledged dock congestion alert · 31 min ago</li>
            <li>System imported 42 inventory rows from WMS feed · 1 h ago</li>
            <li>S. Iyer exported the fleet utilisation report · 2 h ago</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}