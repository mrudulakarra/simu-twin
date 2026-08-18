# TwinFlow Labs

Build a premium full-stack web application named TwinForge AI — Digital Twin Warehouse Simulator.

Core purpose: Create a realistic, interactive digital replica of a warehouse where managers can visualize inventory, racks, workers, forklifts/AGVs, orders, and operational flow. Users must be able to run “what-if” simulations—such as demand spikes, blocked aisles, delayed shipments, equipment downtime, and additional workers—before applying changes in a real warehouse. A warehouse digital twin commonly combines warehouse-management data, IoT/telemetry, spatial layout data, simulation, and analytics.

cleverence

+1

Target users: Warehouse managers, logistics teams, supply-chain analysts, and business administrators.

Preferred stack:

Frontend: React + Vite, TypeScript, Tailwind CSS, Framer Motion

3D warehouse visualization: Three.js with React Three Fiber

Charts: Recharts or Chart.js

Backend: Python Flask REST API

Database: PostgreSQL using SQLAlchemy; allow SQLite for local demo mode

Authentication: JWT or secure session authentication with admin and analyst roles

Real-time simulation updates: Socket.IO / WebSockets

Build it step by step

Step 1 — Project foundation

Generate a clean professional monorepo structure with separate frontend and backend folders.

Add .env.example, README.md, API documentation, setup commands, requirements files, and seed-data scripts.

Use reusable components, clean naming, validation, error handling, loading states, and responsive design.

Step 2 — Premium visual design

Create a luxury industrial-tech interface inspired by modern logistics command centers.

Use a dark graphite/navy background, glassmorphism panels, electric cyan, violet, and emerald highlights.

Use subtle grid backgrounds, smooth micro-animations, polished shadows, rounded cards, modern typography, and excellent color contrast.

Add a collapsible left sidebar: Overview, Live Twin, Simulation Lab, Inventory, Fleet, Orders, Analytics, Alerts, Settings.

Add a top bar with global search, warehouse selector, live connection indicator, notifications, user menu, and current simulation time.

Step 3 — Warehouse digital twin

Build an interactive 2D/3D warehouse map with zones: receiving dock, storage racks, cold storage, picking area, packing station, shipping dock, charging zone, and returns area.

Display racks, aisles, pallets, bins, forklifts, AMRs/AGVs, workers, conveyors, and dock doors.

Allow pan, zoom, rotate, hover tooltips, object selection, and a minimap.

Clicking an object should open an information panel with operational details, status, utilization, assigned task, and recent events.

Use simulated real-time movement for forklifts, robots, inventory, and order flow.

Step 4 — Live command dashboard

Create KPI cards for total inventory units, active orders, throughput per hour, picking accuracy, on-time shipment rate, active workers, fleet utilization, bottleneck count, and estimated operational cost.

Add charts for hourly throughput, order fulfillment, zone utilization, inventory movement, equipment uptime, and order-processing time.

Add a “Warehouse Health Score” from 0 to 100 with a clear breakdown of issues and recommendations.

Step 5 — Simulation Lab

Create a scenario builder where the user can set parameters:

Incoming order volume

Worker count

Forklift/AMR count

Picking speed

Conveyor speed

Dock availability

Equipment failure probability

Warehouse traffic density

Supplier delay

Demand surge percentage

Add scenario templates: Peak Season Surge, Forklift Breakdown, Night Shift, Staff Shortage, High-Priority Order Rush, and Layout Optimization.

Add Run, Pause, Resume, Reset, Save Scenario, Compare Scenario, and Export Results buttons.

Show a time-lapse control and simulation speed options: 1x, 2x, 5x, 10x.

Step 6 — Simulation intelligence

Implement a simple but realistic simulation engine in Python.

Model inventory movement, queue buildup, pick-pack-ship flow, worker assignments, fleet routes, equipment downtime, and order delays.

Calculate throughput, average order cycle time, picking time, queue length, utilization, delay risk, warehouse congestion, and operational cost.

Detect bottlenecks such as overloaded picking zones, blocked aisles, limited docks, low inventory, and unavailable vehicles.

Generate AI-style recommendations in plain language, for example: “Add one AMR to Zone B to reduce average picking delay” or “Move fast-selling SKUs closer to packing stations.”

Step 7 — Inventory control

Create inventory pages with SKU, product name, category, bin location, available quantity, reserved quantity, reorder threshold, stock status, turnover rate, and movement history.

Add stock heatmaps that show low-stock, overstocked, fast-moving, and slow-moving zones.

Include filters, sorting, pagination, search, CSV import, CSV export, and realistic demo data.

Step 8 — Fleet and asset tracking

Create a Fleet page for forklifts, AMRs, conveyors, and scanners.

Show each asset’s current position, battery level, assigned task, speed, health state, maintenance schedule, utilization, and last activity.

Add alerts for low battery, maintenance due, collisions/traffic risk, idle equipment, and equipment offline.

Step 9 — Alerts center

Create prioritized alerts with Critical, High, Medium, and Low severity badges.

Include bottleneck alerts, low-stock warnings, delayed orders, dock congestion, device failures, safety incidents, and route conflicts.

Allow acknowledge, assign, resolve, filter, and export actions.

Step 10 — Analytics

Build analytics pages for warehouse performance by time period, zone, product category, worker shift, and fleet type.

Provide before-versus-after scenario comparison charts.

Include a recommendation impact panel that estimates improved throughput, lower delay, reduced travel distance, or operational savings.

Step 11 — Backend models and APIs

Create database models for Warehouse, Zone, Rack, Bin, Product, InventoryItem, Order, OrderItem, Worker, Vehicle, Equipment, SensorEvent, SimulationScenario, SimulationRun, Alert, and Recommendation.

Create REST APIs for dashboard data, warehouse layout, inventory, fleet, orders, simulation parameters, simulation execution, alerts, and analytics.

Add role-based permissions and audit logs for important changes.

Step 12 — Demo experience

Seed realistic demo data for one large warehouse: 8 zones, 100+ storage locations, 50 products, 30 active orders, 8 workers, 4 forklifts, 6 AMRs, and simulated sensor events.

Include an onboarding modal explaining how to explore the live twin and run a first scenario.

Make the site fully usable without external hardware by generating simulated IoT/WMS data.

Security and quality rules

Use protected routes, password hashing, input validation, CSRF protection where applicable, secure environment variables, and ORM-based database access.

Make all major buttons functional; do not create placeholder screens.

Use accessible labels, keyboard navigation, responsive layouts, skeleton loaders, empty states, confirmation modals, toast notifications, and clear errors.

Explain every metric and recommendation in simple business language.

Output format required:

Show the complete project folder structure first.

Show database schema and API route plan.

Generate the application file by file.

Provide installation and run instructions.

Provide a polished README with screenshots placeholders and feature explanations.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/26fce481-2433-44e8-ab62-66b322cda8dc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
