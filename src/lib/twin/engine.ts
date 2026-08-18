import type { SimParams, SimResult, Severity } from "./types";

export const DEFAULT_PARAMS: SimParams = {
  orderVolume: 470,
  workers: 12,
  forklifts: 4,
  amrs: 6,
  pickingSpeed: 100,
  conveyorSpeed: 100,
  docks: 4,
  failureProbability: 6,
  trafficDensity: 35,
  supplierDelay: 10,
  demandSurge: 0,
};

export const SCENARIO_TEMPLATES: { id: string; name: string; blurb: string; params: SimParams }[] =
  [
    {
      id: "peak",
      name: "Peak Season Surge",
      blurb: "Holiday demand pushes order volume far above a normal day.",
      params: { ...DEFAULT_PARAMS, orderVolume: 1150, demandSurge: 65, trafficDensity: 78 },
    },
    {
      id: "forklift",
      name: "Forklift Breakdown",
      blurb: "Two forklifts are out of service, so pallet moves slow down.",
      params: { ...DEFAULT_PARAMS, forklifts: 2, failureProbability: 22 },
    },
    {
      id: "night",
      name: "Night Shift",
      blurb: "Lower staffing and lower volume overnight.",
      params: { ...DEFAULT_PARAMS, workers: 4, orderVolume: 280, docks: 2, pickingSpeed: 88 },
    },
    {
      id: "shortage",
      name: "Staff Shortage",
      blurb: "Three pickers called out sick during a normal volume day.",
      params: { ...DEFAULT_PARAMS, workers: 5, pickingSpeed: 92 },
    },
    {
      id: "rush",
      name: "High-Priority Order Rush",
      blurb: "A wave of express orders must ship within the hour.",
      params: { ...DEFAULT_PARAMS, orderVolume: 830, demandSurge: 35, docks: 5, amrs: 8 },
    },
    {
      id: "layout",
      name: "Layout Optimization",
      blurb: "Fast-moving SKUs relocated near packing; less travel, less traffic.",
      params: { ...DEFAULT_PARAMS, pickingSpeed: 122, trafficDensity: 38, amrs: 8 },
    },
  ];

const clamp = (v: number, min = 0, max = 100) => Math.min(max, Math.max(min, v));

/**
 * Deterministic queueing-style model of the pick → pack → ship flow.
 * Capacity is expressed in order-lines per hour and compared against demand.
 */
export function runSimulation(p: SimParams): SimResult {
  const demand = p.orderVolume * (1 + p.demandSurge / 100);

  const pickCapacity = p.workers * 62 * (p.pickingSpeed / 100);
  const fleetCapacity = (p.forklifts * 70 + p.amrs * 60) * (1 - p.trafficDensity / 260);
  const packCapacity = 720 * (p.conveyorSpeed / 100);
  const shipCapacity = p.docks * 165;

  const reliability = 1 - p.failureProbability / 130;
  const stages = [
    { zone: "Picking Area", label: "Picking capacity", cap: pickCapacity * reliability },
    { zone: "Aisles & Fleet", label: "Fleet transport capacity", cap: fleetCapacity * reliability },
    { zone: "Packing Stations", label: "Packing capacity", cap: packCapacity * reliability },
    { zone: "Shipping Dock", label: "Dock capacity", cap: shipCapacity },
  ];

  const effectiveCapacity = Math.min(...stages.map((s) => s.cap));
  const throughput = Math.round(Math.min(demand, effectiveCapacity));
  const utilization = clamp((demand / Math.max(effectiveCapacity, 1)) * 100, 4, 130);

  const overflow = Math.max(0, demand - effectiveCapacity);
  const queueLength = Math.round(overflow * 0.55 + p.trafficDensity * 0.4);

  const baseCycle = 28 + 4200 / Math.max(effectiveCapacity, 60);
  const congestion = clamp(p.trafficDensity * 0.6 + (utilization - 70) * 0.7, 2, 100);
  const pickTimeMin = Number((6.2 * (100 / p.pickingSpeed) * (1 + congestion / 220)).toFixed(1));
  const cycleTimeMin = Number(
    (
      baseCycle * (1 + congestion / 180) +
      queueLength * 0.22 +
      p.supplierDelay * 0.35
    ).toFixed(1),
  );

  const delayRisk = clamp(
    (utilization - 82) * 1.6 + p.failureProbability * 1.2 + p.supplierDelay * 0.9,
    2,
    99,
  );
  const onTimeRate = clamp(100 - delayRisk * 0.72, 35, 99.4);

  const labourCost = p.workers * 27;
  const fleetCost = p.forklifts * 18 + p.amrs * 12;
  const dockCost = p.docks * 9;
  const penalty = (100 - onTimeRate) * 6.5;
  const costPerHour = Math.round(labourCost + fleetCost + dockCost + penalty + queueLength * 0.9);

  const healthScore = Math.round(
    clamp(
      100 -
        Math.max(0, utilization - 88) * 1.3 -
        delayRisk * 0.35 -
        congestion * 0.18 -
        queueLength * 0.05,
      5,
      100,
    ),
  );

  const bottlenecks = stages
    .filter((s) => demand / s.cap > 0.92)
    .sort((a, b) => a.cap - b.cap)
    .map((s) => {
      const ratio = demand / s.cap;
      const severity: Severity =
        ratio > 1.3 ? "critical" : ratio > 1.12 ? "high" : ratio > 1.0 ? "medium" : "low";
      return {
        zone: s.zone,
        label: s.label,
        severity,
        impact: `Demand is ${Math.round((ratio - 1) * 100)}% above what this step can handle, so work waits here.`,
      };
    });

  if (p.supplierDelay > 25) {
    bottlenecks.push({
      zone: "Receiving Dock",
      label: "Late inbound shipments",
      severity: p.supplierDelay > 45 ? "high" : "medium",
      impact: "Stock arrives late, so replenishment and picking start behind schedule.",
    });
  }

  const recommendations: SimResult["recommendations"] = [];
  const worst = bottlenecks[0];
  if (worst?.zone === "Picking Area") {
    recommendations.push({
      title: `Add ${Math.max(1, Math.ceil(overflow / 62))} picker(s) to the picking area`,
      detail:
        "Picking is the slowest step right now. Extra hands clear the queue before it reaches packing.",
      impact: `Up to +${Math.round(Math.min(overflow, 62 * 2))} order lines per hour`,
    });
  }
  if (worst?.zone === "Aisles & Fleet") {
    recommendations.push({
      title: "Add one AMR to Zone B to reduce average picking delay",
      detail:
        "Transport between racks and packing is the constraint; one more robot shortens waiting time at the racks.",
      impact: `-${Math.round(cycleTimeMin * 0.09)} min average order cycle time`,
    });
  }
  if (worst?.zone === "Shipping Dock") {
    recommendations.push({
      title: "Open one more dock door during the peak window",
      detail: "Finished orders are waiting for a loading slot instead of leaving the building.",
      impact: `+${Math.round(165 * 0.8)} order lines shipped per hour`,
    });
  }
  if (worst?.zone === "Packing Stations") {
    recommendations.push({
      title: "Raise conveyor speed or open a second packing lane",
      detail: "Packing is holding back completed picks from reaching the dock.",
      impact: `+${Math.round(packCapacity * 0.15)} order lines per hour`,
    });
  }
  if (p.trafficDensity > 65) {
    recommendations.push({
      title: "Introduce one-way aisle routing in the storage block",
      detail: "Heavy cross traffic makes vehicles stop and wait; one-way lanes keep them moving.",
      impact: `-${Math.round(congestion * 0.2)}% congestion`,
    });
  }
  if (p.pickingSpeed < 105) {
    recommendations.push({
      title: "Move fast-selling SKUs closer to packing stations",
      detail: "Shorter walking distance for the top 20% of SKUs lifts picks per hour immediately.",
      impact: "+8–14% picking speed with no extra staff",
    });
  }
  if (p.failureProbability > 12) {
    recommendations.push({
      title: "Bring forward preventive maintenance on the oldest forklifts",
      detail: "Breakdown risk is high enough that unplanned downtime is likely during this shift.",
      impact: `-${Math.round(p.failureProbability * 0.5)}% delay risk`,
    });
  }
  if (!recommendations.length) {
    recommendations.push({
      title: "Current setup is balanced — hold resources steady",
      detail: "No step is overloaded. Extra staff or vehicles would raise cost without adding output.",
      impact: `Saves about $${Math.round(costPerHour * 0.08)} per hour vs. over-staffing`,
    });
  }

  const timeline = Array.from({ length: 24 }, (_, i) => {
    const ramp = Math.min(1, (i + 1) / 6);
    const wave = 1 + Math.sin(i / 3.4) * 0.12;
    return {
      minute: i * 5,
      throughput: Math.round((throughput / 12) * ramp * wave),
      queue: Math.round(queueLength * ramp * (1.15 - Math.cos(i / 4) * 0.15)),
      cycleTime: Number((cycleTimeMin * (0.86 + (i / 24) * 0.28)).toFixed(1)),
      utilization: Math.round(utilization * (0.8 + ramp * 0.2)),
    };
  });

  return {
    throughput,
    cycleTimeMin,
    pickTimeMin,
    queueLength,
    utilization: Math.round(utilization),
    delayRisk: Math.round(delayRisk),
    congestion: Math.round(congestion),
    costPerHour,
    onTimeRate: Number(onTimeRate.toFixed(1)),
    healthScore,
    bottlenecks: bottlenecks.slice(0, 4),
    recommendations: recommendations.slice(0, 4),
    timeline,
  };
}

export const BASELINE = runSimulation(DEFAULT_PARAMS);