# SMU Chemistry Graduate Council

A responsive Next.js + TypeScript website for the Chemistry Graduate Council at Southern Methodist University. WordPress remains the content management system. Public read-only endpoints provide officers, news, resources, and Calendar+ events. No WordPress administrator credentials are used.

## Run locally

Requires Node.js 24 and npm. The forum authentication SDK requires a modern Node runtime; the project pins Node 24 for consistent local and Vercel builds.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Live public WordPress content is enabled by default. Copy `.env.example` to `.env.local` to change configuration. Set `WORDPRESS_ENABLED=false` for an offline preview with archive links and empty officer/event fallbacks.

Stop a running production server before rebuilding locally, then restart it with `npm start` so its generated pages and asset files belong to the same build.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

On Windows use `npm.cmd` if PowerShell prevents `npm.ps1`. In a managed environment with a trusted system certificate authority, Node 24 can use `NODE_OPTIONS=--use-system-ca`. Never disable TLS verification. If the default npm cache is outside your writable workspace, use `npm ci --cache .npm-cache`.

## Pages

Home, About, Executive Committee, Events, News (including post detail), Resources (funding, food/housing, speaker sessions, links/forms), and Contact. Features include responsive navigation, skip link, keyboard focus states, loading/error/404 views, sanitized WordPress HTML, five-minute content revalidation, metadata, robots, and a sitemap when `SITE_URL` is configured.

## Maintenance

- [Architecture](docs/ARCHITECTURE.md)
- [Discovery findings](docs/DISCOVERY.md)
- [Content management](docs/CONTENT_MANAGEMENT.md)
- [Vercel deployment](docs/DEPLOYMENT.md)
- [Officer handover](docs/HANDOVER.md)
- [Dashboard setup and access](docs/ADMIN_SETUP.md)
- [Private student forum setup](docs/FORUM_SETUP.md)

The repository target is https://github.com/Heartz00/CGC-SMU-website. Move repository and hosting ownership to council-controlled accounts for continuity. This application is a council website, not a central SMU website.
