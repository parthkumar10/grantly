# API configuration

## Supabase

The Account screen works as a local guest when Supabase is not configured. Guest data is stored in this browser only; the Gemini API key does not enable account sign-in.

To enable accounts, create a Supabase project. Run `supabase/migrations/001_grantly.sql` once in its SQL editor against a fresh schema. Optionally run `supabase/seed.sql`; the application currently uses bundled JSON, not a claimed live database feed.

Enable email/password auth and configure email confirmation. Set Auth Site URL and redirects to `http://127.0.0.1:5173` locally, and your deployed HTTPS origin in production. Copy the URL and **publishable** key into `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never use a service-role key. Restart/rebuild, create an account, confirm if required and sign in. The public project URL and publishable key are required from the project owner; the code cannot create a Supabase project or turn the guest workspace into an authenticated account by itself.

RLS is enabled on all tables. Owner policies use `auth.uid()`. Client catalog access is read-only. Save/load functions are security-invoker and cannot bypass RLS. Saves are atomic and revision-checked. Use Account to load before editing and save when ready. Test two accounts for isolation in your configured environment.

Live signup/login, email confirmation, RPC execution, RLS isolation and cross-device persistence were not verified without a configured project. No Supabase secret key is required.

## Gemini

Create a private API key in Google AI Studio. Set `GEMINI_API_KEY` and `GEMINI_MODEL` to a model ID available to that key. The local example uses `gemini-3.1-flash-lite`; if Google reports that a model is busy or unavailable, choose another model shown for your API key. Restart the server. Never prefix these variables with `VITE_`.

`APP_ORIGIN` must equal the exact frontend origin. `AI_REQUIRE_AUTH=true` enforces sign-in locally too. Production always validates Supabase authentication regardless of that flag.

Only the question and limited catalog context go to Google, not stored profile details, notes or documents. Requests use the Gemini Interactions API with `store: false`; avoid sensitive data in questions. Gemini returns record IDs/topics; the server rejects unknown IDs/topics and renders facts from the catalog. It is a bounded scholarship-navigation assistant, not an unrestricted adviser.

Limits: 1,500 characters/question; 12 KB body; 10 requests/minute per process/IP; 20-second upstream timeout. Missing config, invalid input, quotas, timeouts and provider failures have explicit states. Mock tests do not establish live connectivity.

## Variables

| Variable                      | Purpose                       | Visibility    |
| ----------------------------- | ----------------------------- | ------------- |
| VITE_SUPABASE_URL             | Project URL                   | Public        |
| VITE_SUPABASE_PUBLISHABLE_KEY | Auth/data access under RLS    | Public        |
| GEMINI_API_KEY                | Provider authorization        | Server only   |
| GEMINI_MODEL                  | Available model ID            | Server config |
| APP_ORIGIN                    | Exact allowed frontend origin | Server config |
| AI_REQUIRE_AUTH               | Local sign-in enforcement     | Server config |
| PORT                          | Backend/production port       | Server config |

Set public Supabase variables at build and runtime; private keys at runtime only.

## Resend / reminders

No Resend key is needed. Email/push delivery and scheduling are intentionally deferred. In-app reminders work on the Deadlines screen while the app is open, refresh once per minute, and cover verified upcoming dates for watched active opportunities. No email delivery is claimed. Future email delivery needs opt-in, verified sender, authenticated scheduling, durable deduplication, delivery events and unsubscribe controls.
