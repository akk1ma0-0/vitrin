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

Stage 1 (MVP) is functionally complete per spec section 14's step list —
every stage-1 screen and API route exists and builds/lints/tests clean —
but **nothing has run against a live Supabase project or any of the
external services yet** (see "What the owner still needs to provide"). Treat
this as "ready to wire up and test end-to-end," not "verified working."

Built:
- Project scaffold: Next.js 16 (App Router, Turbopack), TypeScript strict,
  Tailwind v4, hand-rolled shadcn/ui-style primitives on Radix UI in
  `src/components/ui/*` (the `shadcn` CLI's registry host isn't reachable
  from this environment's network policy).
- Design tokens + light/dark/system theme, Pro accent-color palette with
  pre-checked contrast (`src/app/globals.css`, `src/lib/accent-colors.ts`).
- Core business logic with unit tests: plan limits, reserved usernames, URL
  normalization, source-type detection, SSRF guard, iframe-allowed check,
  slug generation, Zod validation schemas (`src/lib/**`, `*.test.ts`).
- Supabase schema for every stage-1 table + RLS policies + storage buckets +
  auth triggers (`supabase/migrations/*.sql`).
- i18n for all 10 locales with full key parity, checked by
  `npm run check:i18n` — see "Routing architecture" below for how locale
  detection works without next-intl's own routing middleware.
- Auth: Google OAuth, email+password, magic link, login-by-username
  (server-side email resolution so the client never sees it), Turnstile.
- Onboarding wizard: username availability, profile basics, bulk link
  paste with live ingest-status polling, contacts, done screen.
- Ingest pipeline: URL normalize → Web Risk safety check → source-type
  detection → per-type metadata/embed (Figma, GitHub+README, YouTube/
  Vimeo/Loom, Google Docs/Slides, website iframe-vs-screenshot via
  Microlink) → OpenAI moderation gate → `jobs` queue processed by
  `/api/cron/process-jobs` with retry backoff. When a site can't be
  iframed (`render_mode = "screenshot"`), one capture is taken per
  `DEVICE_WIDTHS` entry (`src/lib/device-widths.ts`, the shared source of
  truth also used by `DeviceSwitcher`) and stored as `meta.screenshots`,
  so the viewer's device switcher shows the site's real responsive layout
  instead of resizing one fixed-width image. The card/og:image cover is
  only trusted for non-screenshot render modes — for screenshot mode it's
  always our own homepage capture, since a page's `og:image` can be an
  unrelated asset (a payment logo, a generic share card) that makes a
  worse thumbnail than the real page.
- Public profile page, work viewer with adapters per render mode (live
  iframe with device-width scaling, screenshot scroller, video/generic
  embed, GitHub card, image gallery, PDF), hire form (rate-limited,
  moderated, emailed via Resend), report flow, pricing, legal pages
  (Terms/Privacy/Refund).
- Dashboard: overview (stats, checklist, recent requests), works CRUD with
  drag-and-drop reordering, profile editor, inbox, full stats (see below),
  settings (theme, Pro accent color, language, GDPR export/delete),
  billing (plan display; no Paddle checkout yet — stage 2).
- Full stats (`dashboard/stats/page.tsx`, `getFullStats()` in
  `src/lib/dashboard.ts`, spec section 8's "full statistics" Pro row): a
  30-day daily-views bar chart, top works, traffic sources, countries, and
  a device split — aggregated in JS from raw `events` rows (fine at a
  freelancer portfolio's event volume; no `GROUP BY` RPC needed). The
  7-day/total-views tiles above it stay visible on every plan (unchanged);
  only these five breakdowns are Pro-gated, each via `StatSection`
  (`src/components/dashboard/stat-section.tsx`): Free sees the section's
  name dimmed and a centered "Pro" badge, never the numbers — not even
  blurred. `getCountry()` (`src/lib/analytics.ts`, reads Vercel's
  `x-vercel-ip-country` edge header) started actually populating
  `events.country`; that column existed since `0006_events.sql` but
  nothing wrote to it before now, so older rows have `country = null`
  ("Unknown" in the breakdown).
- Admin moderation queue (flagged works + open reports, with
  approve/hide/delete/ban actions logged to `moderation_log`).
- SEO: sitemap.xml, robots.txt, dynamic OG images, JSON-LD on profiles.
- Catalog (built ahead of its stage-2 slot) **is now the home page**
  (`/{locale}`, see "Routing architecture" below) rather than its own
  route — the owner decided the directory should be what visitors land on
  instead of a conversion-focused landing page. `/{locale}/catalog` is
  kept as a redirect to `/{locale}` (with its query string) so old
  links/bookmarks don't 404. Features: search (plain ILIKE on
  username/display_name/headline, not yet the spec's full-text +
  pg_trgm), filters (specialization, open-to-work), sort (relevance =
  Pro-first then newest, or newest), pagination, cards with up to 3 work
  covers (`getCatalogCovers()` in `src/lib/profiles.ts`). Reads straight
  off the existing `catalog_profiles` view, so the spec 8.2 visibility
  gate (active, verified, avatar + headline set, >=3 ready works) already
  applies — a profile with fewer than 3 works simply won't show up yet,
  that's not a bug. Cards open with `target="_blank"` so browsing the
  directory doesn't lose the filtered list. Rate display is wired up but
  will stay empty for every profile today — there's no profile-editor UI
  yet for `rate_min`/`rate_max`/`rate_unit`. Not yet built: Postgres
  full-text/trigram search, "popular" sort (needs a 30-day view aggregate
  across profiles, more than a plain `.order()` can do),
  per-specialization SEO pages (`/catalog/{specialization}`). The old
  multi-section marketing landing page (steps/features/CTA) is gone —
  `CatalogHero` (`src/components/marketing/catalog-hero.tsx`) is the
  entire pitch now: title, subtitle, one "create my page" CTA, shown only
  to signed-out visitors (`isSignedIn()` in `src/lib/auth-redirect.ts`);
  a signed-in visitor sees a plain "Freelancers" heading instead, since
  the "create my page" pitch doesn't apply to them.

Deliberately deferred to stage 2 per the spec's own plan: Paddle billing,
Facebook/Telegram login, notion/telegram_post/behance/dribbble/
upload_video/upload_pdf adapters, link-recheck and screenshot-refresh
cron jobs, Upstash-backed rate limiting on every public endpoint (the
hire/report routes already call the same rate-limit helper, which
no-ops until `UPSTASH_REDIS_REST_URL` is set).

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
  (`src/lib/services/screenshot/*`), with a Microlink implementation as the
  default so it can be swapped for ScreenshotOne or a self-hosted
  Playwright worker later.
- **Email:** Resend + React Email.
- **Payments:** Paddle Billing (Paddle.js overlay + webhooks) — stage 2.
- **Rate limiting:** Upstash Redis + `@upstash/ratelimit`.
- **Captcha:** Cloudflare Turnstile.
- **Link safety:** Google Web Risk API.
- **Content moderation:** OpenAI Moderation API (`omni-moderation-latest`).
- **Background jobs:** a `jobs` table processed by `/api/cron/process-jobs`
  (Vercel Cron, `claim_jobs()` Postgres function using `FOR UPDATE SKIP LOCKED`).
  `vercel.json`'s cron is daily (`0 0 * * *`), not per-minute as spec section 9
  asks for, because Vercel's Hobby (free) plan rejects any cron schedule that
  would fire more than once a day — deploys fail outright otherwise. This is
  a soft degradation, not a broken feature: `/api/works` already fires the
  processor immediately after creating a work (fire-and-forget), so new
  links still ingest right away; the cron is only the retry/catch-up safety
  net for jobs that failed and are backing off. Tighten this back to
  per-minute once the project is on a paid Vercel plan.
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
  the catalog (the home page, see "Current status" above) when
  `isLocale(handle)`, otherwise look up a profile by that username and
  404 if none exists.
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
- Function EXECUTE grants are deny-by-default (`0012_grants.sql` revokes
  the PUBLIC pseudo-role's auto-granted EXECUTE on every function in
  `public`, then grants back only `service_role` plus the one function
  anon/authenticated actually need, `is_admin()`). Postgres auto-grants
  EXECUTE to PUBLIC on every new function, which anon/authenticated
  inherit as members of PUBLIC — so a new `security definer` helper is
  reachable at `/rest/v1/rpc/<name>` by anyone unless you explicitly revoke
  it. Any new function needs a deliberate grant decision, not silence.
- Any view over an RLS-protected table needs `with (security_invoker =
  true)` (see `catalog_profiles` in `0003_works.sql`) — without it,
  Postgres evaluates the view as its owner, silently bypassing the
  underlying tables' RLS for whoever queries the view.
- Ingest network calls **must** go through `src/lib/ingest/ssrf-guard.ts`'s
  `safeIngestFetch` / `safeIngestFetchFollowingRedirects` — never call
  `fetch()` directly on a user-submitted URL.
- The public profile page (`PublicProfileView`) has no pricing/catalog nav,
  so it still mostly reads as the freelancer's own site rather than an app
  screen (spec section 5.4). It does have a persistent Vitrin logo (top bar,
  links to `/`) and a "Made with Vitrin" footer link on **every** plan — the
  owner explicitly decided not to implement the spec's section 8 "branding
  removed on Pro" row; `profiles.plan` is no longer read when deciding
  whether to show either. `isOwner` (`isViewingOwnProfile()` in
  `src/lib/profiles.ts`) additionally shows a "go to dashboard" bar when the
  signed-in viewer owns the profile being viewed.
- `redirectIfAuthenticated()` (`src/lib/auth-redirect.ts`) sends an
  already-signed-in visitor straight to `/dashboard` (or `/onboarding` if
  they never finished it) instead of showing them `/login` or `/signup`,
  which they have no use for. **Not** called from the bare locale root
  (`/{locale}`) any more — now that the root shows the catalog instead of
  a conversion-focused landing page, it's genuinely useful content for a
  signed-in visitor too (browsing other freelancers), so they see it like
  anyone else; `isSignedIn()` in the same file just toggles whether
  `CatalogHero`'s "create my page" pitch shows above it. Logo links
  everywhere point at `/` → `/{locale}`, i.e. the catalog, for both signed
  in and signed out visitors.
- Commit after each meaningful unit of work (this mirrors spec section 14's
  "commit after every point, run tests after every stage").
- There is no self-service way to grant `profiles.role = 'admin'`, and that
  is deliberate: `protect_privileged_profile_columns()` (`0002_profiles.sql`)
  reverts any change to `role` unless `auth.role() = 'service_role'`, which
  only a direct service-role connection satisfies — not even a Postgres
  superuser session reaching the table through a normal connection, since
  that trigger check reads the PostgREST JWT claim, not the DB role. To
  promote someone: run `update profiles set role = 'admin' where id = ...`
  with the trigger disabled for that one statement (`alter table profiles
  disable/enable trigger profiles_protect_privileged_columns`), or via any
  other genuinely service-role connection. `/admin` itself just checks
  `role = 'admin'` in `admin/layout.tsx` and redirects to `/dashboard`
  otherwise — there's no link to it anywhere in the UI by design.
- Theme + language controls (`ThemeLocaleControls`,
  `src/components/theme-locale-controls.tsx`) are on every page now, not
  just the `[handle]` marketing tree (which gets them via `SiteHeader`):
  dashboard, admin, and onboarding all render it directly. It wraps
  `ThemeToggle` with `CookieLocaleSwitcher`
  (`src/components/cookie-locale-switcher.tsx`), **not** the marketing
  `LocaleSwitcher` — that one rewrites the URL's first path segment, which
  only makes sense where that segment *is* the locale (`/{locale}/...`).
  Everywhere else (no locale in the URL at all, or — on a profile page —
  that segment is the username) it instead sets the `NEXT_LOCALE` cookie
  `src/proxy.ts` already reads and calls `router.refresh()`.
- The public profile page is the one exception to `ThemeLocaleControls`:
  it needs `profiles.theme` (the owner's choice, spec section 3) as the
  *default* appearance, with a per-visitor opt-out — a plain global toggle
  doesn't fit that. `PublicProfileView` resolves both an owner theme and a
  visitor theme (`useTheme()`'s `resolvedTheme`, i.e. their normal
  site-wide preference) and picks one based on local `useOwnerTheme`
  state (default `true`), applying it via `data-theme` on the page's own
  root div rather than the `<html>` element `next-themes` controls
  globally. This works because `globals.css`'s dark-mode variable block is
  `[data-theme="dark"]`, not `:root[data-theme="dark"]` — custom
  properties inherit down the DOM, so any element carrying the attribute
  re-themes its own subtree independent of `<html>`'s. The three dialogs
  that live on this page (`WorkViewer`, `HireForm`, `ReportDialog`) take a
  `portalContainer` prop for the same reason: Radix's `Dialog.Portal`
  defaults to `document.body`, which sits outside that themed div, so
  without pointing it at the div explicitly those modals would silently
  fall back to the visitor's own site-wide theme instead of whichever one
  is currently active on the page. `DialogContent`
  (`src/components/ui/dialog.tsx`) now accepts an optional `container`
  prop for exactly this; every other dialog in the app omits it and keeps
  portaling to `document.body` as before. `profile.theme === "system"`
  resolves against the *visitor's* `prefers-color-scheme` (the owner's own
  device state isn't knowable at render time) via `useSyncExternalStore`
  — not a `useEffect` + `setState`, which the React Compiler ESLint rule
  (`react-hooks/set-state-in-effect`) flags as an anti-pattern, and which
  `useSyncExternalStore` is the actual correct tool for anyway (subscribing
  to an external, changing-over-time browser API).
- If `react-hooks/immutability` (the React Compiler ESLint rule) flags a
  global mutation like `document.cookie = ...` inside a component with
  "Modifying a variable defined outside a component or hook is not
  allowed" — even though it's a plain browser global, not real component
  state — move the assignment into a plain function declared at module
  scope (outside the component) and call that instead. The compiler's
  static analysis traces mutations within component/hook bodies but
  doesn't trace into an ordinary external function call, so this reliably
  clears the false positive (see `setLocaleCookie()` in
  `cookie-locale-switcher.tsx`).

## What the owner still needs to provide

Nothing in this repo can go live without accounts only the owner can
create — see spec section 16. Optional services (OpenAI moderation, Resend
email, Turnstile captcha, Upstash rate limiting, Microlink) degrade
gracefully when unconfigured — every call site checks for its env var and
no-ops instead of failing, so the app runs fine without them; only
Supabase (DB/Auth/Storage) and a Google OAuth client are actually required
to get sign-up through to a working portfolio page. Deploy target is
Vercel, project connected to this repo's default branch
(`claude/wizardly-thompson-5t1u1c`). Also needed eventually: Paddle
sandbox → live account (stage 2) and the domain `vitrin.work` with DNS
access — a Vercel-assigned subdomain is fine for testing.

## Commands

```bash
npm run dev       # Turbopack dev server
npm run build     # production build
npm run lint      # ESLint
npm run test      # Vitest
npm run check:i18n  # verifies all locale files have identical key sets
```
