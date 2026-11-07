# Grantly — a clearer scholarship journey

React/TypeScript/Vite frontend, Node API and optional Supabase accounts. Continues the original Grantly design and working features.

## VS Code setup

1. Install Node.js 22.13+ (22 or 24 LTS).
2. Extract the ZIP and open `Grantly-VSCode` in VS Code.
3. Run `npm install` (or `npm ci` for locked versions).
4. Copy `.env.example` to `.env.local`.
5. Configure the services described in `docs/API_SETUP.md`, or leave values blank for local discovery/tracking.
6. Run `npm run dev`. Open **http://127.0.0.1:5173/**. The API uses port 3001.

Never commit private keys or prefix them with `VITE_`. `.env.local` is ignored and excluded from the ZIP.

## Features

Five fully curated Indian scholarship records plus an NSP listing inventory; search and advanced filters; explainable four-state eligibility; source-linked details; bookmarks/comparison; application statuses, notes and CSV; shared preparation checklist; Preparation Multiplier; deadline timeline/calendar and in-app reminders; bounded Gemini guidance; optional Supabase signup/sign-in and explicit cloud save/load.

Eligibility is preliminary guidance against sourced rules, not official approval or an award probability. The five-record matcher is not a live or exhaustive national directory. The NSP inventory can be refreshed from its official listing with `npm run refresh:nsp`; this only refreshes discovery names, listing dates and official document links. It does not automatically verify eligibility or add schemes to match results. Old fictional records are no longer used. Their browser data is retained under its old namespace, without silent conversion to real applications.

## Commands

```sh
npm test
npm run typecheck
npm run format:check
npm run build
npm run refresh:nsp
npm start
```

Development starts both frontend and API. Production serves the build and API on `PORT` (default 3001). `npm run preview` is frontend-only and expects the API separately.

## Data and accounts

Guest progress stays in this browser. Signed-in local state is isolated by user ID. Load your account workspace before editing, then explicitly save; after refreshing, load again before saving an existing remote workspace. Revision conflicts prevent silent overwrites. Guest progress can be explicitly copied locally into a signed-in workspace. Reminder preferences are per-device and are not cloud-synchronized. No document files are uploaded.

## Deployment

Use a Node-capable host. Build: `npm ci && npm run build`. Start: `npm start`. A Render Blueprint is provided in `render.yaml`; see `docs/DEPLOY_RENDER.md`. Set `APP_ORIGIN` to the exact deployed HTTPS origin, without trailing slash, unless the host provides a trusted external URL fallback (Render's `RENDER_EXTERNAL_URL` is supported). Set public Supabase variables before build and at runtime; private Gemini values only at runtime. Apply the migration and configure auth redirects first. Production always requires Supabase sign-in for AI. Production binds to `0.0.0.0`.

Rate limits are in-memory per process/IP; multi-instance hosting requires a shared store. Configure trusted reverse proxies explicitly before relying on client-IP limits. Static-only hosting loses the API. No deployment was performed for this version.

## Source structure

- `src/`: existing workspace plus account, assistant, deadline/calendar and preparation components.
- `lib/`: eligibility, dates, storage validation, exports and preparation ranking.
- `data/scholarships.json`: shared client/server source catalog.
- `data/nsp-schemes.json`: refreshable NSP listing snapshot with official listing windows and document links; inventory-only records are not match-ranked.
- `server/index.mjs`: validation, rate limits, auth checks, Gemini and production serving.
- `scripts/refresh-nsp.mjs`: manually refreshes the public NSP listing without auto-approving eligibility rules.
- `supabase/migrations/001_grantly.sql`: schema, owner RLS and atomic revision-checked RPCs.
- `supabase/seed.sql`: optional public catalog seed; regenerate with `npm run seed`.
- `tests/`: domain and mocked API tests.
- `public/favicon.svg`: brand asset. Hero art uses CSS/SVG; optional Google Fonts have system fallbacks.

Read `FEATURE_AUDIT.md`, `docs/API_SETUP.md`, `docs/DATA_SOURCES.md` and `docs/DEMO.md` before submitting.
