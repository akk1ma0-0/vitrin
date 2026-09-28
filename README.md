# Vitrin

Turn links to your work into a portfolio page at `vitrin.work/{username}` in
about two minutes. Each work is a "window" — visitors expand it and click
through the live site, Figma prototype, video, or repo right on the page.

See [`CLAUDE.md`](./CLAUDE.md) for the stack, architecture decisions, and
current build status, and [`docs/SPEC.ru.md`](./docs/SPEC.ru.md) for the
full product spec.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the services you have credentials for
npm run dev
```

Nothing here will run end-to-end without a live Supabase project — see
`.env.example` and CLAUDE.md's "What the owner still needs to provide"
section for the full list of accounts required.

## Scripts

```bash
npm run dev         # Turbopack dev server
npm run build       # production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run check:i18n   # verifies all locale files under messages/ have identical keys
npm run format        # Prettier
```

## Database

Migrations live in `supabase/migrations/`. Once a Supabase project exists,
apply them with the Supabase CLI (`supabase db push`) or paste them into the
SQL editor in order. `src/lib/supabase/database.types.ts` is a hand-maintained
mirror of the schema — regenerate it with `supabase gen types typescript`
once a live project exists, and keep it in sync after every new migration
until then.
