# Student community forum

The private `/forum` includes channels, search, threads, automatic reply refresh, named or anonymous posts, and reporting. Members verify an exact `@smu.edu` email using an emailed code. This verifies mailbox access, not graduate enrollment. Forum authentication uses Supabase Auth and Postgres, separately from officer sign-in and website content.

## Activate

1. Create a Supabase project owned by the council, with account access that can transfer to future officers.
2. In its SQL editor, run `supabase/migrations/202610220001_student_forum.sql` **once**, in full. It creates private tables, restricted functions, moderation, and database rate limits in one transaction. Do not expose the `cgc_forum` schema through the Data API; the API functions live in `public`.
3. Enable email sign-in, keep email confirmation enabled, and configure production SMTP with a council-approved sender. The default Supabase email service is unsuitable for general student sign-in. Set the Auth Site URL to the production website URL. Leave anonymous authentication disabled.
4. Edit the **Magic Link** email template to send the code: `Your CGC Community sign-in code is {{ .Token }}.` Configure a six-digit OTP with a short expiry. The application accepts six to ten numeric digits.
5. Add these server-side Vercel Production environment variables, and Preview only when needed:

   ```dotenv
   FORUM_ENABLED=true
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
   ```

   Get keys from the project's API settings. Legacy anon/service-role keys also work in the respective fields. Never prefix the secret with `NEXT_PUBLIC_`, commit it, or share it in chat. It is used only by authorized officer moderation actions.

6. Redeploy. At `/forum`, request a code with an SMU email, enter it, choose a display name, and create a test discussion. Check delivery with two different SMU mailboxes.
7. Sign into `/admin` with an officer account that has the `moderate_comments` capability. Open **Forum moderation** and test a student report, hide/restore, and suspension/reinstatement before inviting members.

Provision all four variables before enabling the forum. Disabled or missing configuration shows a coming-soon message and accepts no posts. To temporarily close the application, set `FORUM_ENABLED=false` and redeploy. Database membership protections remain active regardless of this flag.

For local development use a separate Supabase project or local stack, configure its email delivery, add settings to `.env.local`, and restart the dev server. Do not copy production student data into development.

## Student experience

- Six channels cover general conversations, research, events, opportunities, help, and introductions. The Events channel is for discussions; official events remain in the main calendar.
- Choose a display name before posting. Every discussion/reply offers named or anonymous posting. Anonymous labels stay consistent within a thread and change across threads.
- Threads refresh every five seconds while visible; the discussion list every fifteen seconds. This is a discussion forum with no direct messages or attachments.
- Students can edit/remove their own posts. Stale edits are rejected and failed submissions retain input while the page remains open. Unsaved text is not stored in browser storage on shared devices.
- Content renders as plain text with HTTP(S) links; user HTML and embedded images do not execute or load.

## Moderation and privacy

Read `/forum/guidelines` before launch. Anonymous posts hide names from students, **not authorized moderators**. Report details include account identities. The forum is not end-to-end encrypted. Do not post passwords, sensitive research, or others' private information.

The officer workspace offers open/resolved reports, hide/restore, suspend/reinstate, and discussion pin/unpin/lock/unlock by link or ID. Report handling and its selected action are atomic. An audit log records the officer identifier. Student sessions cannot invoke moderation functions.

Private tables have row-level security and no direct student grants. Server and database verify confirmed SMU membership. Student responses omit author IDs and emails. APIs are private/no-store; pages are excluded from indexing. Production sessions use secure HttpOnly cookies. Sign-out clears only forum cookies.

Per-member database limits: five posts/minute, ten edits/minute, ten reports/hour, ten profile changes/hour, and thirty removals/hour. Configure Auth email limits separately in Supabase. Monitor SMTP, Auth usage, and database capacity after launch.

Removing a post hides it from students; original text/audit records remain available to authorized operators. Agree on a retention/deletion policy, privacy-request contact, and backups before collecting student posts. Auth accounts with existing posts need a deliberate retention/anonymization process because author references prevent silently deleting history. There is no automatic account-deletion interface.

## Verification

`npm test` runs the actual migration in an isolated PGlite database, checking membership, anonymous privacy, ownership, stale edits, moderator isolation, reports, suspension, removal, and rate limits. Also test real Supabase email delivery, session refresh, and officer permissions before launch.

Official references: [SSR authentication](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [database functions](https://supabase.com/docs/guides/database/functions).
