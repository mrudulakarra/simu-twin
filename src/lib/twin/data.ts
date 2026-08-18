import type { Alert, Asset, InventoryItem, Order, Rack, Worker, Zone } from "./types";

/** Deterministic pseudo-random so demo data is stable between server and client renders. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
const rand = rng(20260818);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!;
const int = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1));

export const WAREHOUSES = [
  { id: "wh-north", name: "Rotterdam North DC", region: "EU-West" },
  { id: "wh-south", name: "Chennai South Hub", region: "APAC" },
  { id: "wh-mid", name: "Dallas Midpoint DC", region: "NA-Central" },
];

export const ZONES: Zone[] = [
  {
    id: "z-recv",
    name: "Receiving Dock",
    kind: "receiving",
    x: 2,
    y: 2,
    w: 22,
    h: 16,
    capacity: 100,
    load: 62,
  },
  {
    id: "z-stor-a",
    name: "Storage Racks A",
    kind: "storage",
    x: 26,
    y: 2,
    w: 34,
    h: 26,
    capacity: 100,
    load: 78,
  },
  {
    id: "z-cold",
    name: "Cold Storage",
    kind: "cold",
    x: 62,
    y: 2,
    w: 20,
    h: 16,
    capacity: 100,
    load: 54,
  },
  {
    id: "z-pick",
    name: "Picking Area",
    kind: "picking",
    x: 26,
    y: 30,
    w: 34,
    h: 20,
    capacity: 100,
    load: 91,
  },
  {
    id: "z-pack",
    name: "Packing Stations",
    kind: "packing",
    x: 62,
    y: 20,
    w: 20,
    h: 18,
    capacity: 100,
    load: 73,
  },
  {
    id: "z-ship",
    name: "Shipping Dock",
    kind: "shipping",
    x: 62,
    y: 40,
    w: 20,
    h: 16,
    capacity: 100,
    load: 68,
  },
  {
    id: "z-charge",
    name: "Charging Zone",
    kind: "charging",
    x: 2,
    y: 20,
    w: 22,
    h: 14,
    capacity: 100,
    load: 34,
  },
  {
    id: "z-return",
    name: "Returns Area",
    kind: "returns",
    x: 2,
    y: 36,
    w: 22,
    h: 20,
    capacity: 100,
    load: 41,
  },
];

export const zoneById = (id: string) => ZONES.find((z) => z.id === id);
export const zoneName = (id: string) => zoneById(id)?.name ?? "Unassigned";

export const RACKS: Rack[] = (() => {
  const racks: Rack[] = [];
  const layouts: { zoneId: string; cols: number; rows: number }[] = [
    { zoneId: "z-stor-a", cols: 6, rows: 4 },
    { zoneId: "z-cold", cols: 3, rows: 3 },
    { zoneId: "z-pick", cols: 5, rows: 2 },
  ];
  for (const l of layouts) {
    const z = zoneById(l.zoneId)!;
    const cw = (z.w - 4) / l.cols;
    const ch = (z.h - 6) / l.rows;
    for (let r = 0; r < l.rows; r++) {
      for (let c = 0; c < l.cols; c++) {
        racks.push({
          id: `${l.zoneId}-r${r}${c}`,
          zoneId: l.zoneId,
          code: `${l.zoneId.slice(-1).toUpperCase()}${r + 1}-${String(c + 1).padStart(2, "0")}`,
          x: z.x + 2 + c * cw,
          y: z.y + 4 + r * ch,
          w: cw * 0.72,
          h: ch * 0.5,
          bins: 12,
          fill: int(30, 99),
        });
      }
    }
  }
  return racks;
})();

const CATEGORIES = [
  "Electronics",
  "Beverages",
  "Apparel",
  "Home",
  "Frozen Food",
  "Industrial",
  "Health",
];
const PRODUCT_WORDS = [
  "Thermal Sensor",
  "Cold Brew Pack",
  "Merino Jacket",
  "Ceramic Mug Set",
  "Frozen Berries",
  "Hydraulic Valve",
  "Vitamin Pack",
  "LED Panel",
  "Sparkling Water",
  "Running Shoes",
  "Steel Bracket",
  "Air Filter",
];

export const INVENTORY: InventoryItem[] = Array.from({ length: 50 }, (_, i) => {
  const category = CATEGORIES[i % CATEGORIES.length]!;
  const zoneId = pick(["z-stor-a", "z-cold", "z-pick", "z-return"]);
  const available = int(0, 1400);
  const turnover = Number((rand() * 9 + 0.4).toFixed(1));
  return {
    id: `inv-${i + 1}`,
    sku: `TF-${String(1000 + i * 7)}`,
    name: `${PRODUCT_WORDS[i % PRODUCT_WORDS.length]} ${String.fromCharCode(65 + (i % 6))}${i + 1}`,
    category,
    zoneId,
    bin: `${zoneId.slice(-1).toUpperCase()}${int(1, 6)}-${String(int(1, 24)).padStart(2, "0")}`,
    available,
    reserved: int(0, Math.max(1, Math.floor(available * 0.25))),
    reorderPoint: int(80, 320),
    turnover,
    velocity: turnover > 6 ? "fast" : turnover > 3 ? "medium" : "slow",
    movements: Array.from({ length: 6 }, (_, m) => ({
      at: `T-${(6 - m) * 2}h`,
      type: pick(["inbound", "pick", "pick", "return"] as const),
      qty: int(4, 120),
    })),
  } satisfies InventoryItem;
});

const CUSTOMERS = [
  "Nordwind Retail",
  "Aurora Foods",
  "Vertex Systems",
  "BluePeak Sports",
  "Halcyon Health",
  "Kestrel Industrial",
];

export const ORDERS: Order[] = Array.from({ length: 30 }, (_, i) => {
  const status = pick(["queued", "picking", "picking", "packing", "shipped", "delayed"] as const);
  const promised = int(45, 180);
  return {
    id: `ord-${i + 1}`,
    code: `SO-${9000 + i * 3}`,
    customer: pick(CUSTOMERS),
    priority: pick(["standard", "standard", "express", "critical"] as const),
    status,
    lines: int(1, 14),
    units: int(3, 220),
    placedAt: `T-${int(1, 9)}h`,
    promisedMin: promised,
    elapsedMin: status === "delayed" ? promised + int(8, 70) : int(4, promised),
    zoneId: pick(["z-pick", "z-pack", "z-ship", "z-stor-a"]),
  } satisfies Order;
});

export const WORKERS: Worker[] = Array.from({ length: 8 }, (_, i) => {
  const zoneId = pick(["z-pick", "z-pack", "z-recv", "z-ship", "z-return"]);
  const z = zoneById(zoneId)!;
  return {
    id: `wrk-${i + 1}`,
    name: [
      "A. Rahman",
      "L. Okafor",
      "M. Silva",
      "K. Nyberg",
      "J. Duarte",
      "S. Iyer",
      "T. Novak",
      "R. Bennett",
    ][i]!,
    role: pick(["Picker", "Packer", "Dock Lead", "Inventory Clerk"]),
    shift: pick(["Morning", "Evening", "Night"] as const),
    zoneId,
    x: z.x + rand() * z.w,
    y: z.y + rand() * z.h,
    picksPerHour: int(48, 130),
    accuracy: Number((96 + rand() * 3.7).toFixed(1)),
    status: pick(["active", "active", "active", "break"] as const),
  } satisfies Worker;
});

const TASKS = [
  "Pallet move → Packing",
  "Replenish rack A3-04",
  "Pick wave #212",
  "Dock 2 unload",
  "Return sortation",
  "Idle — awaiting task",
];

function makeAsset(id: string, name: string, kind: Asset["kind"], zoneId: string): Asset {
  const z = zoneById(zoneId)!;
  const battery = int(12, 100);
  return {
    id,
    name,
    kind,
    zoneId,
    x: z.x + 2 + rand() * (z.w - 4),
    y: z.y + 2 + rand() * (z.h - 4),
    heading: rand() * 360,
    speed: kind === "conveyor" ? 0 : Number((0.6 + rand() * 1.9).toFixed(2)),
    battery,
    health: int(62, 100),
    utilization: int(35, 96),
    task: pick(TASKS),
    status: battery < 20 ? "charging" : pick(["active", "active", "active", "idle"] as const),
    nextService: `in ${int(2, 40)} days`,
    lastActivity: `${int(1, 25)} min ago`,
  };
}

export const ASSETS: Asset[] = [
  ...Array.from({ length: 4 }, (_, i) =>
    makeAsset(
      `fk-${i + 1}`,
      `Forklift FK-${i + 1}`,
      "forklift",
      pick(["z-recv", "z-stor-a", "z-ship"]),
    ),
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    makeAsset(`amr-${i + 1}`, `AMR-${i + 1}`, "amr", pick(["z-pick", "z-pack", "z-charge"])),
  ),
  ...Array.from({ length: 3 }, (_, i) =>
    makeAsset(`cnv-${i + 1}`, `Conveyor CV-${i + 1}`, "conveyor", pick(["z-pack", "z-ship"])),
  ),
  ...Array.from({ length: 3 }, (_, i) =>
    makeAsset(`scn-${i + 1}`, `Scanner SC-${i + 1}`, "scanner", pick(["z-recv", "z-return"])),
  ),
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: "al-1",
    severity: "critical",
    type: "Bottleneck",
    title: "Picking Area queue exceeds capacity",
    detail: "Open pick tasks are piling up faster than the team can clear them.",
    zoneId: "z-pick",
    at: "2 min ago",
    state: "open",
  },
  {
    id: "al-2",
    severity: "high",
    type: "Fleet",
    title: "AMR-3 battery below 15%",
    detail: "Robot will stop mid-route unless it returns to the charging zone.",
    zoneId: "z-charge",
    at: "6 min ago",
    state: "open",
  },
  {
    id: "al-3",
    severity: "high",
    type: "Orders",
    title: "4 express orders past promised time",
    detail: "Late orders risk service-level penalties with two key accounts.",
    zoneId: "z-ship",
    at: "11 min ago",
    state: "open",
  },
  {
    id: "al-4",
    severity: "medium",
    type: "Inventory",
    title: "9 SKUs below reorder point",
    detail: "Stock will run out within roughly two days at current sales speed.",
    zoneId: "z-stor-a",
    at: "23 min ago",
    state: "open",
  },
  {
    id: "al-5",
    severity: "medium",
    type: "Dock",
    title: "Dock 3 congestion detected",
    detail: "Two trailers are waiting longer than 30 minutes to unload.",
    zoneId: "z-recv",
    at: "31 min ago",
    state: "acknowledged",
    assignee: "L. Okafor",
  },
  {
    id: "al-6",
    severity: "low",
    type: "Safety",
    title: "Route conflict near aisle A4",
    detail: "A forklift and an AMR crossed paths twice in the last hour.",
    zoneId: "z-stor-a",
    at: "44 min ago",
    state: "open",
  },
  {
    id: "al-7",
    severity: "low",
    type: "Equipment",
    title: "Scanner SC-2 offline",
    detail: "Handheld scanner has not reported since the shift change.",
    zoneId: "z-return",
    at: "1 h ago",
    state: "resolved",
  },
];

export const HOURLY_THROUGHPUT = Array.from({ length: 12 }, (_, i) => ({
  hour: `${String(8 + i).padStart(2, "0")}:00`,
  units: 420 + Math.round(Math.sin(i / 1.7) * 130) + int(-40, 60),
  orders: 48 + Math.round(Math.cos(i / 2.1) * 14) + int(-6, 8),
  cycleTime: 42 + Math.round(Math.sin(i / 2.6) * 9) + int(-3, 4),
}));

export const UPTIME_SERIES = ["Forklifts", "AMRs", "Conveyors", "Scanners"].map((name) => ({
  name,
  uptime: int(88, 99),
  downtime: 0,
})).map((r) => ({ ...r, downtime: 100 - r.uptime }));