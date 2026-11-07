<div align="center">

# Grantly

### Find scholarships that fit. Know what to do next.

Discover source-linked opportunities, understand how your profile matches, and keep application preparation in one place.

[**Open the live demo →**](https://grantly-99fg.onrender.com) · [Demo walkthrough](docs/DEMO.md) · [Data sources & coverage](docs/DATA_SOURCES.md)

</div>

---

## The problem

For many students, finding financial support is not one search—it is a maze of portals, scattered eligibility rules, unclear deadlines, and application details that are easy to lose. A long list of links does not tell a student which opportunity may fit, why it may fit, what still needs checking, or what to prepare next.

## The solution

**Grantly turns scholarship discovery into a guided, explainable journey.** It brings a carefully sourced starter catalog and an official discovery inventory into one workspace, compares scholarship criteria with a student's profile, and helps organize saved opportunities and application preparation.

The goal is clarity and useful next steps—not a promise of eligibility, selection, or funding.

## What you can do

- **Discover opportunities:** Search and filter scholarship records, explore recommendations, and follow links to official sources and application portals.
- **Understand eligibility:** See explainable outcomes, including what matches, what does not, and what is still unknown because information is missing or uncertain.
- **Use an income estimate:** Enter an exact annual household income or choose an approximate range when an exact figure is not known. Ranges that cross a rule boundary remain uncertain rather than being treated as a definite match.
- **Build a shortlist:** Bookmark scholarships and compare opportunities side by side.
- **Organize applications:** Track application status, add notes, use a preparation checklist, and export your tracker as CSV.
- **Plan the work:** Review saved opportunities on a dashboard, see preparation priorities and missing tasks, and use the Preparation Multiplier to organize shared preparation.
- **Keep deadlines visible:** Use the deadline timeline, calendar, and in-app reminders for supported dates. Conflicting or unverified dates are not presented as confirmed reminders.
- **Ask for guided discovery:** Use the optional Gemini-powered assistant to navigate the catalog and get source-linked guidance. It is bounded to the app's scholarship data, not a general authority on eligibility.
- **Choose how to save:** Use the app as a local guest, or configure Supabase accounts for explicit cloud save/load.

## How Grantly works

1. **Explore** the catalog and open the official source for a scholarship.
2. **Add profile details** that are relevant to the published criteria.
3. **Review the match explanation**—including missing details and uncertainty.
4. **Save opportunities** and track preparation in your workspace.
5. **Verify and apply with the provider.** Grantly does not submit applications on a student's behalf.

Eligibility results are preliminary guidance based on the rules and sources recorded in the app. The scholarship authority makes the final decision.

## Try the demo

**Live app:** [grantly-99fg.onrender.com](https://grantly-99fg.onrender.com)

For a quick product tour, see the [2–3 minute judging walkthrough](docs/DEMO.md). Use a synthetic profile for demonstrations; do not enter sensitive personal information into the assistant.

## Coverage and integrity

Grantly is an actively developed, source-conscious prototype—not an exhaustive directory of every scholarship in India.

- The eligibility matcher currently contains **five manually curated scholarship records**.
- A separate NSP listing snapshot contains **31 scheme names captured on 7 November 2026**. Listing presence does not mean a scheme's current rules, benefits, deadline, or eligibility have been verified in Grantly.
- Only curated records are used for eligibility matching. Inventory-only names are not ranked as matches.
- The NSP refresh command updates the public listing snapshot; it does not automatically verify rules or add schemes to the matcher.
- Dates may be unknown, expired, or conflicting. Those limitations are disclosed rather than guessed.
- Official rules can change. Always confirm current requirements with the linked scholarship authority before applying.

See [official sources, verification scope, and known date caveats](docs/DATA_SOURCES.md).

## Privacy and account behavior

- Guest progress is stored in the current browser. Clearing browser data may remove it.
- Cloud save/load is explicit and requires a configured Supabase project. Remote workspace data is protected with owner-scoped row-level security; load before editing and save when ready.
- No scholarship documents are uploaded by Grantly.
- The assistant sends the question and limited scholarship context to Google Gemini. Stored profile details, tracker notes, and documents are not included. Requests use `store: false`; still avoid putting sensitive information into questions.
- The Gemini API key is server-only. Never put it in a `VITE_` variable or commit it to Git.

Read [API setup and data-flow details](docs/API_SETUP.md) before enabling integrations.

## Run locally

### Requirements

- Node.js **22.13 or newer**
- npm

### Start the app

```bash
git clone https://github.com/parthkumar10/grantly.git
cd grantly
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). The development command starts the Vite frontend and Node API. The app can be explored as a local guest without configuring optional integrations.

To enable Supabase or Gemini, follow [API setup](docs/API_SETUP.md). Keep `.env.local` private and untracked; `.env.example` contains placeholders only.

## Development

```bash
npm test
npm run typecheck
npm run format:check
npm run build
```

Additional commands:

```bash
npm start                 # Serve the production build and API
npm run preview            # Preview the frontend build only
npm run refresh:nsp        # Refresh the public NSP listing snapshot
npm run seed               # Regenerate the optional Supabase catalog seed
```

## Technology

- **Frontend:** React 19, TypeScript, Vite
- **API:** Node.js, Express
- **Optional services:** Supabase Auth/Postgres for accounts and explicit cloud sync; Google Gemini for bounded assistant responses
- **Quality:** Node test runner, TypeScript type-checking, Prettier

## Project structure

| Path | Purpose |
| --- | --- |
| `src/` | App UI, account context, assistant, deadlines, and preparation components |
| `lib/` | Eligibility matching, dates, validation, storage, exports, and preparation ranking |
| `data/scholarships.json` | Curated records used by the eligibility matcher |
| `data/nsp-schemes.json` | NSP listing snapshot; discovery inventory, not verified matcher data |
| `server/index.mjs` | API validation, auth checks, rate limits, Gemini gateway, and production serving |
| `scripts/refresh-nsp.mjs` | Manual refresh of the public NSP listing snapshot |
| `supabase/migrations/` | Account/workspace schema, row-level security, and revision-checked save/load |
| `tests/` | Eligibility, storage, date, preparation, and API tests |
| `docs/` | Demo, data-source, API setup, and deployment documentation |

## Deployment

The app is deployed on Render at **[grantly-99fg.onrender.com](https://grantly-99fg.onrender.com)**. For deployment configuration, environment variables, and Supabase redirect setup, see [Render deployment instructions](docs/DEPLOY_RENDER.md).

The app needs a Node-capable host for its API; a static-only host is not sufficient. Optional integrations require their own configuration. Hosting plans may sleep when idle or have other availability limits.

## Current limitations

- The curated eligibility catalog is intentionally small and not exhaustive.
- Eligibility matching is guidance, not official verification, approval, ranking, or an award prediction.
- No application is submitted automatically.
- In-app deadline reminders do not send email or push notifications; they work while the app is open.
- Supabase account and cross-device behavior depends on project configuration.
- API rate limits are in-memory per process; multi-instance deployments need a shared rate-limit store.
- The live service and external providers may be unavailable or change independently of this repository.

---

<div align="center">

**Grantly — clearer scholarship discovery, from search to next step.**

</div>
