# Deploy Grantly on Render

This Blueprint deploys the Node API and Vite frontend as one web service. It
expects a Git repository that you control; this workspace is not currently
connected to one.

1. Put the project in a private GitHub repository and push the code.
2. In Render, choose **New → Blueprint**, connect that repository, and approve
   the `render.yaml` service configuration.
3. Before deploying, enter the four environment variables requested by the
   Blueprint. Use the Supabase project URL and publishable key, plus the
   server-only Gemini API key and model. Never enter a Supabase secret/service
   role key or expose the Gemini key as a `VITE_` variable.
4. Wait for the Render health check at `/api/config` to pass and open the
   generated `https://…onrender.com` address.
5. In Supabase Authentication URL Configuration, set the Site URL to that
   exact Render URL and add it as an allowed redirect URL. Add local
   `http://127.0.0.1:5173` too if local sign-in is still needed.
6. Create/sign in to a Grantly account on the deployed site. Test sign-out,
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
