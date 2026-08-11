# Deployment Guide — ESPMI Sales Portal

This application is deployed on **Cloudflare Pages** with a Git-connected build pipeline.

## Build Configuration

| Setting          | Value              |
|------------------|--------------------|
| Build command    | `npm run build`    |
| Output directory | `dist`             |
| Node.js version  | 18.x or latest LTS |

The build script runs TypeScript type checking (`vue-tsc -b`) followed by `vite build`.

## Environment Variables

The following environment variables **must** be configured in Cloudflare Pages project settings under **Settings > Environment variables**:

| Variable                 | Description                        | Example                                        |
|--------------------------|------------------------------------|------------------------------------------------|
| `VITE_SUPABASE_URL`     | Supabase project URL               | `https://yourproject.supabase.co`              |
| `VITE_SUPABASE_ANON_KEY`| Supabase anonymous/public API key  | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`     |

### Setting environment variables in Cloudflare Pages

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** > your project
3. Click **Settings** > **Environment variables**
4. Add each variable for both **Production** and **Preview** environments
5. Click **Save**

Variables prefixed with `VITE_` are injected at build time by Vite via `import.meta.env`. They are embedded in the built JavaScript bundle, so only use public/anonymous keys here — never service role keys or secrets.

## Security: No Credentials in Source

- Credentials are read exclusively from environment variables at build time.
- The `.env` file (for local development) is listed in `.gitignore` and must never be committed.
- The `.env.example` file contains placeholder values only.
- After building, you can verify no real credentials appear in the output:

```bash
# Search dist/ for credential patterns (should return nothing)
grep -r "supabase.co" dist/ || echo "No credentials found in dist"
grep -r "eyJ" dist/ || echo "No JWT-like strings found in dist"
```

## SPA Routing

The `public/_redirects` file contains a catch-all rule for Cloudflare Pages:

```
/* /index.html 200
```

This ensures all routes are handled by Vue Router's history mode without 404s on page refresh.

## Deployment Flow

1. Push code to the connected Git repository (e.g., `main` branch)
2. Cloudflare Pages detects the push and triggers a build
3. The build runs `npm run build`, producing the `dist/` directory
4. Cloudflare deploys the built assets to its global CDN atomically
5. The previous deployment is retained as a rollback target

Zero-downtime is maintained because Cloudflare Pages performs atomic deploys — the new version replaces the old instantly at the edge.

## Local Development

```bash
# Copy the example env file
cp .env.example .env

# Fill in your Supabase credentials in .env
# Then start the dev server
npm run dev
```

## Performance Target

The application should achieve a Lighthouse performance score of at least **75** when measured in navigation mode on desktop with simulated throttling disabled against the authenticated Dashboard view.

To test locally:
1. Run `npm run build && npm run preview`
2. Open Chrome DevTools > Lighthouse tab
3. Select "Navigation" mode, "Desktop" device
4. Run the audit on the Dashboard view (after logging in)
