# Student community forum

The private `/forum` includes channels, search, threads, automatic reply refresh, named or anonymous posts, and reporting. Members now create an account with an `@smu.edu` address and a separate forum password. **Email ownership is not verified**, so an address does not prove SMU membership or graduate enrollment. Supabase Auth and Postgres remain separate from officer sign-in and website content. Email codes, Magic Link templates, and SMTP are not required for this mode.

## Activate

1. Create a Supabase project owned by the council, with account access that can transfer to future officers.
2. In the SQL editor, run `supabase/migrations/202610220001_student_forum.sql` **once** if not already applied, then run `supabase/migrations/202610260001_forum_password_signin.sql`. If the original migration is already applied, run **only the new migration**. It updates the membership rule without removing posts or changing moderation privileges. Do not expose the `cgc_forum` schema through the Data API; API functions live in `public`.
3. Go to **Authentication → Sign In / Providers → Email**. Enable the email provider and turn **Confirm email OFF**. Keep **Allow new users to sign up ON**, and **Allow anonymous sign-ins OFF**. Save. Anonymous posting still works; it is separate from anonymous account authentication.
4. Set the Auth Site URL to the production website URL. Skip SMTP and email-template configuration. Registration checks the public Auth settings before creating an account and remains unavailable while Confirm email is enabled, preventing accidental confirmation-email sends.
5. Add these server-side Vercel Production environment variables, and Preview only when needed:

   ```dotenv
   FORUM_ENABLED=true
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
   ```

   Get keys from the project's API settings. Legacy anon/service-role keys also work in the respective fields. Never prefix the secret with `NEXT_PUBLIC_`, commit it, or share it in chat. It is used only by authorized officer moderation actions.

6. Redeploy. At `/forum`, choose **Create account**, enter an SMU email and a new forum password of 10–128 characters, confirm the password, then choose a display name. Test sign-out/sign-in, a named post, and an anonymous reply. Do not use an SMU institutional password for this forum.
7. Sign into `/admin` with an officer account that has the `moderate_comments` capability. Open **Forum moderation** and test a student report, hide/restore, and suspension/reinstatement before inviting members.

Provision all four variables before enabling the forum. Disabled or missing configuration shows a coming-soon message and accepts no posts. To temporarily close the application, set `FORUM_ENABLED=false` and redeploy. Database membership protections remain active regardless of this flag.

For local development use a separate Supabase project or local stack, turn off email confirmation there too, add settings to `CGC-SMU-website/.env.local`, and restart the dev server. Do not copy production student data into development.

Existing email-code accounts keep their posts and sessions, but may not yet have a password. Do not delete these users or create replacement identities to work around sign-in. A project administrator needs to arrange a password setup/recovery process for these accounts. There is no automated password-reset email flow in the application; adding one later requires email delivery. Never share passwords through chat or publish a shared account password.

To restore verified membership later, replace this sign-in flow and database rule together and verify existing members explicitly. Re-enabling the Confirm email toggle alone is insufficient: Supabase implicitly confirms newly created accounts when that toggle is off.

## Student experience

- Six channels cover general conversations, research, events, opportunities, help, and introductions. The Events channel is for discussions; official events remain in the main calendar.
- Choose a display name before posting. Every discussion/reply offers named or anonymous posting. Anonymous labels stay consistent within a thread and change across threads.
- Threads refresh every five seconds while visible; the discussion list every fifteen seconds. This is a discussion forum with no direct messages or attachments.
- Students can edit/remove their own posts. Stale edits are rejected and failed submissions retain input while the page remains open. Unsaved text is not stored in browser storage on shared devices.
- Content renders as plain text with HTTP(S) links; user HTML and embedded images do not execute or load.

## Moderation and privacy

Read `/forum/guidelines` before launch. Anonymous posts hide names from students, **not authorized moderators**. Report details include account identities. The forum is not end-to-end encrypted. Do not post passwords, sensitive research, or others' private information.

The officer workspace offers open/resolved reports, hide/restore, suspend/reinstate, and discussion pin/unpin/lock/unlock by link or ID. Report handling and its selected action are atomic. An audit log records the officer identifier. Student sessions cannot invoke moderation functions.

Private tables have row-level security and no direct student grants. Server and database require an authenticated account with an SMU-domain address, but do not verify mailbox ownership. Student responses omit author IDs and emails. APIs are private/no-store; pages are excluded from indexing. Production sessions use secure HttpOnly cookies. Sign-out clears only forum cookies.

Per-member database limits: five posts/minute, ten edits/minute, ten reports/hour, ten profile changes/hour, and thirty removals/hour. Supabase handles password hashing, sessions, and authentication rate limits. Monitor Auth usage and database capacity after launch.

Removing a post hides it from students; original text/audit records remain available to authorized operators. Agree on a retention/deletion policy, privacy-request contact, and backups before collecting student posts. Auth accounts with existing posts need a deliberate retention/anonymization process because author references prevent silently deleting history. There is no automatic account-deletion interface.

## Verification

`npm test` runs both migrations in an isolated PGlite database, checking the change from verified to unverified accounts, SMU-domain restriction, anonymous privacy, ownership, stale edits, moderator isolation, reports, suspension, removal, and rate limits. Password-flow tests verify signup gating, session requirements, and safe errors. Also test actual Supabase signup, password sign-in, session refresh, and officer permissions before launch.

Official references: [password authentication](https://supabase.com/docs/guides/auth/passwords), [Auth configuration](https://supabase.com/docs/guides/auth/general-configuration), [database functions](https://supabase.com/docs/guides/database/functions).
