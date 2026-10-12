# WordPress-backed dashboard

The new `/admin` workspace edits content in SMU WordPress. Public pages remain React-styled. No database, shared WordPress admin login, or extra CMS is introduced.

On Officers, select an existing image from the dropdown, labeled with its title and description. A thumbnail confirms the selection. The description entered during upload helps identify the image. Upload a new photo through the link beside the picker; it opens Photos in a new tab. Return and click **Refresh photos** to load it without losing officer edits, then save the officer list. **Clear photo** removes the assignment when you save, while keeping the image in WordPress.

## Posting a flyer or Instagram announcement

In **Photos**, choose a file, then click **Adjust / crop**. Select a crop shape, zoom, move the horizontal/vertical sliders, or rotate the picture. **Apply crop** updates the upload preview; **Use original** restores the uncropped upload. Enter the image description and click **Upload**. The editor works on phones and with keyboard controls. It creates a new library image; existing images and their assignments remain unchanged. To crop a previously uploaded image, download it from its image URL and select that file as a new upload.

Failed saves now keep text, selected images, and upload files on the page. Errors appear beside affected fields. Successful saves include links to the public content. Entries are retained in memory, so save a draft before refreshing or closing the tab. If sign-in cannot be verified during saving, open the provided sign-in link in a new tab and retry after signing in. Never enter credentials into content fields.

1. Upload the flyer in **Photos**, with a useful description. Images over 2 MB are prepared in the browser as WebP, with a maximum longest edge of 2400px (smaller when needed). Small files remain unchanged. Sources over 20 MB require a smaller export. The final upload remains at most 2 MB.
2. Open **Create update**, or the **ACS National Chemistry Week example** under Announcements. Enter the title and description. Check **Also show in Upcoming Events** to add Dallas date/time and location. Select a flyer from the dropdown or **Browse thumbnails**, and paste the registration URL.
3. Choose **Preview** to review desktop/mobile layouts without saving. Choose **Save draft** to keep it private, or **Publish** to create both the announcement and calendar entry. Combined drafts retain their event fields; reopen them from Announcements. The form warns before leaving unsaved edits.

The two WordPress writes cannot be atomic. If the announcement saves but the calendar fails, the form reports partial completion and retains the post ID/version. Retry in the same form to finish without creating another announcement or calendar row. Editing a combined update keeps its related calendar row in sync. Saving it as a draft or unchecking Upcoming Events removes that related row. Ordinary legacy announcements and manually managed events retain their separate editors.

The NCW example is October 21, 2026 at **6:00 p.m. Dallas time (CDT)**, matching 7:00 p.m. Eastern. The supplied poster says CST, but Dallas observes daylight saving time on that date. Its location is FOSC 158, 3215 Daniel Avenue. No registration destination was inferred from the QR code; add its actual URL. Selecting the example does not publish anything until you save. Visitors can open full-size flyers, read text details without scanning an image, and click registration links.

## One-time setup steps

1. Generate a 32-byte session key locally:

   ```sh
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. Set `ADMIN_ENABLED=true` and `ADMIN_SESSION_SECRET=<generated value>` in ignored `.env.local` for development and in Vercel's server environment for hosting. Never use `NEXT_PUBLIC_*` for these values. Do not commit or share the key. Restart the app after changing environment variables.
3. Open your WordPress profile at https://blog.smu.edu/chemgrads/wp-admin/profile.php. Under Application Passwords, create one named **CGC Website**.
4. Visit `/admin/login`. Enter your WordPress username and this dedicated application password. Never enter your SMU institutional password.
5. Each officer needs their own WordPress account with an appropriate role on the Chemistry Graduate Council site. Editors can manage ordinary content. Administrators retain access management, subject to SMU multisite restrictions.

Discovery verified that WordPress advertises application-password authentication and REST write routes. These advertisements do not prove that a particular SMU account may use them. A successful authenticated sign-in checks actual access; a real write check still requires an authorized account and a deliberate save. No credentials have been collected and no live content has been modified by development checks.

If Application Passwords is missing from your profile, stop at that step and ask SMU for an approved remote editing authentication method. Do not use an institutional password, bypass SSO, or install an unapproved plugin as a workaround.

## Content workflows

- **Officers:** the dashboard initializes from the existing published roster, then saves a dedicated `cgc-officers` WordPress page using a native table. The frontend prefers that page when present. The old `officers` page is preserved. Edit the managed page through either this dashboard or the documented WordPress table format.
- **Events:** form-created events save to the configured `events` WordPress page. They appear alongside existing Calendar+ entries. Calendar+ entries retain their original editor; they are not silently rewritten through incomplete plugin APIs. Date/time pickers use Dallas local time and store the timezone automatically. Nonexistent spring-transition times are rejected; the repeated autumn hour defaults to its later standard-time occurrence.
- **Announcements:** create normal WordPress Posts, save drafts, or publish. Updating existing body text requires confirming conversion to simple paragraphs. Unchanged bodies preserve their original rich content. This first version is a plain-text editor; use WordPress for embeds and richer formatting.
- **Resources:** edit existing resource pages. Changing body text requires an explicit conversion checkbox because links, lists, and shortcode formatting would otherwise be lost. Use the original WordPress editor to retain rich formatting and document links.
- **Photos:** upload JPEG/PNG/WebP images up to 2 MB into WordPress's media library. Copy the returned library URL into the officer form. File type and basic file signatures are validated; WordPress applies its own upload permissions and checks.

Dashboard content saves immediately expire the public WordPress page/post cache and trigger frontend path revalidation, so the next website request fetches updated content. Changes made directly in WordPress still use the normal five-minute refresh interval. Drafts do not enter the public feed. Versions are checked before writes to detect intervening edits; WordPress does not supply an atomic transaction across the check and update, so simultaneous edits within the same timestamp are a remaining limitation.

Officer edits are saved to **CGC Officer Directory** (`cgc-officers` by default), which supplies the React roster. They do not overwrite the original WordPress **Officers** page. The Officers dashboard links directly to the saved directory and its WordPress editor. Saving involves permission verification, a version check, and a WordPress write; allow several seconds and wait for the success notice before navigating away.

## Giving and removing access

The People & Access page reads site members when WordPress allows it. An authorized account can assign Editor to another existing non-administrator site member. It cannot elevate anyone to Administrator or change its own role.

Adding an institutional user or inviting an existing multisite user goes through SMU WordPress's **Add User** screen, linked from the dashboard. The ordinary REST create-user route does not provide a dependable SMU SSO invitation workflow. The dashboard does not pretend to send invitations or create institutional identities.

Remove a departing officer's membership/editing permissions through WordPress and revoke their dedicated application password. Authorization is rechecked against WordPress for every request, including server actions, rather than trusting a role saved in a browser session.

## Session security and launch requirements

Credentials are used only by server-side WordPress requests. The browser receives an AES-256-GCM encrypted, authenticated session envelope in an HttpOnly, SameSite=Strict cookie. The envelope contains the application password as ciphertext, not readable browser state. Production uses a Secure `__Host-` cookie; sessions expire after four hours. Rotating `ADMIN_SESSION_SECRET` invalidates all dashboard sessions. Signing out clears the cookie; revoking the WordPress application password revokes the underlying credential.

Server actions enforce same-origin submissions and Next.js's own origin checks. WordPress enforces the final content permissions. Authenticated responses use `no-store`, dashboard pages are excluded from indexing, and authenticated credentials are never placed in public environment variables, URLs, logs, or UI props. WordPress endpoint redirects are rejected to prevent forwarding authorization to a different destination.

Before enabling on public hosting, enable hosting/WAF rate limiting for `/admin/login` POST requests and verify WordPress's login protections. A bounded in-process limiter allows five sign-in attempts per username per fifteen minutes; it cannot coordinate across server instances or survive restarts and is not a distributed rate limiter. Require HTTPS for hosted access. Confirm real login, editing, role revocation, and account handover using authorized test content before granting production access.

## What has not been verified yet

Content forms warn before refreshing/closing an edited page or following an ordinary link in the same tab. This includes image selection and record additions/removals; successful saves clear the warning. Failed-save entries remain in memory. These warnings do not persist drafts across browser crashes or closing the tab: save announcements as drafts, then use **Continue a saved draft** in Announcements. Browser history navigation is not covered by the link interception.

The sidebar now includes **Homepage** for featuring content and **Council handover** for term dates and outgoing council archives. Both require permission to publish pages. See [handover instructions](HANDOVER.md) for the routine workflow. Their supporting records are created on the first save; archived rosters are publicly visible.

- Real login using an SMU-issued application password.
- Live WordPress saves, uploads, and role changes.
- Whether SMU permits your account to add/list/promote site members.

Local security tests cover session encryption/tampering/expiry and safe content serialization. These do not substitute for the authenticated deployment checks above.

Authentication reference: [WordPress REST API application passwords](https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/). Server-action security reference: [Next.js data security](https://nextjs.org/docs/app/guides/data-security).
