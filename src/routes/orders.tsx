import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/twin/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTwin } from "@/lib/twin/store";
import { zoneName } from "@/lib/twin/data";
import { download } from "./simulation";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "Orders — Fulfilment Pipeline | TwinForge AI" },
      {
        name: "description",
        content:
          "Track every order from queued to shipped, spot late promises and move work forward in one click.",
      },
      { property: "og:title", content: "Orders — TwinForge AI" },
      { property: "og:description", content: "Live fulfilment pipeline with priority and delay tracking." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { orders, advanceOrder } = useTwin();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const list = orders
    .filter((o) => (status === "all" ? true : o.status === status))
    .filter((o) => `${o.code} ${o.customer}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell
      title="Orders"
      subtitle="Every open order, how far it has progressed, and whether it will make the promised time."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(["queued", "picking", "packing", "shipped", "delayed"] as const).map((s) => (
          <Card key={s} className="glass-panel rounded-2xl p-4">
            <p className="text-xs capitalize text-muted-foreground">{s}</p>
            <p className="mt-2 text-2xl font-semibold">
              {orders.filter((o) => o.status === s).length}
            </p>
          </Card>
        ))}
      </div>

      <Card className="glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order or customer…"
            aria-label="Search orders"
            className="max-w-xs"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[170px]" aria-label="Filter orders by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["all", "queued", "picking", "packing", "shipped", "delayed"].map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s === "all" ? "All statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="secondary"
            onClick={() => {
              download(
                "twinforge-orders.csv",
                [
                  "order,customer,priority,status,lines,units,promised_min,elapsed_min",
                  ...list.map((o) =>
                    [o.code, o.customer, o.priority, o.status, o.lines, o.units, o.promisedMin, o.elapsedMin].join(","),
                  ),
                ].join("\n"),
              );
              toast.success("Orders exported");
            }}
          >
            Export CSV
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead>Progress vs. promise</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    No orders match this filter.
                  </TableCell>
                </TableRow>
              )}
              {list.map((o) => {
                const pct = Math.min(140, Math.round((o.elapsedMin / o.promisedMin) * 100));
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.code}</TableCell>
                    <TableCell>{o.customer}</TableCell>
                    <TableCell className="capitalize">
                      <Badge variant={o.priority === "critical" ? "destructive" : "secondary"}>
                        {o.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{zoneName(o.zoneId)}</TableCell>
                    <TableCell className="text-right">{o.lines}</TableCell>
                    <TableCell className="text-right">{o.units}</TableCell>
                    <TableCell className="min-w-[140px]">
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={pct > 100 ? "h-full bg-destructive" : "h-full bg-primary"}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {o.elapsedMin} of {o.promisedMin} min used
                      </span>
                    </TableCell>
                    <TableCell className="capitalize">{o.status}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={o.status === "shipped"}
                        onClick={() => {
                          advanceOrder(o.id);
                          toast.success(`${o.code} moved to the next step`);
                        }}
                      >
                        Advance
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </AppShell>
  );
}