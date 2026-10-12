# Architecture

## Data flow

SMU CampusPress/WordPress → public HTTPS REST endpoints → server-only data adapter → Next.js App Router server components → Vercel.

Public client components handle navigation, collection filters, the photo viewer, and progressive landing-page motion. The optional `/admin` workspace adds interactive forms, upload/crop dialogs, local content recovery, and save status. CSS supplies the visual design and motion; no animation library, external fonts, or extra database is needed. The molecule illustration is native SVG.

## Organization

- `src/app`: page routes, shared layout, metadata, error/loading/404 boundaries.
- `src/components`: reusable layout, navigation, content cards, and visual components.
- `src/lib/content/types.ts`: UI-independent data contracts.
- `src/lib/content/wordpress.ts`: verified public endpoints, caching, media resolution, Calendar+ retrieval.
- `src/lib/content/adapters.ts`: sanitization, table and legacy officer parsing, event normalization, chronological filtering.
- `src/lib/content/index.ts`: source selection and fallback policy.
- `src/content/*.json`: isolated temporary officer/event fallbacks, initially empty.
- `src/app/admin`, `src/components/admin`, `src/lib/admin`: WordPress-backed dashboard, guarded server actions, per-user authentication, encrypted sessions, and simple content forms.
- `tests`: adapter checks for HTML security, officer mapping, event timezones, and date partitioning.

## Content and caching

Public requests use `next.revalidate: 300`; pages revalidate at the same interval. After the interval, the next request can serve cached content while refreshing it. An officer normally publishes in WordPress and waits for revalidation, without editing React or rebuilding. Live integration is enabled by default. Set `WORDPRESS_ENABLED=false` for offline development.

Calendar+ is queried for two previous months, the current month, and five following months. Occurrences are deduplicated and separated using event start/end times. This is a rolling window, not a complete historical archive. A dedicated standard WordPress events table contributes additional events alongside Calendar+. A dedicated `cgc-officers` page, when published, supplies the frontend roster while the original WordPress officer page is preserved.

Content failures retain safe archive links or local fallbacks and explain availability in the UI. The site never substitutes post publication dates for scheduled event dates. Resource pages retain links to the original sources when their API request fails.

## Security

Public pages fetch only public content. WordPress HTML is sanitized with an allowlist; scripts, inline styles, iframes, event handlers, unsafe links, and shortcode layouts are removed. Officer photos are limited to the verified `blog.smu.edu` host and optimized with Next Image. The optional dashboard uses each officer's dedicated application password only in server-side requests and an encrypted HttpOnly session envelope. Institutional passwords are never used. TLS verification remains enabled. See [dashboard setup](ADMIN_SETUP.md) for activation, authentication limitations, and launch checks.

## Known limits

The legacy officer adapter depends on source heading/contact structure. Prefer the documented native table. Resource content may include stale source forms and contacts. The calendar relies on Calendar+ supplying its Google Calendar link; records with unusable dates are omitted rather than guessed. Preview checks and source review remain necessary before public launch.
