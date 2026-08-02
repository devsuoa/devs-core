# Analytics Service

The **Analytics Service** provides website analytics and user behavior tracking through PostHog. It automatically tracks pageviews as users navigate the application and provides a foundation for custom event tracking throughout the application.

## Purpose

- Automatic pageview tracking for all routes
- User behavior analytics and insights
- Foundation for custom event tracking
- Privacy-compliant analytics with PostHog

## PostHog Setup Requirements

### 1. Environment Variables

Create a `.env` file in the project root with the following variables:

```env
VITE_PUBLIC_POSTHOG_KEY=your_posthog_project_api_key
VITE_PUBLIC_POSTHOG_HOST=your_posthog_host_url
```

**Where to find these values:**

For **PostHog Cloud (US)**:

- Go to your PostHog project dashboard
- Navigate to **Project Settings** → **Project API Key**
- Copy the **Project API Key** (for `VITE_PUBLIC_POSTHOG_KEY`)
- Use `https://us.i.posthog.com` (for `VITE_PUBLIC_POSTHOG_HOST`)

> **Note:** The `.env` file is already in `.gitignore` to prevent committing sensitive credentials.

### 2. Host URL Format

The host URL should:

- Include the `https://` protocol
- Not have a trailing slash

**Examples:**

```env
# PostHog Cloud US
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# PostHog Cloud EU
VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

> **Note:** We use Posthog US Host

## How Analytics Works

### 1. Initialization

The PostHog client is initialized in `src/lib/posthog.ts` when the application starts:

- Reads environment variables (`VITE_PUBLIC_POSTHOG_KEY` and `VITE_PUBLIC_POSTHOG_HOST`)
- Automatically adds `https://` protocol if not provided
- Initializes PostHog with configuration for cross-domain support and persistence
- Only initializes if both environment variables are present

### 2. Automatic Pageview Tracking

Pageviews are automatically tracked when users navigate between routes:

- The `PageViewTracker` component in `src/App.tsx` uses React Router's `useLocation` hook
- Tracks a `$pageview` event whenever the route changes
- Works seamlessly with React Router navigation (both programmatic and browser navigation)

### 3. Initialization Flow

```
Application starts (main.tsx)
    ↓
Import posthog.ts
    ↓
Check environment variables
    ↓
Initialize PostHog client
    ↓
App renders with PageViewTracker
    ↓
Track pageview on initial load
    ↓
Track pageview on each route change
```

## Viewing Analytics in PostHog

### Accessing Your PostHog Dashboard

1. Log in to the DEVS PostHog account at the US PostHog host URL
2. Navigate to the project dashboard

### Key Metrics Available

- **Pageviews:** Total number of pageviews across all routes
- **Unique Visitors:** Number of unique users visiting the site
- **Page Performance:** Which pages are most visited
- **User Flow:** How users navigate between pages
- **Session Duration:** How long users stay on the site

### Viewing Specific Routes

To filter by specific routes in PostHog:

1. In the Insights view, add a filter
2. Select **Property** → **$current_url**
3. Use operators like:
   - `contains` - to match routes (e.g., contains `/admin/`)
   - `equals` - to match exact URLs
   - `regex` - for pattern matching

**Example filters:**

- All admin pages: `$current_url contains /admin/`
- Marketing portal: `$current_url equals /admin/marketing-request`
- Home page: `$current_url equals /`

### User Sessions and Behavior

PostHog automatically tracks:

- **User Sessions:** Groups pageviews into sessions
- **User Identification:** Tracks users across sessions (when identified)
- **Device Information:** Browser, OS, device type
- **Geographic Data:** Country, city (if enabled)

## Custom Event Tracking

You can track custom events throughout the application by importing the PostHog instance:

```typescript
import { posthog } from "./lib/posthog";

// Track a custom event
posthog.capture("button_clicked", {
  button_name: "Marketing Portal",
  page: "/admin/dashboard",
});

// Track with user properties
posthog.capture("form_submitted", {
  form_type: "marketing_request",
  post_type: "event",
});
```

### Common Use Cases

- **Button Clicks:** Track which buttons users click most
- **Form Submissions:** Track form completion rates
- **Feature Usage:** Track which features are used most
- **Error Tracking:** Track errors and exceptions
- **Conversion Events:** Track important user actions

## Implementation Details

### Files Involved

- **`src/lib/posthog.ts`** - PostHog client initialization and configuration
- **`src/main.tsx`** - Imports PostHog configuration on app startup
- **`src/App.tsx`** - Contains `PageViewTracker` component for automatic pageview tracking

### Configuration Options

The PostHog client is configured with:

- **`api_host`:** API endpoint for sending events
- **`ui_host`:** UI endpoint (same as API host for CORS compatibility)
- **`cross_subdomain_cookie`:** Disabled for single-domain tracking
- **`persistence`:** Uses both localStorage and cookies for reliable tracking

## Security Considerations

1. **API Key Security:** The PostHog API key is public (designed for client-side use) but should still be kept private
2. **Privacy Compliance:** PostHog is GDPR compliant and can be configured for privacy requirements
3. **Data Retention:** Configure data retention policies in PostHog settings
4. **IP Anonymization:** Can be enabled in PostHog settings for additional privacy

## Troubleshooting

### Analytics Not Initializing

If analytics aren't working:

1. **Check Environment Variables:**
   - Verify `.env` file exists in project root
   - Ensure variables are prefixed with `VITE_PUBLIC_`
   - Restart dev server after adding/changing `.env` variables

2. **Check Browser Console:**
   - Look for "Analytics initialized" message in dev mode
   - Check for CORS errors (may indicate incorrect host URL)
   - Verify no ad blockers are blocking PostHog requests

3. **Verify PostHog Configuration:**
   - Ensure host URL includes `https://` protocol
   - Verify API key is correct in PostHog dashboard
   - Check that PostHog project is active

### CORS Errors

If you see CORS errors:

- Ensure `VITE_PUBLIC_POSTHOG_HOST` includes the full URL with `https://`
- For PostHog Cloud, use `https://us.i.posthog.com` or `https://eu.i.posthog.com`
- Check browser console for specific error messages
- Verify network/firewall settings aren't blocking requests

## Future Enhancements

- [ ] Custom event tracking for form submissions
- [ ] Custom event tracking for button clicks
- [ ] Funnel analysis for admin workflows
- [ ] Feature flags integration
