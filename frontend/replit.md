# DRONIC — Internal Operations Dashboard

A React + TypeScript + Vite frontend-only web application for drone fleet operations management.

## Stack

- **Framework**: React 19 + TypeScript
- **Build tool**: Vite 7 (dev server on port 5000)
- **Styling**: Plain CSS with CSS custom properties (dark theme)
- **No backend** — frontend only with static data

## Project Structure

```
src/
  components/
    Sidebar.tsx / Sidebar.css   — Left navigation bar
    StatCard.tsx / StatCard.css — Metric summary cards
  pages/
    Dashboard.tsx / Dashboard.css — Main overview with stats and activity
    Operations.tsx                — Mission log table
    Fleet.tsx                     — Unit registry with battery indicators
    Alerts.tsx                    — Active alert list
    Settings.tsx / Settings.css   — System configuration UI
    Page.css                      — Shared page/table/badge styles
  App.tsx / App.css               — Root layout and navigation state
  main.tsx                        — Entry point
  index.css                       — Global CSS variables and resets
index.html
vite.config.ts                    — Port 5000, allowedHosts: true
tsconfig.json
```

## Running

The app runs via the "Start application" workflow:

```
npm run dev
```

Vite dev server binds to `0.0.0.0:5000` with HMR enabled.

## Pages

| Page | Route (nav) | Description |
|---|---|---|
| Dashboard | dashboard | KPI cards, activity feed, fleet status bars |
| Operations | operations | Mission log table with statuses |
| Fleet | fleet | Unit registry with battery bar visualizations |
| Alerts | alerts | Critical/warning/info alert table |
| Settings | settings | Toggles, text inputs, selects for system config |

## Design

- Dark theme using CSS custom properties
- Color-coded status badges (green/orange/red/blue)
- Sidebar navigation with active state highlighting
- Responsive grid layouts
