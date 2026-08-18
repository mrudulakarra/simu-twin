import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/twin/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTwin } from "@/lib/twin/store";
import { zoneName } from "@/lib/twin/data";
import type { Severity } from "@/lib/twin/types";
import { download } from "./simulation";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts Center — Bottlenecks, Stock & Safety | TwinForge AI" },
      {
        name: "description",
        content:
          "Prioritised warehouse alerts with acknowledge, assign, resolve, filter and export actions.",
      },
      { property: "og:title", content: "Alerts Center — TwinForge AI" },
      { property: "og:description", content: "Everything that needs a decision, ranked by urgency." },
    ],
  }),
  component: AlertsPage,
});

const SEV_ORDER: Severity[] = ["critical", "high", "medium", "low"];

function AlertsPage() {
  const { alerts, updateAlert } = useTwin();
  const [filter, setFilter] = useState<"all" | Severity>("all");
  const [confirm, setConfirm] = useState<string | null>(null);

  const list = [...alerts]
    .filter((a) => (filter === "all" ? true : a.severity === filter))
    .sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity));

  return (
    <AppShell
      title="Alerts Center"
      subtitle="Issues ranked by urgency, each with a plain explanation of what it means for the operation."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {SEV_ORDER.map((s) => (
              <TabsTrigger key={s} value={s} className="capitalize">
                {s}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          variant="secondary"
          className="ml-auto"
          onClick={() => {
            download(
              "twinforge-alerts.csv",
              [
                "severity,type,title,zone,state,assignee",
                ...list.map((a) =>
                  [a.severity, a.type, `"${a.title}"`, zoneName(a.zoneId), a.state, a.assignee ?? ""].join(","),
                ),
              ].join("\n"),
            );
            toast.success("Alerts exported");
          }}
        >
          Export CSV
        </Button>
      </div>

      <div className="space-y-3">
        {list.length === 0 && (
          <Card className="glass-panel rounded-2xl p-10 text-center text-sm text-muted-foreground">
            Nothing here — no alerts at this severity.
          </Card>
        )}
        {list.map((a) => (
          <Card key={a.id} className="glass-panel rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={a.severity === "critical" || a.severity === "high" ? "destructive" : "secondary"}
                    className="capitalize"
                  >
                    {a.severity}
                  </Badge>
                  <Badge variant="outline">{a.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {zoneName(a.zoneId)} · {a.at}
                  </span>
                  {a.state !== "open" && (
                    <Badge variant="secondary" className="capitalize">
                      {a.state}
                      {a.assignee ? ` · ${a.assignee}` : ""}
                    </Badge>
                  )}
                </div>
                <h2 className="mt-2 font-medium">{a.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{a.detail}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={a.state !== "open"}
                  onClick={() => {
                    updateAlert(a.id, { state: "acknowledged" });
                    toast.info("Alert acknowledged");
                  }}
                >
                  Acknowledge
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    updateAlert(a.id, { assignee: "M. Kiet" });
                    toast.success("Assigned to you");
                  }}
                >
                  Assign to me
                </Button>
                <Button
                  size="sm"
                  disabled={a.state === "resolved"}
                  onClick={() => setConfirm(a.id)}
                >
                  Resolve
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resolve this alert?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark the issue as handled. It stays in the log for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirm) updateAlert(confirm, { state: "resolved" });
                setConfirm(null);
                toast.success("Alert resolved");
              }}
            >
              Resolve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}