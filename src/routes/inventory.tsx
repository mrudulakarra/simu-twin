import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Upload } from "lucide-react";
import { AppShell } from "@/components/twin/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { INVENTORY, ZONES, zoneName } from "@/lib/twin/data";
import type { InventoryItem } from "@/lib/twin/types";
import { download } from "./simulation";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory Control — Stock, Bins & Heatmaps | TwinForge AI" },
      {
        name: "description",
        content:
          "Search, filter and export SKU-level stock with reorder thresholds, turnover rates and zone heatmaps.",
      },
      { property: "og:title", content: "Inventory Control — TwinForge AI" },
      {
        property: "og:description",
        content: "SKU-level stock visibility with fast/slow-moving heatmaps and CSV import/export.",
      },
    ],
  }),
  component: InventoryPage,
});

const PAGE_SIZE = 10;

function stockStatus(i: InventoryItem) {
  if (i.available === 0) return { label: "Out of stock", tone: "destructive" as const };
  if (i.available < i.reorderPoint) return { label: "Low stock", tone: "warning" as const };
  if (i.available > i.reorderPoint * 4) return { label: "Overstocked", tone: "secondary" as const };
  return { label: "Healthy", tone: "success" as const };
}

function InventoryPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"name" | "available" | "turnover">("available");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<InventoryItem[]>(INVENTORY);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => [...new Set(INVENTORY.map((i) => i.category))], []);

  const filtered = useMemo(() => {
    const list = rows
      .filter((i) => (category === "all" ? true : i.category === category))
      .filter((i) =>
        `${i.sku} ${i.name} ${i.bin}`.toLowerCase().includes(q.trim().toLowerCase()),
      )
      .sort((a, b) =>
        sort === "name" ? a.name.localeCompare(b.name) : (b[sort] as number) - (a[sort] as number),
      );
    return list;
  }, [rows, q, category, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const heat = ZONES.map((z) => {
    const items = rows.filter((i) => i.zoneId === z.id);
    const low = items.filter((i) => i.available < i.reorderPoint).length;
    const fast = items.filter((i) => i.velocity === "fast").length;
    return { zone: z.name, items: items.length, low, fast };
  }).filter((h) => h.items > 0);

  return (
    <AppShell
      title="Inventory Control"
      subtitle="What you hold, where it sits, and which SKUs need attention before they run out."
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {heat.map((h) => (
          <Card key={h.zone} className="glass-panel rounded-2xl p-4">
            <p className="text-xs text-muted-foreground">{h.zone}</p>
            <p className="mt-2 text-xl font-semibold">{h.items} SKUs</p>
            <div className="mt-2 flex gap-2 text-[11px]">
              <Badge variant="destructive">{h.low} low</Badge>
              <Badge variant="secondary">{h.fast} fast-moving</Badge>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-[var(--gradient-primary)]"
                style={{ width: `${Math.min(100, (h.fast / Math.max(h.items, 1)) * 100)}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="glass-panel rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
            placeholder="Search SKU, product or bin…"
            aria-label="Search inventory"
            className="max-w-xs"
          />
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[170px]" aria-label="Filter by category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-[170px]" aria-label="Sort inventory">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Sort: quantity</SelectItem>
              <SelectItem value="turnover">Sort: turnover</SelectItem>
              <SelectItem value="name">Sort: name</SelectItem>
            </SelectContent>
          </Select>

          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            aria-label="Import inventory CSV"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const lines = text.trim().split("\n").slice(1);
              const imported = lines
                .map((l, idx) => {
                  const [sku, name, cat, bin, avail] = l.split(",");
                  if (!sku) return null;
                  return {
                    ...INVENTORY[0]!,
                    id: `imp-${idx}`,
                    sku: sku.trim(),
                    name: (name ?? sku).trim(),
                    category: (cat ?? "Imported").trim(),
                    bin: (bin ?? "A1-01").trim(),
                    available: Number(avail ?? 0) || 0,
                  } satisfies InventoryItem;
                })
                .filter(Boolean) as InventoryItem[];
              if (!imported.length) {
                toast.error("No valid rows found in that CSV.");
                return;
              }
              setRows((r) => [...imported, ...r]);
              toast.success(`Imported ${imported.length} SKUs`);
            }}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 size-4" /> Import CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const csv = [
                "sku,name,category,bin,available,reserved,reorder_point,turnover",
                ...filtered.map((i) =>
                  [i.sku, i.name, i.category, i.bin, i.available, i.reserved, i.reorderPoint, i.turnover].join(","),
                ),
              ].join("\n");
              download("twinforge-inventory.csv", csv);
              toast.success("Inventory exported");
            }}
          >
            <Download className="mr-2 size-4" /> Export CSV
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Bin</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Reorder at</TableHead>
                <TableHead className="text-right">Turnover</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    No SKUs match your filters. Try clearing the search box.
                  </TableCell>
                </TableRow>
              )}
              {visible.map((i) => {
                const s = stockStatus(i);
                return (
                  <TableRow
                    key={i.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(selected?.id === i.id ? null : i)}
                  >
                    <TableCell className="font-mono text-xs">{i.sku}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{i.name}</TableCell>
                    <TableCell className="text-muted-foreground">{i.category}</TableCell>
                    <TableCell className="font-mono text-xs">{i.bin}</TableCell>
                    <TableCell className="text-right">{i.available}</TableCell>
                    <TableCell className="text-right">{i.reserved}</TableCell>
                    <TableCell className="text-right">{i.reorderPoint}</TableCell>
                    <TableCell className="text-right">{i.turnover}x</TableCell>
                    <TableCell>
                      <Badge
                        variant={s.tone === "destructive" ? "destructive" : "secondary"}
                        className={s.tone === "success" ? "text-success" : undefined}
                      >
                        {s.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Showing {visible.length} of {filtered.length} SKUs
          </span>
          <span className="flex items-center gap-2">
            <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span>
              Page {page + 1} / {pages}
            </span>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </span>
        </div>
      </Card>

      {selected && (
        <Card className="glass-panel mt-4 rounded-2xl p-5">
          <h2 className="text-sm font-semibold">
            Movement history — {selected.sku} · {selected.name}
          </h2>
          <p className="text-xs text-muted-foreground">
            Stored in {zoneName(selected.zoneId)}, bin {selected.bin}. Velocity: {selected.velocity}.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {selected.movements.map((m, idx) => (
              <li key={idx} className="rounded-lg border border-border bg-card/40 p-3 text-xs">
                <span className="font-mono text-muted-foreground">{m.at}</span>
                <p className="mt-1 capitalize">
                  {m.type} · {m.qty} units
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AppShell>
  );
}