# Launch review

The implemented reliability improvements preserve failed-save form values in memory, show field errors, return public confirmation links, and expose event detail pages with `.ics` downloads. Credentials are never part of retained form snapshots. Refreshing or closing the editor still discards unsaved in-memory entries; save a draft before doing that.

## NCW publication check

Read-only checks on October 11, 2026 confirmed that the council published NCW announcement 504 and calendar page 508. The React homepage, announcement detail, and event detail display the uploaded flyer and registration link `https://cglink.me/2vb/r398148`. The event calendar download starts at `20261021T230000Z`, matching October 21 at 6 p.m. Dallas time. Development checks did not publish or change these records.

Use your own account through **Create update → ACS NCW example**. Select the uploaded poster, add the actual registration URL, check the Dallas time and location, and preview desktop/mobile. Save a draft and reopen it from Announcements. Then publish once. Open **View announcement** and **View event** from the confirmation, verify the home page/calendar, download the calendar file, and copy the event link. Confirm October 21, 2026, 6 p.m. Dallas time. No real NCW publication was performed by automated tests.

If only the announcement saves, the form reports partial completion; retry the same form. A version conflict keeps your entries but requires comparing with a freshly loaded editor before retrying. Individual calendar records keep stable IDs as they are edited. Historical Calendar+ records remain subject to the documented rolling fetch window, so links to those records can become unavailable after they leave the window.

## Hosting and sign-in

- Set the real HTTPS `SITE_URL` before building the public deployment. Keep credentials and the session key in server-only settings. Rotate the session key to revoke all dashboard sessions when needed.
- Configure a durable hosting/WAF rate limit for login POSTs before enabling a public dashboard. The existing per-process limiter is defense in depth and cannot coordinate across Vercel instances. This hosting setting cannot be verified from the local workspace.
- Confirm production cookies are Secure, HttpOnly, SameSite=Strict, scoped to `/`, and expire after four hours. Test account-role removal and application-password revocation with authorized accounts. Neither revocation test changes production users automatically.
- Dashboard responses use private/no-store, noindex, and frame-denial headers. Public responses set nosniff, same-origin framing, a conservative referrer policy, and disable unused browser permissions.
- Verify individual Editor permissions, image uploads, existing-content revisions, and recovery from failed saves with the real hosted origin. Never paste account passwords into chat or project files.

## Accessibility and performance

Automated browser audits are recorded in `VALIDATION.md`; they supplement keyboard, screen-reader, zoom, and physical-device review. The isolated production preview uses a local NCW fixture and performs no live CMS writes. Local performance numbers are lab observations, not guarantees of hosted or real-user performance. Check hosting/CDN behavior after deployment.
