import { useEffect, useMemo, useRef, useState } from "react";
import { RACKS, ZONES, zoneName } from "@/lib/twin/data";
import { useTwin } from "@/lib/twin/store";
import type { Asset, Worker, Zone } from "@/lib/twin/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, RotateCcw } from "lucide-react";

const W = 84;
const H = 58;

const ZONE_FILL: Record<Zone["kind"], string> = {
  receiving: "oklch(0.79 0.15 197 / 0.14)",
  storage: "oklch(0.64 0.19 295 / 0.14)",
  cold: "oklch(0.79 0.15 220 / 0.18)",
  picking: "oklch(0.82 0.16 82 / 0.14)",
  packing: "oklch(0.75 0.16 162 / 0.14)",
  shipping: "oklch(0.79 0.15 197 / 0.1)",
  charging: "oklch(0.75 0.16 162 / 0.1)",
  returns: "oklch(0.64 0.21 22 / 0.12)",
};

export type Selection =
  | { type: "zone"; id: string }
  | { type: "asset"; id: string }
  | { type: "worker"; id: string }
  | null;

export function WarehouseMap({
  selection,
  onSelect,
}: {
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  const { assets, workers } = useTwin();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [rotate, setRotate] = useState(0);
  const [hover, setHover] = useState<{ label: string; x: number; y: number } | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const { zoom: z, offset: o } = stateRef.current;
      const next = Math.min(4, Math.max(0.6, z * Math.exp(-dy * 0.0015)));
      const k = next / z;
      setOffset({ x: px - (px - o.x) * k, y: py - (py - o.y) * k });
      setZoom(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) => {
    const el = containerRef.current;
    const rect = el?.getBoundingClientRect();
    const px = (rect?.width ?? 600) / 2;
    const py = (rect?.height ?? 400) / 2;
    const next = Math.min(4, Math.max(0.6, zoom * factor));
    const k = next / zoom;
    setOffset({ x: px - (px - offset.x) * k, y: py - (py - offset.y) * k });
    setZoom(next);
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setRotate(0);
  };

  const selectedId = selection?.id;
  const scale = useMemo(() => zoom, [zoom]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="glass-panel relative h-[520px] w-full overflow-hidden rounded-2xl"
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setOffset({
            x: drag.current.ox + (e.clientX - drag.current.x),
            y: drag.current.oy + (e.clientY - drag.current.y),
          });
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => {
          drag.current = null;
          setHover(null);
        }}
        style={{ touchAction: "none", cursor: drag.current ? "grabbing" : "grab" }}
      >
        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-[520px] w-full"
            style={{ transform: `rotate(${rotate}deg)` }}
            role="img"
            aria-label="Interactive warehouse map"
          >
            <defs>
              <pattern id="floor" width="4" height="4" patternUnits="userSpaceOnUse">
                <path d="M4 0 L0 0 0 4" fill="none" stroke="oklch(1 0 0 / 0.05)" strokeWidth="0.15" />
              </pattern>
            </defs>
            <rect x="0" y="0" width={W} height={H} fill="url(#floor)" />

            {ZONES.map((z) => (
              <g
                key={z.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({ type: "zone", id: z.id });
                }}
                onMouseEnter={() =>
                  setHover({ label: `${z.name} — ${z.load}% utilised`, x: z.x, y: z.y })
                }
                className="cursor-pointer"
              >
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  rx="1.5"
                  fill={ZONE_FILL[z.kind]}
                  stroke={
                    selectedId === z.id ? "oklch(0.79 0.15 197)" : "oklch(1 0 0 / 0.16)"
                  }
                  strokeWidth={selectedId === z.id ? 0.5 : 0.2}
                />
                <text x={z.x + 1.2} y={z.y + 2.6} fontSize="1.5" fill="oklch(0.95 0.01 250 / 0.85)">
                  {z.name}
                </text>
              </g>
            ))}

            {RACKS.map((r) => (
              <rect
                key={r.id}
                x={r.x}
                y={r.y}
                width={r.w}
                height={r.h}
                rx="0.3"
                fill={`oklch(0.79 0.15 197 / ${0.12 + (r.fill / 100) * 0.5})`}
                stroke="oklch(1 0 0 / 0.12)"
                strokeWidth="0.1"
              >
                <title>{`Rack ${r.code} — ${r.fill}% full`}</title>
              </rect>
            ))}

            {/* conveyor line between packing and shipping */}
            <line
              x1="72"
              y1="38"
              x2="72"
              y2="40"
              stroke="oklch(0.75 0.16 162)"
              strokeWidth="0.6"
              strokeDasharray="1 0.6"
            />

            {workers.map((w) => (
              <g
                key={w.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({ type: "worker", id: w.id });
                }}
                onMouseEnter={() => setHover({ label: `${w.name} — ${w.role}`, x: w.x, y: w.y })}
                className="cursor-pointer"
              >
                <circle
                  cx={w.x}
                  cy={w.y}
                  r={selectedId === w.id ? 0.95 : 0.7}
                  fill="oklch(0.82 0.16 82)"
                  stroke="oklch(0.16 0.028 258)"
                  strokeWidth="0.15"
                />
              </g>
            ))}

            {assets.map((a: Asset) => (
              <g
                key={a.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({ type: "asset", id: a.id });
                }}
                onMouseEnter={() =>
                  setHover({ label: `${a.name} — ${a.status}, ${Math.round(a.battery)}%`, x: a.x, y: a.y })
                }
                className="cursor-pointer"
              >
                <rect
                  x={a.x - 0.9}
                  y={a.y - 0.9}
                  width="1.8"
                  height="1.8"
                  rx={a.kind === "amr" ? 0.9 : 0.3}
                  fill={
                    a.kind === "forklift"
                      ? "oklch(0.64 0.19 295)"
                      : a.kind === "amr"
                        ? "oklch(0.79 0.15 197)"
                        : a.kind === "conveyor"
                          ? "oklch(0.75 0.16 162)"
                          : "oklch(0.64 0.21 22)"
                  }
                  stroke={selectedId === a.id ? "oklch(0.96 0.008 250)" : "transparent"}
                  strokeWidth="0.3"
                />
              </g>
            ))}
          </svg>
        </div>

        {hover && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border bg-popover/90 px-3 py-1.5 text-xs backdrop-blur">
            {hover.label}
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex gap-1.5">
          <Button size="icon" variant="secondary" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
            <Plus className="size-4" />
          </Button>
          <Button size="icon" variant="secondary" aria-label="Zoom out" onClick={() => zoomBy(0.8)}>
            <Minus className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Rotate map"
            onClick={() => setRotate((r) => (r + 15) % 360)}
          >
            <RotateCcw className="size-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={reset}>
            Reset view
          </Button>
        </div>

        {/* Minimap */}
        <div className="absolute bottom-3 left-3 hidden rounded-lg border border-border bg-background/80 p-1 backdrop-blur sm:block">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-20 w-28">
            {ZONES.map((z) => (
              <rect
                key={z.id}
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                fill={ZONE_FILL[z.kind]}
                stroke="oklch(1 0 0 / 0.2)"
                strokeWidth="0.3"
              />
            ))}
            {assets.map((a) => (
              <circle key={a.id} cx={a.x} cy={a.y} r="0.9" fill="oklch(0.79 0.15 197)" />
            ))}
          </svg>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {[
          ["Forklift", "oklch(0.64 0.19 295)"],
          ["AMR", "oklch(0.79 0.15 197)"],
          ["Conveyor", "oklch(0.75 0.16 162)"],
          ["Scanner", "oklch(0.64 0.21 22)"],
          ["Worker", "oklch(0.82 0.16 82)"],
        ].map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: color }} /> {label}
          </span>
        ))}
        <span className="ml-auto">Drag to pan · scroll to zoom · click any object for details</span>
      </div>
    </div>
  );
}

export function SelectionPanel({ selection }: { selection: Selection }) {
  const { assets, workers, orders } = useTwin();

  if (!selection) {
    return (
      <div className="glass-panel flex h-full min-h-[220px] flex-col items-center justify-center rounded-2xl p-6 text-center text-sm text-muted-foreground">
        Select a zone, vehicle, or worker on the map to inspect live operational details.
      </div>
    );
  }

  if (selection.type === "zone") {
    const z = ZONES.find((x) => x.id === selection.id)!;
    const inZone = assets.filter((a) => a.zoneId === z.id);
    const staff = workers.filter((w) => w.zoneId === z.id);
    const zoneOrders = orders.filter((o) => o.zoneId === z.id);
    return (
      <div className="glass-panel space-y-4 rounded-2xl p-5">
        <div>
          <Badge variant="secondary" className="capitalize">
            {z.kind}
          </Badge>
          <h3 className="mt-2 text-lg font-semibold">{z.name}</h3>
          <p className="text-sm text-muted-foreground">
            This zone is {z.load}% used. Above 90% work usually starts to queue.
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn("h-full rounded-full", z.load > 88 ? "bg-destructive" : "bg-primary")}
            style={{ width: `${z.load}%` }}
          />
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Assets present" value={inZone.length} />
          <Stat label="Workers" value={staff.length} />
          <Stat label="Open orders" value={zoneOrders.length} />
          <Stat label="Capacity" value={`${z.capacity} slots`} />
        </dl>
      </div>
    );
  }

  if (selection.type === "asset") {
    const a = assets.find((x) => x.id === selection.id)!;
    return (
      <div className="glass-panel space-y-4 rounded-2xl p-5">
        <div>
          <Badge variant="secondary" className="capitalize">
            {a.kind}
          </Badge>
          <h3 className="mt-2 text-lg font-semibold">{a.name}</h3>
          <p className="text-sm text-muted-foreground">
            {a.task} · currently in {zoneName(a.zoneId)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Status" value={a.status} />
          <Stat label="Battery" value={`${Math.round(a.battery)}%`} />
          <Stat label="Speed" value={`${a.speed} m/s`} />
          <Stat label="Health" value={`${a.health}%`} />
          <Stat label="Utilisation" value={`${a.utilization}%`} />
          <Stat label="Next service" value={a.nextService} />
        </dl>
        <p className="text-xs text-muted-foreground">Last activity {a.lastActivity}.</p>
      </div>
    );
  }

  const w = workers.find((x) => x.id === selection.id)!;
  return (
    <div className="glass-panel space-y-4 rounded-2xl p-5">
      <Badge variant="secondary">{w.role}</Badge>
      <h3 className="text-lg font-semibold">{w.name}</h3>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Shift" value={w.shift} />
        <Stat label="Zone" value={zoneName(w.zoneId)} />
        <Stat label="Picks / hour" value={w.picksPerHour} />
        <Stat label="Accuracy" value={`${w.accuracy}%`} />
        <Stat label="Status" value={w.status} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize">{value}</dd>
    </div>
  );
}