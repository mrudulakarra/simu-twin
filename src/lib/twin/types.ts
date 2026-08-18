export type ZoneKind =
  | "receiving"
  | "storage"
  | "cold"
  | "picking"
  | "packing"
  | "shipping"
  | "charging"
  | "returns";

export interface Zone {
  id: string;
  name: string;
  kind: ZoneKind;
  x: number;
  y: number;
  w: number;
  h: number;
  capacity: number;
  load: number;
}

export interface Rack {
  id: string;
  zoneId: string;
  code: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bins: number;
  fill: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unitCost: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  zoneId: string;
  bin: string;
  available: number;
  reserved: number;
  reorderPoint: number;
  turnover: number;
  velocity: "fast" | "medium" | "slow";
  movements: { at: string; type: "inbound" | "pick" | "return"; qty: number }[];
}

export type OrderStatus = "queued" | "picking" | "packing" | "shipped" | "delayed";

export interface Order {
  id: string;
  code: string;
  customer: string;
  priority: "standard" | "express" | "critical";
  status: OrderStatus;
  lines: number;
  units: number;
  placedAt: string;
  promisedMin: number;
  elapsedMin: number;
  zoneId: string;
}

export type AssetKind = "forklift" | "amr" | "conveyor" | "scanner";

export interface Asset {
  id: string;
  name: string;
  kind: AssetKind;
  zoneId: string;
  x: number;
  y: number;
  heading: number;
  speed: number;
  battery: number;
  health: number;
  utilization: number;
  task: string;
  status: "active" | "idle" | "charging" | "maintenance" | "offline";
  nextService: string;
  lastActivity: string;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  shift: "Morning" | "Evening" | "Night";
  zoneId: string;
  x: number;
  y: number;
  picksPerHour: number;
  accuracy: number;
  status: "active" | "break" | "offline";
}

export type Severity = "critical" | "high" | "medium" | "low";

export interface Alert {
  id: string;
  severity: Severity;
  type: string;
  title: string;
  detail: string;
  zoneId: string;
  at: string;
  state: "open" | "acknowledged" | "resolved";
  assignee?: string;
}

export interface SimParams {
  orderVolume: number;
  workers: number;
  forklifts: number;
  amrs: number;
  pickingSpeed: number;
  conveyorSpeed: number;
  docks: number;
  failureProbability: number;
  trafficDensity: number;
  supplierDelay: number;
  demandSurge: number;
}

export interface SimResult {
  throughput: number;
  cycleTimeMin: number;
  pickTimeMin: number;
  queueLength: number;
  utilization: number;
  delayRisk: number;
  congestion: number;
  costPerHour: number;
  onTimeRate: number;
  healthScore: number;
  bottlenecks: { zone: string; label: string; severity: Severity; impact: string }[];
  recommendations: { title: string; detail: string; impact: string }[];
  timeline: {
    minute: number;
    throughput: number;
    queue: number;
    cycleTime: number;
    utilization: number;
  }[];
}

export interface SavedScenario {
  id: string;
  name: string;
  params: SimParams;
  result: SimResult;
  savedAt: string;
}