# Auth Service

The **Auth Service** provides authentication functionality for admin users through Supabase Auth. It handles user signup and login with role-based access control, ensuring only users with the `admin` role can access protected admin areas.

## Purpose

- Admin user registration with email verification
- Secure admin login with role validation
- Email domain validation during signup
- Profile management integration with Supabase

## Supabase Setup Requirements

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Where to find these values:**

- Go to your Supabase project dashboard
- Navigate to **Settings** → **API**
- Copy the **Project URL** (for `VITE_SUPABASE_URL`)
- Copy the **anon/public** key (for `VITE_SUPABASE_ANON_KEY`)

> **Note:** The `.env` file is already in `.gitignore` to prevent committing sensitive credentials.

## How Signup Works

The signup flow (`handleSignupSubmit` in `src/lib/signup.ts`) follows these steps:

### 1. Client-Side Validation

- **Username validation:** Ensures username is provided and not empty
- **Password matching:** Verifies password and confirm password match
- **Password length:** Requires minimum 6 characters
- **Email format:** Validates email format using regex

### 2. Email Domain Verification

- Extracts domain from email address
- Queries Google DNS API to verify the domain has MX records
- Prevents signup with invalid or non-existent email domains

### 3. Supabase Account Creation

- Calls `supabase.auth.signUp()` with email and password
- Includes username in user metadata (`options.data.username`)
- Handles Supabase-specific errors (e.g., email already exists)

### 4. Profile Creation

- After successful signup, updates the `profiles` table
- Sets the `username` field from the signup form
- Links profile to the authenticated user via `id`

### 5. Success Handling

- Displays success message prompting user to check email
- Clears all form fields
- User must confirm email before logging in (if email confirmation is enabled)

### Signup Flow Diagram

```
User submits form
    ↓
Client-side validation (username, password, email format)
    ↓
Email domain verification (DNS check)
    ↓
Supabase auth.signUp()
    ↓
Update profiles table with username
    ↓
Success: Clear form, show success message
```

## How Login Works

The login flow (`handleLoginSubmit` in `src/lib/login.ts`) follows these steps:

### 1. Authentication

- Calls `supabase.auth.signInWithPassword()` with email and password
- Validates credentials against Supabase Auth

### 2. Role Verification

- Queries the `profiles` table to fetch user's role
- Verifies the role is `'admin'`
- If role is not `'admin'`, signs out the user and shows error

### 3. Success Handling

- Clears form fields
- Currently logs success
- User is now authenticated and can access protected routes

### Login Flow Diagram

```
User submits form
    ↓
supabase.auth.signInWithPassword()
    ↓
Query profiles table for user role
    ↓
Verify role === 'admin'
    ↓
Success: Clear form, redirect to dashboard (TODO)
```

## Pages

### Admin Signup Page

**Route:** `/admin/signup`

**Component:** `src/pages/admin/AdminSignup.tsx`

**Features:**

- Two-column form layout (name/email, password/confirm password)
- Real-time password matching validation
- Email domain verification
- Success message after signup
- Error handling with user-friendly messages

### Admin Login Page

**Route:** `/admin/login`

**Component:** `src/pages/admin/AdminLogin.tsx`

**Features:**

- Role-based access control (admin only)
- Error handling for invalid credentials
- Loading states during authentication

## Error Handling

Both signup and login handlers provide error messages:

**Common Signup Errors:**

- `"Please enter your name"` - Username validation failed
- `"Passwords do not match"` - Password confirmation mismatch
- `"Password must be at least 6 characters long"` - Password too short
- `"Please enter a valid email address"` - Invalid email format
- `"This email domain does not exist or cannot receive emails"` - DNS verification failed
- Supabase-specific errors (e.g., email already exists)

**Common Login Errors:**

- `"Invalid email or password"` - Authentication failed
- `"Failed to verify user role"` - Profile lookup failed
- `"You do not have access"` - User does not have admin role

## Security Considerations

1. **Environment Variables:** Never commit `.env` file to version control
2. **Role Verification:** Always verify user roles server-side for sensitive operations
3. **Email Confirmation:** Enable email confirmation in Supabase for production
4. **Password Requirements:** Currently minimum 6 characters; need to consider implementing stronger requirements
5. **Rate Limiting:** Supabase provides built-in rate limiting for auth endpoints

## Future Enhancements

- [ ] Password reset functionality
- [ ] Two-factor authentication (2FA)
- [ ] Stronger password requirements (uppercase, numbers, special characters)
- [ ] Account lockout after failed login attempts
