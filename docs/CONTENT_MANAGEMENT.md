# Content management

## Simpler dashboard

The optional `/admin` workspace provides forms for officers, events, announcements, resources, and photos while saving in WordPress. Each editor uses their own WordPress application password. See [dashboard setup](ADMIN_SETUP.md). The frontend prefers the dashboard-managed `cgc-officers` page when present; until then it reads the original `officers` page. Dashboard-managed events appear alongside Calendar+ entries.

Use the SMU WordPress dashboard you already administer. The frontend never needs your login credentials. Publish updates normally; cached frontend content refreshes on requests after roughly five minutes. Verify both the WordPress page and the frontend after editing.

## Officers

The existing `officers` page works through a legacy WPBakery adapter. Keep role headings ending in a colon, names followed by their parenthesized email, and the officer's photo immediately before that role's section. Editing names, biographies, contact links, and photos in WordPress updates the frontend. Do not add HTML or React code to the frontend.

For greater reliability, use an ordinary WordPress Table block with these column headings (case-insensitive):

| Name         | Role      | Bio             | Term      | Email                | Photo                      |
| ------------ | --------- | --------------- | --------- | -------------------- | -------------------------- |
| Student name | President | Short biography | 2026–2027 | student@mail.smu.edu | Public WordPress image URL |

Add one row per officer, in display order. Name and Role are required; other columns are optional. Email may be plain text or a mailto link. Photo may be a public `https://blog.smu.edu/...` image URL or an image in the cell. Blank photos show initials. Terms are never inferred.

Changing the existing WordPress page to a table is optional and must be done by an authorized officer after checking the original site's presentation. Alternatively create a separate page and set `WORDPRESS_OFFICERS_SLUG` in Vercel once.

## Events

Continue using the existing Calendar+ Events area in WordPress. Set the event date/time, description, location, and relevant source links. The app reads the public monthly Calendar+ endpoint, converts its UTC values for display in `America/Chicago`, and excludes historical activities from upcoming events. It shows a rolling window of two previous months through five months ahead. Events outside that window remain on WordPress.

Check that the event's schedule matches its description. A source event with conflicting times should be corrected in WordPress. Events lacking usable structured dates are omitted.

Optional fallback: create a normal page with slug `events` and a Table block:

| Title           | Start                     | End                       | Location  | Description   | Registration                     |
| --------------- | ------------------------- | ------------------------- | --------- | ------------- | -------------------------------- |
| Example meeting | 2026-10-20T15:00:00-05:00 | 2026-10-20T16:00:00-05:00 | Room name | Short details | https://example.com/registration |

Start must be an ISO timestamp with `Z` or an explicit offset. Dallas uses `-05:00` during daylight saving time and `-06:00` in standard time. Prefer Calendar+ so future officers do not have to manage offsets themselves. A published table page contributes events alongside Calendar+; edit each source in its own editor.

## Announcements

Create or edit ordinary WordPress Posts and publish. The app shows the latest twelve posts and individual detail pages. Original publication dates are retained. Never change an old post date merely to make an old activity appear upcoming.

## Resources and documents

Edit these existing pages in WordPress:

- Funding: `fundings`
- Food/housing: `food-and-housing-resources`
- Speaker sessions: `graduate-seminar-series`
- Links/forms: `links`

Upload public documents through the WordPress Media Library and link them in the appropriate page. Native paragraphs, headings, lists, and links work best. Page-builder layout shortcodes are stripped; content requiring interactive widgets or embedded forms remains on the WordPress source page. Check forms, handbook editions, funding rules, and contact details annually.

## Homepage and council history

The dashboard's **Homepage** page stores selections in the published `cgc-home-settings` page. The React homepage moves the selected upcoming event and announcement to the front of their sections. Missing selections use normal ordering; only the latest twelve announcements are selectable.

**Council handover** stores term dates on the managed officer directory and snapshots in the published `cgc-council-history` page. Archives are public, including the members' existing biographies and public contact details. The first save creates these supporting CMS pages automatically; no code deployment is needed for subsequent content edits. Forms enforce dates, permissions, and stale-version checks, and invalidate public content after successful saves.

## Temporary local fallbacks

`src/content/officers.json` and `events.json` are empty by default. A developer can populate these using the contracts in `types.ts` when WordPress is unavailable. They require a repository change and deployment, so they are temporary, not the routine officer workflow. News falls back to dated archive links. No officer names live in UI components.
