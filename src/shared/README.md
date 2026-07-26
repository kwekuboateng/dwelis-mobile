# Shared layer (from dwelis-frontend)

This folder holds **business logic and API code** ported from [`dwelis-frontend`](../../dwelis-frontend).
The mobile app reuses the same Dwelis backend; only UI lives under `src/screens` and `src/components`.

## What belongs here

| Path | Source in dwelis-frontend | Notes |
|------|---------------------------|-------|
| `api/client.ts` | `AuthContext` API URL helper | Mobile uses `expo-constants` only (no web build config) |
| `context/AuthContext.tsx` | `app/context/AuthContext.tsx` | Trimmed: no web events, uses `AppState` for refresh |
| `services/*` | `app/services/*` | Mobile-safe services (push, payments later) |
| `utils/*` | `app/utils/*` | Pure helpers (phone, pagination, pricing) |
| `types/*` | Various screens | Shared TypeScript models |

## Sync workflow

When backend contracts or auth flows change in `dwelis-frontend`:

1. Update the matching file here (or extract a future `@dwelis/shared` npm package).
2. Run `npm run typecheck` in both repos.
3. Prefer **copying pure functions** over importing across repos — keeps mobile builds independent.

## Not ported (mobile gets native replacements)

- Web routing / host public domains → not needed on native apps
- FullStory, Cloudflare worker, SEO pages
- Web-specific components (`*.web.tsx`, marketing pages)
- Paystack web checkout → use native payment flow when implemented

## Auth storage

Uses the same AsyncStorage key (`@ghana_shortlet_auth`) as the web app so users can share sessions during development if needed. Change the key in production if you want isolated mobile sessions.
