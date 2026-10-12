# Vercel deployment

## Before first deployment

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Review mobile and desktop layouts, officer names/photos, source links, and the empty calendar state. This document prepares deployment; it does not imply the project has already been published.

## GitHub and Vercel

The repository includes `vercel.json` with Next.js install/build settings and a GitHub Actions workflow that checks types, lint, formatting, tests, and the offline production build. These configuration files do not connect an account or deploy by themselves. GitHub remote reads succeeded; the repository had no branches at the development check. No Vercel CLI or connected project was available in this workspace.

1. Push reviewed project files to https://github.com/Heartz00/CGC-SMU-website. Commit `package-lock.json`; never commit `.env.local`, personal documents, credentials, or ignored discovery data.
2. In the council's Vercel account/team, import that GitHub repository.
3. Select the Next.js framework preset. When this directory is the repository root, leave Root Directory at its default.
4. Use Node.js 24 (or another version supported by the installed Next.js release).
5. Default install/build commands are `npm ci` and `npm run build`.
6. Set `SITE_URL` to the assigned production origin, including `https://`, then redeploy to generate accurate metadata/sitemap.
7. Check the preview deployment before connecting any custom domain.

## Environment variables

| Variable                  | Default / purpose                                                          |
| ------------------------- | -------------------------------------------------------------------------- |
| `WORDPRESS_URL`           | `https://blog.smu.edu/chemgrads`; also used for Calendar+                  |
| `WORDPRESS_ENABLED`       | Enabled unless set to `false`                                              |
| `WORDPRESS_API_URL`       | Standard `/wp-json/wp/v2/` endpoint; optional REST query-route alternative |
| `WORDPRESS_OFFICERS_SLUG` | `officers`                                                                 |
| `WORDPRESS_EVENTS_SLUG`   | `events`; native table override if published, otherwise Calendar+          |
| `SITE_URL`                | Production HTTPS origin; required for the sitemap                          |

No WordPress passwords, application passwords, or keys are required. Vercel normally uses its own public trust store; the local system-CA setting is specific to development environments and should not be copied blindly into hosting settings.

The above applies to public content fetching. To enable the optional dashboard, configure server-only `ADMIN_ENABLED=true` and a generated `ADMIN_SESSION_SECRET`, then follow [admin setup](ADMIN_SETUP.md). Officers enter their own dedicated WordPress application passwords at sign-in; never store those as shared deployment variables. Configure login rate limiting before public activation.

## Analytics and speed monitoring

The official Vercel Web Analytics and Speed Insights components are installed. In the Vercel project, enable **Analytics** and **Speed Insights**, then set `NEXT_PUBLIC_SITE_METRICS_ENABLED=true` in the production environment and redeploy. The integration stays disabled until that flag is set. Admin paths are excluded, including client navigation after a public page; public query strings and hashes are removed before reporting. Do not treat local fixture checks as proof that Vercel tracking has been activated.

See [Web Analytics setup](https://vercel.com/docs/analytics/quickstart) and [Speed Insights setup](https://vercel.com/docs/speed-insights/quickstart).

## Custom domain

The current production address remains `https://cgc-smu-websites.vercel.app`. To use a domain you own, add it in the Vercel project's Settings → Domains and follow its DNS instructions. An institutional subdomain requires its owner to configure DNS. Set `SITE_URL` to the final HTTPS origin and redeploy so metadata and the sitemap use that address. No domain has been purchased, attached, or modified by development tools.

## Updates and ownership

Use [launch review](LAUNCH_REVIEW.md) for live NCW publication verification, production sign-in settings, and hosting rate-limit checks. Local builds and browser fixtures do not activate or verify Vercel configuration.

Code changes on the connected production branch trigger Vercel builds. Routine content updates happen in WordPress and refresh through five-minute revalidation; no code push is needed. Vercel can redeploy an existing build from the project dashboard when required.

Keep repository, Vercel team, and domain under durable council control. Do not assume a personal Vercel plan or its collaboration terms fit the council; review the chosen account configuration before launch. An institutional domain requires coordination with its owner; this app does not replace the existing `blog.smu.edu` site or modify its hosting.
