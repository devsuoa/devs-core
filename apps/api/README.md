# DEVS API

The only service that reads and writes the DEVS database and file storage. The website calls
this API; it no longer talks to Supabase tables, storage or edge functions directly. Supabase
is still used for logging in (Auth), Postgres and Storage.

Java 25, Spring Boot 4, plain SQL through `JdbcClient`. Database changes live in
[`db/migrations`](../../db/migrations) and are applied by Flyway in CI, never by the API.

## Run it locally

With Docker:

```sh
docker compose up --build        # from the repo root
```

This starts a Supabase Postgres on `localhost:54330`, applies every migration, loads fake data
from [`db/seed/dev_seed.sql`](../../db/seed/dev_seed.sql), and runs the API on
`http://localhost:8080`. `docker compose down -v` wipes it.

There's no Supabase Auth in the local stack, so mint a token for one of the seeded users:

```sh
curl localhost:8080/api/events
curl -H "Authorization: Bearer $(apps/api/scripts/dev-token.sh admin)" localhost:8080/api/admin/members
```

`pnpm dev` proxies `/api` to `localhost:8080`, so the website's public pages work against the
local API. Admin pages need a real login: point the API at the shared dev Supabase project
instead (set `SUPABASE_URL` and `SUPABASE_JWT_SECRET` to the dev project's values).

Without Docker, use the Maven wrapper with Java 25 installed: `./mvnw spring-boot:run`, with the
environment variables below pointing at the dev database.

## Tests

```sh
./mvnw verify
```

The integration tests start a Supabase Postgres with Testcontainers, so they need Docker; without
it they're skipped. CI always runs them. `SecurityMatrixTest` walks every endpoint and checks that
anonymous callers get 401 and non-admins get 403, so a new endpoint is covered automatically.

## Configuration

| Variable                                           | What it is                                                                                     |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `DB_URL`, `DB_USER`, `DB_PASSWORD`                 | Postgres connection. Connect as `api_app` (see below), never `postgres`.                       |
| `SUPABASE_URL`                                     | The project's URL, e.g. `https://<ref>.supabase.co`. Tokens must be issued by `<url>/auth/v1`. |
| `SUPABASE_JWT_SECRET`                              | Legacy HS256 JWT secret. Leave empty if the project uses signing keys (JWKS).                  |
| `SUPABASE_SERVICE_ROLE_KEY`                        | Server-only key for Storage and inviting execs. Never put it in the website's env.             |
| `SITE_URL`                                         | The website's address, used for Stripe and invite redirects.                                   |
| `CORS_ALLOWED_ORIGINS`                             | Comma-separated origins allowed to call the API.                                               |
| `STORAGE_MODE`                                     | `supabase` (default) or `local` (Docker dev).                                                  |
| `EMAIL_MODE`, `RESEND_API_KEY`, `CONTACT_EMAIL_TO` | `resend` sends mail; `log` only logs it.                                                       |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`       | Card payments. The webhook endpoint is `/api/webhooks/stripe`.                                 |
| `MARKETING_APPS_SCRIPT_URL`                        | The Google Apps Script that writes marketing requests to the sheet.                            |
| `FORWARD_HEADERS_STRATEGY`                         | `native` behind a proxy that sets `X-Forwarded-For`, so rate limits see real IPs.              |

### The `api_app` database role

Migration `V20261026_0310__api_role.sql` creates `api_app` with grants on exactly the tables the
API uses. It has no password until you set one, once per project, in the SQL editor:

```sql
alter role api_app with password '<generate a long random one>';
```

Then connect through the session pooler as `api_app.<project ref>`.

## How a request is handled

1. CORS, security headers, and a per-IP rate limit on public writes (sign up, RSVP, contact).
2. A bearer token, if sent, must be a Supabase user access token for this project: valid
   signature, issuer, audience `authenticated`, role `authenticated`, not expired.
3. The caller's role is read from `public.profiles` on every request. Nothing in the token or
   request body can make someone an admin.
4. `SecurityConfig` decides who may call each path. Anything not listed is denied.
5. Request bodies are validated (types, sizes, formats) before any code runs.
6. Writes run in a transaction that first tells Postgres who the caller is (`ActorContext`), so the
   existing audit triggers keep recording the real person.
7. Errors come back as `{ status, code, detail }`. No stack traces, SQL or internal names.

## Endpoints

Public: `GET /api/events`, `GET /api/links`, `GET /api/degrees`, `GET /api/degrees/{id}/majors`,
`POST /api/members`, `POST /api/events/{id}/rsvps`, `POST /api/events/{id}/rsvps/bank-transfer`,
`POST /api/events/{id}/rsvps/checkout`, `POST /api/contact`, `POST /api/webhooks/stripe` (Stripe-signed).

Logged in: `GET /api/me`.

Execs (`/api/admin/**`): events, uploads, attendees and payment proofs, members, links, event
to-dos/notes/doc links, tasks and comments, marketing requests.

Superusers: `/api/admin/audit-log/**` (view and restore) and `/api/admin/users/invite`.
