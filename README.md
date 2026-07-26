# Dwelis Mobile

Native-first **iOS and Android** app for Dwelis, built with Expo. This repo is separate from [`dwelis-frontend`](../dwelis-frontend) so mobile can use platform-native navigation, typography, and gestures without carrying web/marketing UI.

## Why a separate repo?

| dwelis-frontend | dwelis-mobile |
|-----------------|---------------|
| Web + iOS + Android (shared UI) | iOS + Android only |
| Marketing pages, SEO, host custom domains | Native tabs, large titles, haptics |
| Responsive web layouts | Mobile-native screen patterns |

Both apps talk to the same backend: `https://api.dwelis.com`.

## Stack

- **Expo SDK 54** + **React Native 0.81**
- **React Navigation 7** (native stack + bottom tabs)
- **Shared business logic** under `src/shared/` (ported from dwelis-frontend)
- **New native UI** under `src/screens/` and `src/components/`

## Project layout

```
src/
├── shared/          # API, auth, utils — synced from dwelis-frontend
├── screens/         # Native screens (guest, host, auth)
├── components/      # Native UI building blocks
├── navigation/      # Tab + stack navigators
└── theme/           # Mobile design tokens
```

See [`src/shared/README.md`](src/shared/README.md) for how to keep shared code in sync with the web app.

## Setup

```bash
cd dwelis-mobile
npm install
cp .env.example .env
# Optional local API:
# EXPO_PUBLIC_API_URL=http://192.168.1.92:4001
npm start
```

Press **i** for iOS simulator or **a** for Android.

## EAS Build

1. Create a new EAS project: `npx eas init`
2. Replace `REPLACE_WITH_NEW_EAS_PROJECT_ID` in `app.json`
3. Build: `npx eas build --platform ios --profile preview`

Bundle IDs are **`com.dwelis.mobile`** (distinct from the web/universal app's `com.dwelis.app`).

## Current screens

**Guest:** Explore (live listings), Trips, Messages (placeholder), Profile, Listing detail

**Host:** Today, Listings, Calendar, More (placeholders — native implementations to follow)

**Auth:** Login (same `/auth/login` API as web)

## Next steps

- [ ] Signup / OTP / email verification screens
- [ ] Native booking flow (Paystack mobile SDK)
- [ ] Native chat (replace web message layout)
- [ ] Host listing editor with native forms
- [ ] Extract `src/shared` into `@dwelis/shared` package when duplication grows

## Related repos

- [`dwelis-frontend`](../dwelis-frontend) — web marketplace + universal Expo app
- [`dwelis-backend`](../dwelis-backend) — API
