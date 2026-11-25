# Repository overview

> **AI documentation notice:** This page was created with AI assistance and **may contain errors**. See [Documentation disclaimer](disclaimer.md).

This document summarises the **DEVS website** and the **Java API** behind it: layout, routing, major dependencies, and how data and admin tools fit together. Use it alongside [Project Setup](setup.md) and feature-specific KB pages.

## Purpose

- Give new contributors a **map of the repository** without opening every folder.
- List **public and admin routes** as wired in the app.
- Describe how pages get their data (through the Java API) and the **client-side integrations** at a high level.

## Tech stack

Website, as declared in `apps/web/package.json`:

- **React** (19) and **TypeScript**
- **Vite** – dev server and production build
- **React Router** – client-side routing
- **Tailwind CSS** – utility-first styling (`src/main.css` entry)
- **Supabase** – login (`@supabase/supabase-js`). Data is moving to the Java API; see [Data access](#data-access)
- **MUI** (`@mui/material`, icons) and **Emotion** – component library usage where adopted
- **Framer Motion**, **GSAP** – motion and animation
- **@dnd-kit** – drag-and-drop (e.g. task UI)
- **react-toastify** – toast notifications; branded messages use **[Site toast](siteToast.md)** (`SiteToast.tsx`)
- **react-paginate** – pagination primitives (see also the custom [Pagination](pagination.md) component)
- **recharts** – charts where used
- **posthog-js** – product analytics (optional; gated by env and cookie consent)
- **resend** – present as a dependency but unused; email is sent by the API (see [Email](#email))

**Linting:** ESLint with React hooks and refresh plugins.

API (`apps/api`): **Java 25**, **Spring Boot 4**, plain SQL through `JdbcClient`, Spring Security checking Supabase login tokens. See [the API README](../apps/api/README.md).

## Top-level layout

The repo is a pnpm workspace (monorepo). Each app lives in its own folder, and repo-wide tooling (Prettier, git hooks, commit rules, docs) stays at the root.

| Path              | Role                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `apps/web/`       | This website (Vite + React). Paths below starting `src/` are in here |
| `apps/api/`       | Java / Spring Boot API                                               |
| `apps/mobile/`    | _Planned:_ Expo / React Native app                                   |
| `db/`             | Flyway database migrations (schema, RLS policies, grants)            |
| `services/audit/` | _Planned:_ separate audit log service                                |
| `packages/`       | _Planned:_ shared code, e.g. the API client generated from OpenAPI   |
| `kb/`             | Knowledge base (this documentation)                                  |
| `scripts/`        | Repo tooling, e.g. the dependency graph generator                    |

### Website (`apps/web/`)

| Path                | Role                                                               |
| ------------------- | ------------------------------------------------------------------ |
| `src/main.tsx`      | React root, `BrowserRouter`, global CSS import                     |
| `src/App.tsx`       | Routes, `ToastContainer`, cookie banner, PostHog page views        |
| `src/components/`   | Reusable UI (header, footer, dialogs, task views, etc.)            |
| `src/pages/`        | Route-level screens (public, admin, legal, utility)                |
| `src/pages/admin/`  | Admin-only flows (dashboard, CMS-style tools)                      |
| `src/pages/hidden/` | Non-marketed routes (e.g. easter-egg page)                         |
| `src/lib/`          | API calls, auth helpers, hooks, feature logic (“controllers”)      |
| `src/config/`       | Static config (e.g. `feature-flags.json`)                          |
| `src/data/`         | Bundled JSON (e.g. sponsor data mirror)                            |
| `public/`           | Static assets served as-is; includes sponsor JSON used by the site |
| `.env`              | Local environment variables (not committed)                        |

The README at the repo root links to [Home](home.md) for documentation entry.

## Application entry and global behaviour

1. **`main.tsx`** mounts `<App />` inside `BrowserRouter` and `StrictMode`.
2. **`App.tsx`** registers a **navigator** for programmatic “not found” handling (`pageNotFoundController`), tracks **PostHog** `$pageview` on location change when initialised, renders **React Toastify**, **CookieDisclaimer**, and **`<Routes>`**.

Scrolling to top on navigation is handled in the page-view effect.

## Routing map

Routes are defined in `src/App.tsx`. Approximate grouping:

### Public and marketing

| Path        | Page component           |
| ----------- | ------------------------ |
| `/`         | `Landing`                |
| `/home`     | `Home`                   |
| `/landing`  | `Landing`                |
| `/join`     | `Signup` (member signup) |
| `/links`    | `Links`                  |
| `/events`   | `Events`                 |
| `/team`     | `Team`                   |
| `/contact`  | `Contact`                |
| `/about`    | `About`                  |
| `/sponsors` | `Sponsors`               |

### Legal and utility

| Path              | Page component       |
| ----------------- | -------------------- |
| `/privacy-policy` | `PrivacyPolicy`      |
| `/terms`          | `TermsAndConditions` |
| `/qr-code`        | `QRCode`             |
| `/404` and `*`    | `PageNotFound`       |

### Admin (`admin` role in `profiles`, checked by the API)

| Path                       | Page component               |
| -------------------------- | ---------------------------- |
| `/admin/login`             | `AdminLogin`                 |
| `/admin/reset-password`    | `AdminResetPassword`         |
| `/admin/dashboard`         | `AdminDashboard`             |
| `/admin/marketing-request` | `MarketingPortal`            |
| `/admin/manage-links`      | `ManageLinks`                |
| `/admin/manage-events`     | `ManageEvents`               |
| `/admin/members`           | `MemberRegistry`             |
| `/admin/tasks`             | `TaskTracker`                |
| `/admin/event-attendees`   | `EventsDashboard`            |
| `/admin/audit-log`         | `AdminCMSAuditLog`           |
| `/admin/event-todo`        | `EventTodo`                  |
| `/admin/*`                 | Fallback to `AdminDashboard` |

### Hidden

| Path        | Notes                              |
| ----------- | ---------------------------------- |
| `/p/b/6/7`  | `Pb` – intentionally obscure route |
| `/p/kartik` | `KartikGlazer`                     |

Admin layout: many admin screens use shared chrome (`Header`, `PageTitle`, `Footer`) and **`useAdminDashboard`** or equivalent checks (`checkAdminAuthorization` in `auth.ts`) before showing content.

## Feature flags

Flags live in `src/config/feature-flags.json` and are read through **`isFeatureEnabled`** in `src/lib/featureFlags.ts`. Pages and navigation should consult flags before exposing routes or links. Details: [Feature Flags](feature_flags.md).

## Data access

Pages get their data from the **Java API** through `api()` in `src/lib/api.ts`, which adds the logged-in user's token. In dev, Vite proxies `/api` to the local API; on Firebase Hosting, `/api/**` is routed to the API on Cloud Run (`firebase.json`).

**Status (November 2026):** most features are being rebuilt on the API, one page at a time.

| Feature                                                                  | Where its data comes from today                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Login, links, audit log, image uploads, exec invites                     | The Java API                                                |
| Member signup, events, RSVP, attendees, members, tasks, todos, marketing | Old direct Supabase calls (tables, storage, Edge Functions) |
| Contact and sponsor forms                                                | The Supabase Edge Function `send-email`                     |

Since migration `V20261026_0320`, the browser's database roles can't read or write any table, so the pages in the second row don't work until they're rebuilt on the API. The Supabase client in `src/lib/supabase.ts` (from **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`**) is meant only for logging in.

The schema, RLS policies and grants live in `db/migrations` (see [Database Migrations](database_migrations.md)). Main tables:

| Name                                                                        | Typical use                                                                       |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `profiles`                                                                  | Login-linked profiles; `role` (e.g. `admin`), `is_superuser` for audit log access |
| `events`                                                                    | Event listings, RSVP settings, active flag                                        |
| `events_rsvp`                                                               | RSVP rows (email, group, answers, attendance, links to members/events)            |
| `event_rsvp_pending_payments`                                               | Card checkouts waiting for Stripe to confirm payment                              |
| `members`                                                                   | Member signups                                                                    |
| `student_degree`, `student_major`                                           | Degree/major choices per member                                                   |
| `degrees`, `majors`, `degree_major`                                         | Reference data for signup                                                         |
| `member_registry`                                                           | View used by the admin member registry                                            |
| `links`                                                                     | Links page content                                                                |
| `tasks`, `task_comments`                                                    | Task tracker                                                                      |
| `event_todo_items`, `event_todo_comments`, `event_notes`, `event_doc_links` | Event to-do lists                                                                 |
| `marketing_requests`                                                        | Marketing portal requests                                                         |
| `admin_audit_log`                                                           | Audit trail written by database triggers; superuser-only page                     |

**Storage buckets:** `event-images`, `event-payments` (bank transfer screenshots) and `Links` (link icons). The API uploads to them through `/api/admin/uploads/*`, using the server-only service role key. The browser can't write to them directly any more.

## Lib layer (“controllers”)

Business logic and data fetching are concentrated under **`src/lib/`** rather than inside large page files. Examples:

- **`auth.ts`** – session check, admin role verification, password reset/update helpers
- **`api.ts`** – the API client every page uses (`api()`, `ApiError`, `fetchMe()`)
- **`login.ts`** – exec login form
- **`eventsController.ts`** – public active events and date helpers
- **`manageEventsController.ts`**, **`eventsRSVPController.ts`**, **`eventsDashboardController.ts`** – admin CRUD, RSVP submission rules, attendee reporting
- **`memberSignup.ts`**, **`signupController.ts`** – public member registration pipeline
- **`memberRegistryController.ts`** – registry fetch and chart helpers
- **`linksController.ts`** – links management and uploads
- **`taskTrackerController.ts`** – tasks and comments
- **`marketingPortalController.ts`** – marketing requests (old Supabase calls, being rebuilt)
- **`auditLogController.ts`** – superuser check and audit log fetch
- **`emailController.ts`** – contact and sponsor form (Edge Function `send-email`, being rebuilt)
- **`posthog.ts`** – analytics init, opt-in/out vs cookie consent
- **`cookieConsentController.ts`** – consent persistence used with cookies UI
- **`pageNotFoundController.ts`** – centralised navigation for 404 behaviour
- **`featureFlags.ts`** – JSON feature flags
- **`teamController.ts`** – team page year selection, per-year photo preloading and year dropdown behaviour
- **`slideShowController.ts`**, **`aboutController.ts`**, etc. – page-specific data or UI helpers

Naming is not uniform (`*Controller.ts` vs `use*` hooks in the same file); when extending the app, match the nearest existing feature.

## Email

Today the contact and sponsor forms call the Supabase Edge Function `send-email` (`src/lib/emailController.ts`). The rebuild moves this to an API endpoint, where the API builds the email and sends it through **Resend** (the API already has `EMAIL_MODE`, `RESEND_API_KEY` and `CONTACT_EMAIL_TO` settings). The browser should never choose the recipient.

## Analytics

PostHog is initialised in `src/lib/posthog.ts` with **`VITE_PUBLIC_POSTHOG_KEY`** and **`VITE_PUBLIC_POSTHOG_HOST`**. Capturing is **opt-out by default** until cookie consent is read from `localStorage`. See [Analytics](analytics.md).

## Marketing portal

Today `handleMarketingSubmit` in `src/lib/marketingPortalController.ts` still uses the old flow: it posts to the Google Apps Script, inserts into **`marketing_requests`** and calls the Edge Function **`create-marketing-task`**. The insert is refused since `V20261026_0320`, so the portal is being rebuilt on the API. See [Marketing Portal](marketingPortal.md).

## Build, preview, deploy

Run these from the repo root; they forward to `apps/web`.

- **Develop:** `pnpm dev` (Vite default port, commonly `5173`).
- **Production build:** `pnpm build` runs `tsc` then `vite build`, output in `apps/web/dist`.
- **Preview:** `pnpm preview` serves the production build locally.
- **Hosting:** everything merged into `main` goes live on [dev.devsuoa.org](https://dev.devsuoa.org), served by **Firebase Hosting** (project `devs-dev-2027`, config in `firebase.json`). It serves `apps/web/dist`, sends every other path to `index.html`, and routes `/api/**` to the `devs-api` service on Cloud Run (`australia-southeast1`).

## Environment variables (summary)

| Variable                   | Used for                                                                       |
| -------------------------- | ------------------------------------------------------------------------------ |
| `VITE_API_URL`             | API address; leave empty when `/api` is on the same site (dev proxy, Firebase) |
| `VITE_SUPABASE_URL`        | Supabase project URL                                                           |
| `VITE_SUPABASE_ANON_KEY`   | Supabase anon key (login only)                                                 |
| `VITE_PUBLIC_POSTHOG_KEY`  | PostHog project key (optional)                                                 |
| `VITE_PUBLIC_POSTHOG_HOST` | PostHog API host (optional)                                                    |

The API has its own settings (database, Supabase, Stripe, Resend): see [the API README](../apps/api/README.md). Supabase Auth settings (redirect URLs, email templates) are set in the Supabase dashboard, not in this repo.

## Related KB entries

- [Home](home.md) – KB index
- [Changelog](CHANGELOG.md) – commit history from `main`
- [Documentation disclaimer](disclaimer.md)
- [Auth Service](auth.md)
- [Events & RSVP](events_and_rsvp.md)
- [Marketing Portal](marketingPortal.md)
- [Feature Flags](feature_flags.md)
- [Database Migrations](database_migrations.md)
- [Analytics](analytics.md)
- [Commit & Branching Guidelines](commit_guidelines.md)

## Future enhancements

- [ ] Auto-generate route tables from a single source of truth if the app grows further
