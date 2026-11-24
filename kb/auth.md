# Auth Service

Execs log in with **Supabase Auth**. Whether someone is an exec is decided by the **DEVS API** from the database on every request, never by the browser. There is no public admin signup: superusers invite new execs.

## Purpose

- Exec login and logout
- Password reset by email
- Admin-only pages for execs, and superuser-only tools (audit log, inviting execs)

## Environment variables

The website's `apps/web/.env` needs:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Find them in the Supabase dashboard under **Settings** → **API**. The anon key is public by design: it can log people in, but it can't read or write any table.

> **Note:** `.env` is in `.gitignore`. Never commit it.

## How login works

`handleLoginSubmit` in `apps/web/src/lib/login.ts`:

1. Calls `supabase.auth.signInWithPassword()` with the email and password.
2. Calls `GET /api/me` through `fetchMe()` in `apps/web/src/lib/api.ts`. The API reads the caller's role from `public.profiles`.
3. If the role isn't `admin`, signs the user out and shows "You do not have access".
4. Otherwise clears the form and goes to `/admin/dashboard`.

```
User submits form
    ↓
supabase.auth.signInWithPassword()
    ↓
GET /api/me  (API reads the role from profiles)
    ↓
role === 'admin' ? → /admin/dashboard
                 : → sign out, "You do not have access"
```

Admin pages call `checkAdminAuthorization()` in `apps/web/src/lib/auth.ts`, which repeats the same `/api/me` check for an existing session.

Every API call sends the Supabase access token as a `Bearer` header (`api.ts` adds it). The API checks the token and reads the role again on every request, so removing someone's `admin` role ends their access straight away.

## Password reset

- `handlePasswordReset(email)` sends a Supabase reset email that links to `/admin/reset-password`.
- `handlePasswordUpdate(newPassword)` sets the new password (minimum 6 characters).

## Adding execs

Superusers invite execs with `POST /api/admin/users/invite`. The API creates the login through Supabase Auth and sends the invite email. There is no page for this yet.

## Pages

| Route                   | Component                                         | What it does                           |
| ----------------------- | ------------------------------------------------- | -------------------------------------- |
| `/admin/login`          | `apps/web/src/pages/admin/AdminLogin.tsx`         | Login and "forgot password"            |
| `/admin/reset-password` | `apps/web/src/pages/admin/AdminResetPassword.tsx` | Set a new password from the email link |

## Error messages

- `"Invalid email or password"`: Supabase rejected the login.
- `"You do not have access"`: logged in, but not an exec.
- `"Please enter a valid email address"`: reset form email is malformed.
- `"Password must be at least 6 characters long"`: new password too short.

## Security

1. **Roles live in the database.** Only the API reads `profiles.role` and `profiles.is_superuser`. The browser can't change them (migration `V20261026_0300` closed that hole).
2. **Never commit `.env`**, and never put the Supabase service role key in the website's env. Only the API has it.
3. **Email confirmation** should stay enabled in the Supabase Auth settings.
4. **Rate limiting:** Supabase limits auth endpoints; the API limits public writes per IP.

## Future enhancements

- [ ] A page for superusers to invite execs
- [ ] Two-factor authentication (2FA)
- [ ] Stronger password requirements
