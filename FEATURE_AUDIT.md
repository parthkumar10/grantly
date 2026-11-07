# Feature audit — 7 November 2026

| Core feature | Implementation                                                                                                                                               | Verification/dependencies                                                                                                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discovery    | Five eligibility-checked records, advanced filters, search/sort, recommendations, bookmarks/comparison and official links; refreshable NSP listing inventory | UI distinguishes listing presence from verified eligibility and excludes inventory-only schemes from match rankings. `npm run refresh:nsp` updates the official listing snapshot and source-document links; state-only portals remain out of scope. |
| Eligibility  | Four outcomes, objective rules, missing/failed answers, draft save/cancel and document readiness                                                             | Boundary, missing-data, percentile, disability and course-level tests passed. Numeric fields and income shortcuts tested. Preliminary guidance only.                                                                                                |
| AI assistant | Secure Node Gemini gateway, bounded routing, server facts, citations, validation, auth, rate limits and error states                                         | Mock/API tests passed. Live Gemini Interactions API tested with the configured `gemini-3.1-flash-lite` model; successful answer and official source links confirmed.                                                                                |
| Tracker      | Statuses, notes, checklist, local persistence, CSV and explicit cloud sync                                                                                   | Earlier local workflows checked. Supabase schema/RLS/RPC supplied but not executed against a live project.                                                                                                                                          |
| Deadlines    | Timeline/calendar, unknown/conflicting/expired handling, preferences and in-app reminders                                                                    | Indian-calendar tests and browser calendar check pass. No email/push delivery.                                                                                                                                                                      |
| Dashboard    | Matches/saves/applications, verified dates, preparation ranking and missing tasks                                                                            | Existing dashboard/preparation checked earlier. Cloud-dependent behavior needs configuration.                                                                                                                                                       |

## Tests

Latest full run: 28 tests passed, including eligibility boundaries, unknown data, date arithmetic and ordering, storage validation, legacy IDs, CSV, preparation ranking, API validation, origin rejection, bounded Gemini routing, provider capacity errors, rate limits, and NSP listing parsing/link validation. TypeScript/Vite production build and Prettier check passed. No separate semantic ESLint configuration is supplied.

## Browser scope

Earlier iterations verified search/save, comparison, application/document persistence, profile updates, notes and keyboard-dialog focus. Latest checks confirmed the Assistant response and source links, profile course-level options and numeric inputs, deadline calendar, and no horizontal overflow at 320, 390, 700, 768 and 1440 CSS pixels. Supabase setup, live auth/cloud sync and cross-account isolation remain **unverified** without a configured project.

## Credentials and limits

- Supabase requires URL, publishable key, migration and redirects. Live auth, confirmation, cross-account RLS, RPC execution and multi-device sync remain untested. No service-role key is used.
- Gemini requires private server key/model. Production requires signed-in Supabase auth. Mock tests are not live-service verification.
- Resend is intentionally deferred. Reminders are in-app only.
- Five records are a starting catalog; historical guideline editions and current-cycle uncertainty are disclosed.
- The NSP listing inventory is refreshed from official NSP and includes 31 names in the 7 November 2026 snapshot, not an exhaustive list of NSP or Indian government schemes. Five records are fully wired into eligibility matching; inventory-only names are not ranked or presented as matches.
- myScheme is linked as an official discovery portal for central and State/UT government schemes; its results are not automatically imported into Grantly.
- The NSP refresh script was run against the public listing; 31 scheme names and their NSP-displayed application-window text/source links are recorded. It does not interpret scope, verify scheme rules, or add records to the matcher.
- CSSS fresh deadline is unconfirmed; official renewal dates conflict.
- Eligibility does not establish document authenticity, ranking or final approval. Preparation suggestions are not an exhaustive official upload list.
- Local storage may be cleared. Cloud sync is explicit. Reminder settings are per-device.
- No document upload, automated application submission, push/email delivery or background ingestion.
- AI is bounded source navigation. Multi-instance deployments require a shared rate-limit store.
- Node hosting is needed for the API; no deployment performed.
- Old fictional records are excluded, with old browser data preserved under its previous namespace.

## Export verification

The complete ZIP was extracted into a separate folder and dependencies installed. Its TypeScript/Vite production build passed. In the fresh-copy test run, 16 tests passed; three HTTP API tests could not connect to loopback due to environment EACCES permissions. This does not replace live Gemini/Supabase verification. The earlier full run passed all 19 tests.
