# 🤝 Systemic Consensing Tool

A modern web application for decision-making through **Systemic Consensus** — finding solutions with minimal resistance rather than maximum approval. Part of the **Toolchain family** of management tools, backed by the shared **DocPouch** document database.

![Vue.js](https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## Features

- **Resistance-based voting** — rate your resistance to each option from 0 (no resistance) to 10 (strong opposition)
- **Live results** — automatic ranking from lowest to highest total resistance
- **Session management** — create, join and import sessions, stored in DocPouch (no backend needed)
- **Multi-participant support** — every authenticated DocPouch user can participate
- **Time-limited voting periods** — optional session duration
- **JSON import** — import structured documents (e.g. SWOT) and vote on a selected category
- **Multiple export formats** — CSV, JSON, Markdown, Excel

## Architecture

```
┌───────────────────────────┐         ┌──────────────────────────┐
│  Toolchain Hosting        │         │  DocPouch (DB)          │
│  https://tapassio.pantek.ch│        │  https://docpouch.pantek.app │
│                           │         │                          │
│  /Tools/SysConsens (app)  │────────▶│  - Structures            │
│  /Tools/SysConsens/manifest│ HTTPS   │  - Documents (sessions)  │
│  Tool Manager (TTM)       │         │  - OIDC provider         │
└───────────────────────────┘         └──────────────────────────┘
```

- **Toolchain hosting** (`tapassio.pantek.ch`) serves the built app and its `manifest.json`. Same-origin, no CORS required.
- **DocPouch** (`docpouch.pantek.app`) is the shared backend: it stores the consensus sessions and acts as the OIDC identity provider. There is **no custom backend** in this repository.

## Getting Started

### Prerequisites

- Node.js ≥ 16
- A running DocPouch instance (see `docpouch-dev/` for a local Docker setup)

### Local development

```bash
npm install
docker compose -f docpouch-dev/docker-compose.yml up -d   # local DocPouch on :3031
npm run dev
```

The dev server runs at `http://localhost:3001` and talks to the local DocPouch at `http://localhost:3031` (JWT login, `admin` / `adminSecret`).

### Production build

```bash
npm run build
```

Output goes to `dist/`. The Vite `base` is `/Tools/SysConsens/`, so the app is deployed as a sub-path of the Toolchain host.

### Production deployment

Deployed via SFTP to `/www/Tools/SysConsens` on `tapassio.pantek.ch` (port `2222`). See `RUNBOOK.md` for the full tool-agnostic integration guide (manifest, DocPouch structures, TDD registration, OIDC client, verification).

## Configuration

All environment-specific settings live in `src/config/docpouch.js`:

| Setting | Local | Production |
|---|---|---|
| `DOCPOUCH_URL` | `http://localhost:3031` | `https://docpouch.pantek.app` |
| `AUTH_METHOD` | `jwt` | `oidc` |
| `OIDC_CONFIG.clientId` | — | auto-registered OIDC client ID |
| `OIDC_CONFIG.redirectUri` | `http://localhost:3001/` | `https://tapassio.pantek.ch/Tools/SysConsens/` |
| `CONSENSUS_STRUCTURE` | `{ type: 6, subType: 0 }` | `{ type: 6, subType: 0 }` |

> The `redirectUri` must point to the app's own URL on the Toolchain host — not to the DocPouch host.

## Tool Manifest

`public/manifest.json` describes the tool for the Tool Manager (TTM):

- `roles` — the `consensusSession` structure (question, options, endTime, status, votes) stored in DocPouch
- `icon` — base64-encoded PNG icon shown in the Tool Manager

## Project Structure

```
├── public/
│   ├── manifest.json          # Tool Manager manifest
│   └── favicon.ico
├── src/
│   ├── components/            # LoginView, SessionSidebar, VotingPanel, ResultsPanel, AboutPanel
│   ├── composables/
│   │   ├── useAuth.js         # JWT/OIDC authentication against DocPouch
│   │   └── useConsensusData.js# Session CRUD + voting persistence in DocPouch
│   ├── config/
│   │   └── docpouch.js        # DocPouch URL, OIDC config, structure
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── docpouch-dev/              # Local DocPouch (Docker) + payload files
│   ├── docker-compose.yml
│   └── structure-consensus-session.json
├── index.html
├── vite.config.js             # base: /Tools/SysConsens/
└── RUNBOOK.md                 # Toolchain-Integrationsanleitung (Deutsch)
```

## Documentation

- [`RUNBOOK.md`](RUNBOOK.md) — step-by-step guide (in German) for integrating tools into the Toolchain: repo hygiene, manifest creation, DocPouch structures, TDD registration, OIDC client registration, build and deployment.

## License

See [LICENSE](LICENSE).

---

**Made with ❤️ for better decision-making**
