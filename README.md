# DairyPro — full-stack rebuild

This replaces the old Base44-hosted app with a FastAPI backend you run yourself
and a React frontend that talks to it. Two folders:

```
backend/    FastAPI + SQLite API
frontend/   React (Vite) app
android/    Native Android app (Kotlin + Jetpack Compose) — see android/README.md
```

## Important context

The original frontend export you gave me (`claude_zip_frontend.zip`) turned out
to be **truncated** — about 40 page/component files were cut off mid-function
(all around 25 lines), and their real logic had already been replaced by
empty stubs. Two entity schema files were also corrupted. So this isn't a
byte-for-byte restoration of your old code — it's a fresh implementation
covering the same 19 entities and the same feature areas described in your
migration audit (`10__5th_Wednesday_2026.md`), with my own UI/component
structure.

**Simplifications from the original, worth knowing about:**
- Every entity (Cattle, MilkProduction, HealthRecord, etc.) is stored in one
  generic `records` table (id, entity_type, data JSON, owner, timestamps)
  rather than 19 separate hand-modeled tables. This mirrors how Base44 itself
  stored schema-less entities, and made a full rebuild tractable — but if you
  want strict per-entity SQL tables with real foreign keys later, that's a
  natural next step.
- Records are farm-wide (any signed-in user can read all of them) rather than
  scoped to the record's creator — a shared farm dataset made more sense than
  literal per-user row isolation. Role-based **write** restrictions are
  enforced server-side (e.g. only admin/manager can edit Settings).
- `AIInsights` and `MilkTrendForecast` (under Predictive Analytics) still
  call an LLM exactly like the original, but through this app's own backend
  endpoint (`/api/integrations/invoke-llm`) instead of Base44. Set
  `ANTHROPIC_API_KEY` on the backend to enable them — without it they show a
  clear "not configured" message instead of failing silently.
- `FinancialForecast`'s scenario engine (`forecastEngine.js`) is a straight
  port of the original — pure math, no external dependency, works with or
  without an AI key.
- No offline mode / service worker and no drag-and-drop kanban boards from
  the original feature list. Everything else — Reports (7 tabs with CSV/PDF
  export), Predictive Analytics, feeding schedule automation, stock
  adjustments, consumption logging, shopping list auto-generation with email
  alerts, breeding calendar, cattle detail profiles, role matrix — has been
  rebuilt from your actual source files.
- `CattleGroup`, `MilkYieldAlert`, and `DashboardSettings` entities exist on
  the backend (full CRUD via the generic entities API) but don't have a
  dedicated management page yet — `CattleGroup` is used as a dropdown in the
  Inventory consumption form. Say the word if you want management UI for
  these.

## Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit if you want real email/AI
uvicorn app.main:app --reload --port 8000
```

The first person to register (see frontend) automatically becomes `admin`.
Everyone after that starts as `staff` (change roles from Settings → Users).

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL, defaults to http://localhost:8000
npm run dev
```

Open http://localhost:5173, click "First time here? Set up your farm", and
register your admin account.

## Deploying

- Backend: any host that runs a Python ASGI app (Render, Railway, Fly.io, a
  VPS with `uvicorn`/`gunicorn`). Swap the SQLite file for Postgres by
  changing `SQLALCHEMY_DATABASE_URL` in `backend/app/database.py` if you
  outgrow SQLite.
- Frontend: `npm run build` produces `frontend/dist` — deploy as a static
  site (Vercel, Netlify, Cloudflare Pages, S3+CloudFront, etc.), and set
  `VITE_API_URL` to your deployed backend's URL at build time.
