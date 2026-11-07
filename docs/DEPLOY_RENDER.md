# Deploy Grantly on Render

This Blueprint deploys the Node API and Vite frontend as one web service. The
project is in the private GitHub repository
`https://github.com/parthkumar10/grantly`, on the `main` branch.

1. In Render, choose **New → Blueprint**, connect
   `parthkumar10/grantly`, and approve the `render.yaml` service configuration.
2. Before deploying, enter the Supabase project URL and publishable key. Add
   the server-only Gemini API key to enable the optional assistant; the
   Blueprint defaults `GEMINI_MODEL` to `gemini-3.1-flash-lite`. Never enter a
   Supabase secret/service-role key or expose the Gemini key as a `VITE_`
   variable.
3. Wait for the Render health check at `/api/config` to pass and open the
   generated `https://…onrender.com` address.
4. In Supabase Authentication URL Configuration, set the Site URL to that
   exact Render URL and add it as an allowed redirect URL. Add local
   `http://127.0.0.1:5173` too if local sign-in is still needed.
5. Create/sign in to a Grantly account on the deployed site. Test sign-out,
   sign-in, save, and load. A local account session does not automatically
   transfer to the hosted domain.

The server uses Render's `RENDER_EXTERNAL_URL` as its allowed-origin fallback;
set `APP_ORIGIN` only if using a custom domain or another explicitly configured
origin. After attaching a custom domain, set `APP_ORIGIN` to that exact HTTPS
origin and add it to Supabase's allowed redirects.

The free service may sleep when idle and cold-start on the next visit. This is
a deployment starter, not a production availability guarantee. Confirm current
Render plan limits and Supabase project settings in their dashboards before
launching publicly.
