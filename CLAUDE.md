# Vitrin — CLAUDE.md

Vitrin (`vitrin.work`) turns a freelancer's links into a portfolio page at
`vitrin.work/{username}` in a couple of minutes. Each work is a "window":
visitors expand it and click through the live site, Figma prototype, video
or repo right on the page.

The full product spec (in Russian) is the source of truth for scope and is
reproduced in `docs/SPEC.ru.md`. This file is the *engineering* companion:
stack, conventions, and architecture decisions made while building it, kept
up to date as work proceeds. Read both before making structural changes.

## Current status (update this section as stages progress)

Stage 1 (MVP) is in progress. Built so far:
- Project scaffold: Next.js 16 (App Router, Turbopack), TypeScript strict, Tailwind v4.
- Hand-rolled shadcn/ui-style primitives in `src/components/ui/*` (the
  `shadcn` CLI's registry host is not reachable from this environment's
  network policy — components were written directly against Radix
  primitives instead of generated).
- Design tokens + light/dark/system theme (`src/app/globals.css`, `next-themes`).
- Pro accent-color palette with pre-checked contrast (`src/lib/accent-colors.ts`).
- Core business logic: plan limits, specializations, reserved usernames,
  URL normalization, source-type detection, SSRF guard, iframe-allowed
  check, Zod validation schemas (`src/lib/**`).
- Supabase schema for every stage-1 table + RLS policies + storage buckets
  (`supabase/migrations/*.sql`). No live Supabase project is connected yet
  — see "What the owner still needs to provide" below.
- i18n scaffold for all 10 locales with full key parity (`messages/*.json`,
  `src/i18n/*`) — see "Routing architecture" for how locale detection works
  without next-intl's own routing middleware.

Not yet built (do these next, in this order, per spec section 14): auth
pages wired to Supabase Auth, onboarding flow, ingest pipeline job
processor, public profile page + viewer, dashboard, hire form + email,
landing + legal pages, admin/moderation, SEO.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack by default), TypeScript
  strict, React Server Components by default.
  - **This is Next.js 16, not 14/15.** Breaking changes from your training
    data: `middleware.ts` is renamed to `src/proxy.ts` exporting `proxy()`
    (not `middleware()`); Turbopack is the default bundler; `params` /
    `searchParams` / `cookies()` / `headers()` are all `Promise`-based.
    When in doubt, read `node_modules/next/dist/docs/` before writing code
    that touches routing or the request APIs.
- **UI:** Tailwind CSS v4 + hand-written shadcn/ui-style primitives
  (`src/components/ui/*`, built on Radix UI + `class-variance-authority` +
  `tailwind-merge`), icons `lucide-react`, animation `framer-motion` (used
  sparingly), drag-and-drop `@dnd-kit`.
- **DB / Auth / Storage:** Supabase (Postgres, Supabase Auth, Supabase
  Storage) via `@supabase/ssr`. RLS is enabled on every table — see
  `supabase/migrations/*.sql`. `src/lib/supabase/database.types.ts` is a
  **hand-maintained** mirror of the migrations; regenerate it with
  `supabase gen types typescript` once a live project exists and keep it in
  sync after every migration until then.
- **Validation:** Zod, shared between forms and API routes
  (`src/lib/validation/schemas.ts`).
- **Forms:** `react-hook-form` + `@hookform/resolvers/zod`.
- **i18n:** `next-intl`, used for message lookup/formatting only — **not**
  its routing/middleware helpers. See "Routing architecture" below for why.
- **Metadata & screenshots:** behind a `ScreenshotProvider` interface
  (`src/lib/services/screenshot/*`, not yet implemented) so Microlink can be
  swapped for ScreenshotOne or a self-hosted Playwright worker later.
- **Email:** Resend + React Email.
- **Payments:** Paddle Billing (Paddle.js overlay + webhooks) — stage 2.
- **Rate limiting:** Upstash Redis + `@upstash/ratelimit`.
- **Captcha:** Cloudflare Turnstile.
- **Link safety:** Google Web Risk API.
- **Content moderation:** OpenAI Moderation API (`omni-moderation-latest`).
- **Background jobs:** a `jobs` table processed by `/api/cron/process-jobs`
  (Vercel Cron, `claim_jobs()` Postgres function using `FOR UPDATE SKIP LOCKED`).
- **Tests:** Vitest for unit tests (business logic in `src/lib/**` is the
  priority — it's pure and cheap to test), Playwright for e2e later.
- **Lint/format:** ESLint (flat config) + Prettier + `prettier-plugin-tailwindcss`.

Every external service sits behind its own interface under
`src/lib/services/*` so it can be swapped without touching business logic.

## Routing architecture (read this before adding routes)

The spec requires two incompatible-looking URL shapes to coexist:

- Public profiles at the **root**, no locale prefix: `/{username}`, `/{username}/w/{slug}`.
- Marketing/catalog pages **locale-prefixed**: `/{locale}/pricing`, `/{locale}/catalog`, etc.

Next.js's App Router refuses two *different* dynamic segment names at the
same file-tree level (`app/[locale]/` next to `app/[username]/` is a build
error). Since every locale code is already a reserved username (see
`src/lib/reserved-usernames.ts`), there's no real ambiguity — so the app
uses a **single shared dynamic segment**, `app/[handle]/`, and disambiguates
at request time:

- `src/i18n/locales.ts` — `isLocale(handle)` checks the handle against the
  10 known locale codes.
- Marketing routes live under `app/[handle]/pricing/page.tsx`,
  `app/[handle]/catalog/page.tsx`, etc. — every one of these pages must call
  `notFound()` at the top if `!isLocale(handle)`.
- `app/[handle]/page.tsx` and `app/[handle]/w/[workSlug]/page.tsx` render
  the marketing landing page when `isLocale(handle)`, otherwise look up a
  profile by that username and 404 if none exists.
- `dashboard/`, `admin/`, `onboarding/`, `api/` are ordinary static
  segments at the app root, so they take precedence over `[handle]` and
  need no special-casing.

**Locale resolution does not use next-intl's routing middleware** — it
can't express this URL shape. Instead `src/proxy.ts` (the Next 16 name for
middleware) resolves the locale for every request — from the URL handle
when it's a marketing route, otherwise from the `NEXT_LOCALE` cookie or
`Accept-Language` — and forwards it via the `x-vitrin-locale` request
header. `src/i18n/request.ts` (next-intl's `getRequestConfig`) just reads
that header back. This means the interface language on a public profile
page follows the *visitor's* cookie/browser language, per spec section 3,
completely independent of the page owner's content language.

`src/proxy.ts` also runs the Supabase `auth.getUser()` session refresh on
every request (the standard `@supabase/ssr` middleware pattern).

## Conventions

- No hardcoded UI strings — everything goes through `next-intl` message
  keys in `messages/{locale}.json`. All 10 locale files must have identical
  key sets; this is checked by `npm run check:i18n` (see `scripts/`).
  Non-English translations were machine-drafted and need a native-speaker
  pass before launch, especially the landing page, pricing and legal pages
  (per spec section 10).
- Plan limits are read from `src/lib/plans.ts` only — never duplicate a
  limit number in a component or API route.
- Every external service call (screenshots, moderation, Web Risk, Paddle,
  email) goes through `src/lib/services/*`, never called directly from a
  route handler or component.
- Server Actions / API routes re-validate everything with the same Zod
  schemas the forms use (`src/lib/validation/schemas.ts`) — never trust
  client-side validation alone.
- RLS is the last line of defense, not the only one: privileged columns
  (`profiles.plan/role/status`) are also protected by a Postgres trigger
  (see `0002_profiles.sql`) so an application bug can't leak past a policy.
- Ingest network calls **must** go through `src/lib/ingest/ssrf-guard.ts`'s
  `safeIngestFetch` / `safeIngestFetchFollowingRedirects` — never call
  `fetch()` directly on a user-submitted URL.
- Commit after each meaningful unit of work (this mirrors spec section 14's
  "commit after every point, run tests after every stage").

## What the owner still needs to provide

Nothing in this repo can go live without accounts only the owner can
create — see spec section 16. In particular, **no Supabase project is
connected yet**, so nothing here has been run against a live database;
migrations are written and ready to apply with `supabase db push` (or
pasted into the SQL editor) the moment a project exists. Also needed:
Vercel project, Google Cloud OAuth + Web Risk credentials, OpenAI API key,
Resend + verified sending domain, Cloudflare Turnstile keys, Upstash
Redis, Microlink API key, Paddle sandbox → live account, and the domain
`vitrin.work` itself with DNS access.

## Commands

```bash
npm run dev       # Turbopack dev server
npm run build     # production build
npm run lint      # ESLint
npm run test      # Vitest
npm run check:i18n  # verifies all locale files have identical key sets
```
