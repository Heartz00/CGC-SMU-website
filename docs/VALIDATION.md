# Development validation

## Faculty leadership — October 26, 2026

All 68 tests pass, including faculty profile table round-trips, fixed role enforcement, escaped biography content, empty profiles, and rejected incomplete/unsafe inputs. Faculty records use a separate managed page so student roster and archive operations remain independent. Lint, TypeScript, formatting, and the isolated production build pass.

Isolated Chrome fixtures render the actual faculty section and admin editor with sample people. At 1440, 900, 390, and 320px, cards and fields fit without horizontal overflow, both role forms are present with no nested forms, and Axe WCAG 2 A/AA reports no violations. The real empty-state page shows both faculty roles without inventing identities. No live content was changed; faculty names/photos must be supplied through the admin editor.

## Password sign-in without email verification — October 26, 2026

All 66 tests pass. Both database migrations run in sequence: the original confirmed-email rule is checked, then the update permits an unconfirmed SMU account while still rejecting outsiders, unauthenticated access, forged moderation calls, and ownership violations. Password tests cover length/preservation, missing sessions, safe errors, rate-limit responses, and preventing signup calls while email confirmation is enabled. Lint, TypeScript, formatting, and the isolated production build pass.

Chrome production-preview checks at 1440, 390, and 320px verify account-mode switching, password fields/autocomplete, no OTP input, no horizontal overflow, server rejection of mismatched passwords, and unauthenticated API rejection. Axe WCAG 2 A/AA reports no violations on the tested signup screens. Preview uses placeholder Supabase configuration and creates no live accounts. Live confirmation settings and the new database migration must be applied by the project owner; SMTP delivery is not used by the new flow.

## Student forum — October 23, 2026

All 63 tests pass, including executing the forum migration in an isolated PGlite database. Checks cover unverified/non-SMU rejection, anonymous identity isolation, private-table and moderation access denial, ownership, stale edits, reporting, atomic moderation, suspension, removal, rate limits, and retry-safe posting. Lint, TypeScript, formatting, and a clean npm 10 `ci --dry-run` pass.

The isolated production build passed on Node 24 / Next.js 16.4.3 using webpack. Production HTTP checks verified private/no-store and noindex headers, the disabled-forum state, unauthenticated API rejection (401), and cross-origin write rejection (403). Temporary UI fixtures are excluded from the final build and repository.

Hidden Chrome checks used isolated member fixtures, without sending email or modifying live content. Board, thread, sign-in/coming-soon, and guidelines fit at desktop and 390/320px widths. Axe WCAG 2 A/AA found no violations on the tested screens. Dialog opening, title focus, Escape/focus restoration, channel filters, anonymous submission, failed-reply text retention, and retry tokens passed. Unauthenticated forum API reads/writes return 401, and cross-origin writes are rejected.

Live Supabase provisioning, SMTP delivery, Auth session refresh, and officer moderation permissions still require the deployment steps in [FORUM_SETUP.md](FORUM_SETUP.md). Local fixtures do not establish that live authentication is configured.

## Latest UI/UX workflow checks

Navigation and event/announcement separation passed all 59 unit tests. Browser checks at 1440, 1200, 1120, 1024, 768, 390, and 320 pixels verified header fit, a single active menu item, outside-tap dismissal, mobile route selection, and client-side transitions without a full document reload. A read-only admin navigation fixture verified native Space-key activation, current-section labeling, a compact grid menu, and route navigation. Axe WCAG 2/2.1 A/AA reported no violations in that fixture. No CMS content was modified; deduplication changes public listing behavior only.

The image picker supports inline upload-and-select and cropping a copy of an existing library image. The source-file endpoint requires sign-in and upload permission, looks up a media ID through the authenticated CMS API, downloads only HTTPS SMU upload URLs without forwarding credentials, rejects redirects, checks signatures, and bounds source size to 20 MB. Unit tests cover these boundaries and recovery schema/expiration/credential exclusion. All 57 tests passed.

Chrome production fixtures verified new-file and existing-image cropping, automatic selection, thumbnail pagination, absence of nested forms, gallery filtering/pagination, arrow-key and swipe navigation, focus restoration, recovery after navigation, successful-save cleanup, Dallas date restoration, disabled-browser-storage feedback, and opening nested optional sections on validation errors. The landing animation is present normally and disabled under reduced-motion preferences. Fixtures use mocked uploads and saves; no live CMS writes were performed.

At 320px, the public routes, fixture forms, gallery viewer, and crop dialog fit without horizontal overflow. Axe WCAG 2/2.1 A/AA checks reported no violations across the seven public/sign-in routes tested, the workflow fixture, and both open dialogs. The mobile crop dialog was also visually inspected; upload actions scroll normally inside it so they do not cover crop controls. Automated checks do not replace testing with representative devices and assistive technology.

October 11, 2026, Windows, Node 24.11.0, Next.js 16.4.0.

- TypeScript check passed.
- ESLint passed.
- Prettier formatting check passed.
- All 50 tests passed, including album escaping and image validation, scheduled publication/privacy, Dallas pin expiry, private attendance writes, zero/invalid count handling, revision parent/version safeguards, and the previous content/authentication/publishing checks.
- Production build passed, including the new composer, using an isolated copy and the webpack build option so the active development server remained available. That copy contained no account credentials.
- HTTP smoke checks passed for all public pages, the October 2024 news detail, and all four resource details. An unknown route returned 404. Each rendered page had one main heading and no surviving WPBakery shortcodes.
- Real headless Chrome checks at 1440px, 390px, and 320px confirmed loaded CSS, layouts without horizontal overflow, mobile menu open/close behavior, and Escape returning focus to the menu button.
- The live WordPress officer directory rendered five cards and four fully loaded photos. The optimized officer image endpoint returned HTTP 200 with a JPEG response.
- Dashboard sign-in passed headless Chrome checks at 1440px, 390px, and 320px without horizontal overflow. Password input masking and search-engine exclusion were verified.
- All nine dashboard route checks rejected anonymous access and redirected to sign-in. An invalid application password was rejected without granting a session. Next.js can stream these redirects in HTTP 200 responses; browser navigation was also checked.
- Flyer cards rendered from the real React components passed Chrome checks at 1440px, 390px, and 320px with no horizontal overflow and uncropped image styling. These layout fixtures used an existing WordPress image; the ACS example has not been published or uploaded by development checks.
- An isolated browser fixture using the actual composer, with a stubbed save action and image response, passed thumbnail selection, desktop/mobile previews at 1440px/390px/320px, draft feedback, and unsaved-change protection. Real browser image preparation compressed a 7.7 MB PNG below 2 MB as WebP; small inputs remained unchanged. These checks performed no live CMS writes.
- Browser recovery checks verified failed-save text and file retention, inline errors and `aria-invalid`, updated version tokens on repeated saves, confirmation links, and retention of edited NCW text after a failed composer save.
- Axe WCAG 2 A/AA and WCAG 2.1 A/AA audits found no violations on nine isolated production pages: Home, About, Events, the NCW event detail fixture, Executive Committee, News, Resources, Contact, and sign-in. Low-contrast labels on blue backgrounds were corrected. Authenticated dashboard screens were checked through local component fixtures, not a real signed-in SMU session.
- The emulated-mobile production run measured LCP around 740 ms, CLS 0, and about 197 KB of transferred resources. CPU/network throttling was requested in Chrome; these local lab observations do not represent field performance or a hosted-device guarantee.
- Production-preview smoke checks verified the NCW event page and calendar download, a 401 response for anonymous image-library access, no-store/noindex/frame-denial dashboard headers, and public nosniff headers. The calendar start was `20261021T230000Z`, matching 6 p.m. Dallas time. Unknown calendar paths return 404; streamed page not-found responses can use HTTP 200 while displaying the not-found view.

See [launch review](LAUNCH_REVIEW.md) for the remaining live account, hosting rate-limit, and representative-device checks. The fixture's NCW content is local only; no announcement or event was published by these checks.

## Dashboard activation review

Management browser fixtures passed gallery/form reflow at 1440px, 720px, 390px and 320px, keyboard selection of scheduled publishing, Dallas timestamp submission, saved album descriptions, accessible image/control names in Chrome's full accessibility tree, and Axe WCAG 2/2.1 A/AA checks. The narrow widths cover zoom-equivalent reflow; this is not a physical screen-reader certification. New production Photos, Events and News pages passed the same widths and keyboard skip navigation. Anonymous requests to Albums, Attendance, History and a record's revisions redirected to sign-in.

The generated event social card returned a 1200 × 630 PNG and was visually inspected for readable, uncropped text. Authenticated revision restoration and scheduling behavior are exercised against mocked APIs; live retention settings, scheduled-job reliability and real-user assistive-technology testing remain account/device checks. No album, count or revision was changed on the live CMS by development tools.

New browser checks verified text search, category filters and empty results, unsaved-change warnings for refresh and same-tab links, and clearing the warning after a successful save. Record previews still pass at 1440px, 390px and 320px. These fixtures stub saves and do not modify live content. Analytics integration remains disabled pending project activation and the production environment flag.

The updated isolated production build passed, with zero Axe WCAG 2 A/AA and 2.1 A/AA violations across the nine public/sign-in routes. Search controls and filtered cards passed the 390px overflow checks. The latest local mobile performance observation was LCP 664 ms and CLS 0; these remain lab measurements. npm 10 validated the analytics dependency lockfile against current registry metadata in a folder without installed dependencies.

The past-council editor and record previews passed an isolated production build. Chrome component fixtures at 1440px, 390px and 320px verified officer preview rendering, phone mode, absence of horizontal overflow, opening invalid collapsed records, and successful form feedback with keyboard input. The browser save was stubbed and performed no live CMS writes. Current officers are never a write destination of the past-council service.

The Homepage and Council handover screens are implemented with the existing authenticated save flow, permission checks, and version conflicts. Their supporting CMS pages are created on the first authorized save. Unit checks cover safe selection identifiers, ordering fallback, impossible/reversed term dates, and escaped archive snapshots. Anonymous requests to both new screens redirect to sign-in. Live authenticated saves of these new controls remain an account-owner check.

Read-only checks confirmed the council's published NCW post 504 and events page 508. The development React homepage, announcement and event detail pages return the actual flyer and registration URL. The live event's calendar download returns `20261021T230000Z` (October 21, 6 p.m. Dallas). These records were published by the council, not development tests.

The updated production build passed. Chrome verified the live NCW poster and registration link at 1440px, 390px, and 320px, with no overflow or browser console errors. Both new dashboard routes redirected anonymous users to sign-in. All nine previous production accessibility routes and the new Council history page passed Axe WCAG 2 A/AA and 2.1 A/AA checks. The updated local mobile run observed LCP 672 ms and CLS 0; hosted performance remains unmeasured.

Live WordPress sign-in, saving, media uploads, and user-role changes require an authorized account and have not been exercised against SMU. No WordPress content or users were changed. Follow `ADMIN_SETUP.md` for individual application passwords, production session configuration, and durable hosting-level login rate limiting before publicly enabling the dashboard. User invitations still use SMU WordPress's account-management screen.

## Remaining launch review

The modern UI refresh passed TypeScript, ESLint, and formatting checks. Chrome checks at 1440px, 390px, and 320px verified the home page, mobile menu/Escape behavior, redesigned flyer cards, and absence of horizontal overflow. Events, News, Resources, and sign-in also passed narrow-screen layout checks. Reduced-motion mode disables smooth scrolling and transitions. No content was changed by this visual refresh.

This is a local implementation; GitHub source has not been pushed and Vercel has not been deployed. Review current officer terms, old announcements, funding rules/forms, source document editions, and conflicting historical calendar descriptions with the council before launch. An automated browser check does not replace a complete accessibility audit or representative device review.

`SITE_URL` needs the actual production origin before the sitemap can contain public URLs. Calendar history uses a documented rolling window. No WordPress content or hosting settings were changed.
