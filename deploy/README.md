# Zabay staging preparation (inactive)

These files prepare the existing Vercel → Render → Neon architecture; **nothing
in this directory is activated by a Git push**. The live root `vercel.json`
and `frontend/vercel.json` are intentionally unchanged. Do not sync the
Render Blueprint or enable production Vercel routing without maintainer approval.
PR #8's security changes are merged into `main`, but live deployment still
requires separate security review and maintainer approval.

## 1. Neon: use schema-only staging

Project: `small-river-09012684` (`zabay-db`); production branch:
`production`. The connector's ordinary create-branch operation copies
production rows, including user data. **Do not use a normal data-copy branch.**
An authorized Neon CLI with schema-only support is required:

```sh
neon branches create --project-id small-river-09012684 \
  --parent production --name staging-schema-only --schema-only
```

Schema-only branching is subject to current Neon support/eligibility. If
unavailable, stop and arrange an approved empty staging database; do **not**
copy or sanitize a production-data branch as a shortcut.

Before use, inspect the staging schema (including `btree_gist`, exclusion
constraints and triggers) and verify there are **zero inherited production
users and operational records**. A schema-only branch already has its parent's
schema; do not blindly re-run `db/schema.sql`, which includes seed inserts.
Apply only reviewed schema differences on staging if needed. Use synthetic
fixtures only, and never point tests at production. No migrations or seeds run
on backend startup.

## 2. Render: prepared, not provisioned

Use the custom Blueprint path `deploy/render.staging.yaml` in the
`WhiteTree` workspace **only after staging ingress and security are approved**.
It targets the security-patched `main` branch rather than this PR's
`chore/render-neon-staging` branch. Confirm the exact reviewed `main` commit
before initial Blueprint sync. Disabling automatic deployment only prevents
subsequent commit-triggered deploys; it does not prevent the initial public
deployment when the Blueprint is first synced.

It specifies one Singapore-region Node.js web service, built from
`backend/` with `npm ci && npm run build` and started with `npm start`.
The backend listens on Render's `PORT`; `/api/health` checks HTTP liveness
and `/api/ready` checks PostgreSQL connectivity. The connection pool and
production TLS certificate verification remain unchanged.

**The first Blueprint sync creates and deploys a publicly accessible web
service even with `autoDeployTrigger: "off"`.** Render's free public service
is not a secure isolation boundary. Do not sync this file simply to test it.

Supply the following values in Render, never in Git or frontend variables:

| Variable | Requirement |
| --- | --- |
| `DATABASE_URL` | Neon **schema-only staging** database URL only (secret) |
| `OPERATOR_USERNAME` | Staging-only operator account (secret) |
| `OPERATOR_PASSWORD` | Staging-only random secret, at least 16 characters |
| `CLIENT_URL` | Exact approved Vercel preview frontend origin; no trailing slash |
| `FIREBASE_PROJECT_ID` | Firebase project ID matching the preview frontend's `VITE_FIREBASE_PROJECT_ID` |

`NODE_ENV=production` and `NODE_VERSION=22` are set in the Blueprint.
Render supplies `PORT`. Do not set `NODE_TLS_REJECT_UNAUTHORIZED=0` or
`PGSSLMODE=disable`. The process-local sessions and rate limits require a
single instance unless a separate shared-state design is approved.

## 3. Vercel: preview configuration only

`vercel.preview.example.json` is **not deployable as-is**: its
`.example.invalid` destination is deliberately nonfunctional. Ryel, as the
Vercel project owner, must first provision an approved, secured Render staging
origin, substitute its real HTTPS host, and apply the API-first rewrite
**only in a preview/staging deployment**, not to the live production config.
Keep the SPA fallback after `/api/:path*`. For a Vercel project rooted at
`frontend/`, transpose just the two `rewrites` into that root's config.
Do not replace frontend production build settings.

The frontend uses relative `/api/*` requests. The proxy must preserve
methods, bodies, `Set-Cookie` and `X-CSRF-Token`; the backend checks exact
request origins against `CLIENT_URL`, and issues Secure, HttpOnly,
SameSite=Strict cookies on `/api`. Verify this behavior against an actual
preview before production activation. Protecting a Vercel preview **does not**
protect an independently public Render hostname.

## 4. Release verification gate

After authorized staging activation, verify JSON from `/api/health`, JSON
readiness from `/api/ready`, one read-only database-backed API response,
rejection of unauthenticated writes, and a real Vercel preview request
through `/api/*` (not React's `index.html`). Confirm no production data
connections, no production URL changes, and no leaked secrets.

Current state: configuration only; no Neon staging branch, Render service,
Vercel preview, or live connectivity is claimed.
