import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ASSETS, INITIAL_ALERTS, ORDERS, WORKERS, WAREHOUSES, zoneById } from "./data";
import type { Alert, Asset, Order, Worker } from "./types";

interface TwinState {
  connected: boolean;
  simTime: Date;
  warehouseId: string;
  setWarehouseId: (id: string) => void;
  assets: Asset[];
  workers: Worker[];
  orders: Order[];
  alerts: Alert[];
  tick: number;
  updateAlert: (id: string, patch: Partial<Alert>) => void;
  advanceOrder: (id: string) => void;
}

const TwinContext = createContext<TwinState | null>(null);

const STATUS_FLOW: Record<Order["status"], Order["status"]> = {
  queued: "picking",
  picking: "packing",
  packing: "shipped",
  delayed: "picking",
  shipped: "shipped",
};

export function TwinProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [warehouseId, setWarehouseId] = useState(WAREHOUSES[0]!.id);
  const [assets, setAssets] = useState<Asset[]>(ASSETS);
  const [workers, setWorkers] = useState<Worker[]>(WORKERS);
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  const start = useRef(new Date("2026-08-18T08:00:00Z"));

  useEffect(() => {
    setHydrated(true);
    const id = window.setInterval(() => setTick((t) => t + 1), 1200);
    return () => window.clearInterval(id);
  }, []);

  // Simulated telemetry: move vehicles and workers inside their zones.
  useEffect(() => {
    if (!tick) return;
    setAssets((prev) =>
      prev.map((a) => {
        if (a.kind === "conveyor" || a.kind === "scanner" || a.status !== "active") return a;
        const z = zoneById(a.zoneId)!;
        const heading = (a.heading + (Math.sin(tick + a.x) * 26 + 8)) % 360;
        const rad = (heading * Math.PI) / 180;
        let x = a.x + Math.cos(rad) * a.speed * 0.7;
        let y = a.y + Math.sin(rad) * a.speed * 0.7;
        x = Math.min(z.x + z.w - 1.5, Math.max(z.x + 1.5, x));
        y = Math.min(z.y + z.h - 1.5, Math.max(z.y + 1.5, y));
        const battery = Math.max(6, a.battery - (a.kind === "amr" ? 0.12 : 0.05));
        return { ...a, x, y, heading, battery: Number(battery.toFixed(1)) };
      }),
    );
    setWorkers((prev) =>
      prev.map((w) => {
        const z = zoneById(w.zoneId)!;
        const x = Math.min(z.x + z.w - 1, Math.max(z.x + 1, w.x + Math.sin(tick + w.picksPerHour)));
        const y = Math.min(z.y + z.h - 1, Math.max(z.y + 1, w.y + Math.cos(tick + w.accuracy)));
        return { ...w, x, y };
      }),
    );
    if (tick % 6 === 0) {
      setOrders((prev) => {
        const idx = (tick / 6) % prev.length;
        return prev.map((o, i) => (i === idx ? { ...o, status: STATUS_FLOW[o.status] } : o));
      });
    }
  }, [tick]);

  const simTime = useMemo(
    () => new Date(start.current.getTime() + tick * 60_000),
    [tick],
  );

  const updateAlert = useCallback((id: string, patch: Partial<Alert>) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const advanceOrder = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: STATUS_FLOW[o.status] } : o)),
    );
  }, []);

  const value: TwinState = {
    connected: hydrated,
    simTime,
    warehouseId,
    setWarehouseId,
    assets,
    workers,
    orders,
    alerts,
    tick,
    updateAlert,
    advanceOrder,
  };

  return <TwinContext.Provider value={value}>{children}</TwinContext.Provider>;
}

export function useTwin() {
  const ctx = useContext(TwinContext);
  if (!ctx) throw new Error("useTwin must be used inside TwinProvider");
  return ctx;
}