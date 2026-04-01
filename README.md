# Ikadou Backoffice

Interface d'administration React pour le projet Ikadou.

## Stack

- **Framework** — React 18 + Vite
- **Styling** — TailwindCSS + shadcn/ui (Radix UI)
- **State** — Redux Toolkit
- **Routing** — React Router v6
- **Forms** — React Hook Form + Zod
- **Charts** — Recharts (Phase 2+)
- **HTTP** — Axios avec intercepteurs JWT

## Installation

```bash
npm install
cp .env.example .env
```

## Démarrage

```bash
npm run dev
# → http://localhost:5173
```

> Le proxy Vite redirige `/api/*` vers `http://localhost:5000`

## Architecture

```
src/
├── Api/            ← Instances Axios + appels API par module
├── assets/         ← Icônes, images, fonts
├── components/
│   ├── ui/         ← Composants shadcn/ui (Button, Input, Card…)
│   └── custome/    ← Composants app (MainLayout, ProtectedRoute…)
├── context/        ← AuthContext (init session)
├── lib/            ← utils (cn, etc.)
├── pages/          ← 1 dossier par module (Auth, Dashboard, Leads…)
├── Redux/          ← Store + slices par module
├── services/       ← Logique utilitaire front (Phase 2+)
├── Util/           ← Helpers (dates, statuts, formatage)
├── App.jsx         ← Routeur principal
└── main.jsx        ← Point d'entrée React
```

## Rôles et accès

| Route            | Rôles autorisés                    |
|------------------|------------------------------------|
| /dashboard       | Tous                               |
| /leads           | Tous                               |
| /clients         | Tous                               |
| /terrains        | Tous                               |
| /visites         | Tous                               |
| /paiements       | admin, super_admin, manager, finance |
| /reporting       | admin, super_admin, manager, finance |
| /utilisateurs    | admin, super_admin                 |
| /agents          | Tous                               |
| /support         | Tous                               |
| /notifications   | Tous                               |

## Phases de développement

- **Phase 1** ✅ — Fondations (Auth, routing, layout, DB, API)
- **Phase 2** 🔜 — Leads, Clients, Terrains
- **Phase 3** 🔜 — Visites, Paiements, Documents
- **Phase 4** 🔜 — Support, Notifications
- **Phase 5** 🔜 — Dashboard, Reporting, Agents, Users
# backoffice
