# Officer handover

## Record service ownership

| Service           | Owner to record                                         | Access required                                    |
| ----------------- | ------------------------------------------------------- | -------------------------------------------------- |
| SMU CampusPress   | SMU-managed; authorized council officers                | Site editor/admin as appropriate                   |
| GitHub repository | Currently Heartz00; plan council organization ownership | At least two maintainers                           |
| Vercel project    | To be established                                       | Council-controlled team/account with backup access |
| Domain, if added  | To be established                                       | Registrar/DNS owner and renewal contact            |

Store recovery details in an approved password manager, never this repository. Replace these placeholders when actual hosting is established.

## Routine work

Use **Homepage** in the dashboard to feature an upcoming event and a published announcement. Choose Automatic to restore chronological ordering. Expired events and unavailable announcements fall back to current content.

Use **Council handover** to save the current term name and start/end dates. At the end of a term, expand **Archive the outgoing council**, review the listed members, and confirm they belong to the term being archived. This copies the current roster; it does not recover a different historical roster. Archive before editing members in **Officers**. Set the new term after replacing the outgoing members. New officer rows inherit the current term dates.

To cancel an accidental archive, select **Undo archive** beside its term under **Archived terms**. This removes that entry from public Council history while preserving the current roster and other archived terms. Concurrent changes require reloading before retrying. For corrections, undo the erroneous snapshot before archiving the appropriate outgoing roster.

To enter older members, select **Add past council**, enter the historical term and dates, add members with their roles, biographies and photos, then use **Preview changes** before **Publish past council**. This form only writes Council history; it never replaces current officers. Duplicate terms are rejected. Officer and event editors also offer desktop/phone previews. Collapsed records open automatically when a required field needs attention.

The optional `/admin` dashboard is the simpler editing interface after [one-time setup](ADMIN_SETUP.md). Give each successor their own WordPress membership and application password. Never share an existing officer's credential. Revoke departing officers' site permissions and application passwords.

1. Update executive members on the WordPress Officers page. Review names, roles, photos, biographies, terms, and individual contact links. See [content management](CONTENT_MANAGEMENT.md) for the native table format and legacy compatibility requirements.
2. Add or update events in WordPress Calendar+. Verify schedule, location, description, and links. Do not confuse a post's publication time with its event date.
3. Publish announcements as ordinary WordPress posts. The frontend shows the latest twelve.
4. Update resource pages and public documents in WordPress. Review funding amounts, deadlines, housing links, and document editions before each new academic year.
5. Allow roughly five minutes plus the next request for cached content to refresh. Check the frontend and original WordPress site.

## Redeploy when needed

Ordinary content edits do not need a deploy. For code changes, use the GitHub repository and connected Vercel project. Run the checks in README, review the preview, and merge the approved change into the production branch. A maintainer can also use Redeploy in Vercel's dashboard. See [deployment](DEPLOYMENT.md).

## Troubleshooting

- Missing officers: verify the published officer heading/email structure or standard table; verify the configured slug.
- Missing photo: check that it is a public WordPress image URL and appears in the correct officer section.
- Empty upcoming calendar: check actual scheduled dates, the eight-month display window, and the WordPress calendar. Historical posts are not upcoming events.
- WordPress outage: source links and fallbacks remain, with availability messaging; confirm the public API responds before changing configuration.
- Old content: verify publication, allow revalidation, then check the source/API. A redeploy can refresh content while investigating persistent caching problems.
- Broken document link: upload/link the replacement in WordPress and verify public access.

## Before leaving office

Invite successor and backup maintainers, confirm they can edit WordPress and view GitHub/Vercel, review the contact directory, record actual service ownership, transfer domain renewals if relevant, and walk through one real content update. Remove departing access after successful transfer.
