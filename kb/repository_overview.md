# Repository overview

> **AI documentation notice:** This page was created with AI assistance and **may contain errors**. See [Documentation disclaimer](disclaimer.md).

This document summarises the **DEVS website** codebase: layout, routing, major dependencies, and how data and admin tools fit together. Use it alongside [Project Setup](setup.md) and feature-specific KB pages.

## Purpose

- Give new contributors a **map of the repository** without opening every folder.
- List **public and admin routes** as wired in the app.
- Describe **Supabase-backed features** and **client-side integrations** at a high level.

## Tech stack

As declared in `package.json` and used in practice:

- **React** (19) and **TypeScript**
- **Vite** – dev server and production build
- **React Router** – client-side routing
- **Tailwind CSS** – utility-first styling (`src/main.css` entry)
- **Supabase** – auth, Postgres data, storage, and Edge Function invocation (`@supabase/supabase-js`)
- **MUI** (`@mui/material`, icons) and **Emotion** – component library usage where adopted
- **Framer Motion**, **GSAP** – motion and animation
- **@dnd-kit** – drag-and-drop (e.g. task UI)
- **react-toastify** – toast notifications; branded messages use **[Site toast](siteToast.md)** (`SiteToast.tsx`)
- **react-paginate** – pagination primitives (see also the custom [Pagination](pagination.md) component)
- **recharts** – charts where used
- **posthog-js** – product analytics (optional; gated by env and cookie consent)
- **resend** – present as a dependency; outbound mail from the **browser** goes through Supabase (see [Email](#email-and-edge-functions))

**Linting:** ESLint with React hooks and refresh plugins.

## Top-level layout

The repo is a pnpm workspace (monorepo). Each app lives in its own folder, and repo-wide tooling (Prettier, git hooks, commit rules, docs) stays at the root.

| Path              | Role                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `apps/web/`       | This website (Vite + React). Paths below starting `src/` are in here |
| `apps/mobile/`    | _Planned:_ Expo / React Native app                                   |
| `services/api/`   | _Planned:_ Java / Spring Boot API (Flyway migrations live here)      |
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
| `src/lib/`          | Data access, auth helpers, hooks, feature logic (“controllers”)    |
| `src/config/`       | Static config (e.g. `feature-flags.json`)                          |
| `src/data/`         | Bundled JSON (e.g. sponsor data mirror)                            |
| `public/`           | Static assets served as-is; includes sponsor JSON used by the site |
| `vercel.json`       | SPA rewrite: all paths → `index.html`                              |
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

### Admin (Supabase `admin` role)

| Path                       | Page component               |
| -------------------------- | ---------------------------- |
| `/admin/signup`            | `AdminSignup`                |
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
| `/admin/*`                 | Fallback to `AdminDashboard` |

### Hidden

| Path       | Notes                              |
| ---------- | ---------------------------------- |
| `/p/b/6/7` | `Pb` – intentionally obscure route |

Admin layout: many admin screens use shared chrome (`Header`, `PageTitle`, `Footer`) and **`useAdminDashboard`** or equivalent checks (`checkAdminAuthorization` in `auth.ts`) before showing content.

## Feature flags

Flags live in `src/config/feature-flags.json` and are read through **`isFeatureEnabled`** in `src/lib/featureFlags.ts`. Pages and navigation should consult flags before exposing routes or links. Details: [Feature Flags](feature_flags.md).

## Supabase and data model (client usage)

The Supabase client is created in `src/lib/supabase.ts` from **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`**. If either is missing, the client throws at import time with a pointer to the KB.

Tables and resources referenced from `src/lib` (names as in code; RLS and schemas live in Supabase, not in this repo):

| Name                              | Typical use                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------- |
| `profiles`                        | Auth-linked profiles; `role` (e.g. `admin`), `is_superuser` for audit log access |
| `events`                          | Event listings, RSVP settings, active flag                                       |
| `events_rsvp`                     | RSVP rows (email, group, answers, attendance, links to members/events)           |
| `members`                         | Member signup inserts                                                            |
| `student_degree`, `student_major` | Degree/major relations after signup                                              |
| `degrees`, `degree_major`         | Reference data for signup (`degreeData.ts`)                                      |
| `links`                           | Manageable links CRUD                                                            |
| `member_registry`                 | Read model for admin member registry                                             |
| `tasks`, `task_comments`          | Task tracker                                                                     |
| `marketing_requests`              | Marketing portal persistence (alongside external Google Sheet flow)              |
| `admin_audit_log`                 | CMS audit entries; superuser-gated UI                                            |

**Storage buckets (from code):** `event-images` (public URLs for event images), and link-related uploads as implemented in `linksController` (bucket naming in code should be treated as the source of truth).

## Lib layer (“controllers”)

Business logic and data fetching are concentrated under **`src/lib/`** rather than inside large page files. Examples:

- **`auth.ts`** – session check, admin role verification, password reset/update helpers
- **`login.ts`**, **`signup.ts`** – admin auth forms and profile updates
- **`eventsController.ts`** – public active events and date helpers
- **`manageEventsController.ts`**, **`eventsRSVPController.ts`**, **`eventsDashboardController.ts`** – admin CRUD, RSVP submission rules, attendee reporting
- **`memberSignup.ts`**, **`signupController.ts`** – public member registration pipeline
- **`memberRegistryController.ts`** – registry fetch and chart helpers
- **`linksController.ts`** – links management and uploads
- **`taskTrackerController.ts`** – tasks and comments
- **`marketingPortalController.ts`** – marketing requests (Supabase + external POST)
- **`auditLogController.ts`** – superuser check and audit log fetch
- **`emailController.ts`** – invokes Supabase Edge Function `send-email`
- **`posthog.ts`** – analytics init, opt-in/out vs cookie consent
- **`cookieConsentController.ts`** – consent persistence used with cookies UI
- **`pageNotFoundController.ts`** – centralised navigation for 404 behaviour
- **`featureFlags.ts`** – JSON feature flags
- **`slideShowController.ts`**, **`aboutController.ts`**, etc. – page-specific data or UI helpers

Naming is not uniform (`*Controller.ts` vs `use*` hooks in the same file); when extending the app, match the nearest existing feature.

## Email and Edge Functions

The client invokes Supabase Edge Functions by name or URL. Examples referenced in this repo:

| Function                | Invoked from                                                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `send-email`            | `src/lib/emailController.ts` via `supabase.functions.invoke`                                                                 |
| `create-marketing-task` | `src/lib/marketingPortalController.ts` via authenticated `fetch` to `{VITE_SUPABASE_URL}/functions/v1/create-marketing-task` |

Implementation and secrets (e.g. email provider such as Resend) live in the **Supabase project**, not necessarily in this repository.

## Analytics

PostHog is initialised in `src/lib/posthog.ts` with **`VITE_PUBLIC_POSTHOG_KEY`** and **`VITE_PUBLIC_POSTHOG_HOST`**. Capturing is **opt-out by default** until cookie consent is read from `localStorage`. See [Analytics](analytics.md).

## Marketing portal

On submit, `handleMarketingSubmit` in `src/lib/marketingPortalController.ts` runs **in parallel**:

1. **`submitToGoogle`** – POST to the configured **Google Apps Script** URL (`no-cors`) for Sheets automation (see [Marketing Portal](marketingPortal.md)).
2. **`submitToSupabase`** – inserts into **`marketing_requests`** with `created_by` set to the current user, then calls the Supabase Edge Function **`create-marketing-task`** with the session access token.

Both paths must succeed for the handler to complete without throwing; see the controller for error handling and field mapping.

## Build, preview, deploy

Run these from the repo root; they forward to `apps/web`.

- **Develop:** `pnpm dev` (Vite default port, commonly `5173`).
- **Production build:** `pnpm build` runs `tsc` then `vite build`, output in `apps/web/dist`.
- **Preview:** `pnpm preview` serves the production build locally.
- **Vercel:** the project's Root Directory is `apps/web`; `apps/web/vercel.json` rewrites all routes to `index.html` for SPA hosting.

## Environment variables (summary)

| Variable                   | Used for                       |
| -------------------------- | ------------------------------ |
| `VITE_SUPABASE_URL`        | Supabase project URL           |
| `VITE_SUPABASE_ANON_KEY`   | Supabase anon client key       |
| `VITE_PUBLIC_POSTHOG_KEY`  | PostHog project key (optional) |
| `VITE_PUBLIC_POSTHOG_HOST` | PostHog API host (optional)    |

Admin signup/login and any serverless pieces may require additional configuration in Supabase (Auth URLs, email templates, Edge Function secrets). Those settings are **not** stored in this repo.

## Related KB entries

- [Home](home.md) – KB index
- [Changelog](CHANGELOG.md) – commit history from `main`
- [Documentation disclaimer](disclaimer.md)
- [Auth Service](auth.md)
- [Events & RSVP](events_and_rsvp.md)
- [Marketing Portal](marketingPortal.md)
- [Feature Flags](feature_flags.md)
- [Analytics](analytics.md)
- [Commit & Branching Guidelines](commit_guidelines.md)

## Future enhancements

- [ ] Auto-generate route tables from a single source of truth if the app grows further
- [ ] Document Supabase RLS policies and Edge Functions in a secure internal wiki if not open-sourced
