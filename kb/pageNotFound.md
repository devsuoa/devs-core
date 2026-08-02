# Page Not Found Handling

The **Page Not Found** page provides a consistent way to handle invalid, inaccessible, or restricted routes across the application. It ensures users are redirected to a safe fallback page instead of seeing broken UI or partial content.

This system is commonly used alongside **feature flags**, **access control**, and **route validation**.

## Purpose

- Handle invalid or unknown routes
- Block access to disabled pages
- Prevent users from viewing unfinished or restricted content
- Provide a consistent fallback experience
- Avoid rendering UI when access should not be allowed

## Core Concepts

The Page Not Found system consists of two parts:

1. **PageNotFound page** – the UI shown to the user
2. **`onPageNotFound()` controller** – a redirect helper

## PageNotFound Page

### Route

```
/404
```

### Component

```
src/pages/PageNotFound.tsx
```

### Responsibilities

- Display a user-friendly “page not found” message
- Act as the final fallback for:
  - Invalid URLs
  - Disabled features
  - Restricted pages

- Provide a consistent experience regardless of how the user reached the page

## Route-Level Fallback

The router includes a catch-all route:

```tsx
<Route path="*" element={<PageNotFound />} />
```

This ensures that **any unknown route** automatically resolves to the Page Not Found page.

## Programmatic Redirect: `onPageNotFound()`

### Location

```
src/lib/pageNotFoundController.tsx
```

### Purpose

`onPageNotFound()` allows pages to **redirect programmatically** to the 404 page when access should be blocked at runtime.

Common use cases include:

- Feature flags
- Permission checks
- Invalid state detection

## When to Use Page Not Found

Use the Page Not Found system when:

- A page is behind a **disabled feature flag**
- A user tries to access a page that is not ready for public use
- A route exists in code but should not be accessible
- Access depends on runtime conditions (e.g. environment, role, config)
- You want to block rendering without exposing partial UI

## How It Works with Feature Flags

When a feature flag is disabled, the page should:

1. Redirect to the 404 page
2. Render nothing

This prevents:

- UI flashes
- Hooks running unnecessarily
- Incomplete content appearing briefly

## Correct Usage Pattern

### Inside a Page Component

```tsx
React.useEffect(() => {
  if (!isFeatureEnabled("links_page_is_enabled")) {
    onPageNotFound();
  }
}, []);

if (!isFeatureEnabled("links_page_is_enabled")) {
  return null;
}
```

### Why this pattern is required

- Navigation is a **side effect** and must run inside `useEffect`
- Rendering must remain **pure**
- Returning `null` prevents any UI from rendering while redirecting

## Important Rules ⚠️

- Never call `onPageNotFound()` during render
- Never trigger navigation inside TSX
- Always pair `onPageNotFound()` with `return null`
- Do not rely on navigation alone to block access — always prevent rendering

Breaking these rules can cause:

- React warnings
- Infinite re-renders
- UI flickering
- Unexpected navigation behaviour

## Page Not Found vs Hiding Navigation Links

These serve different purposes and should be used together:

| Scenario                      | Solution                      |
| ----------------------------- | ----------------------------- |
| Feature should not be visible | Hide the navigation link      |
| User manually visits the URL  | Redirect to Page Not Found    |
| Page is disabled but merged   | Feature flag + Page Not Found |
| Unknown route                 | Catch-all `*` route           |

## Summary

- Page Not Found is the **default safety net** for inaccessible pages
- Use it for disabled features, invalid routes, and restricted access
- Always redirect via `useEffect`
- Always prevent rendering with `return null`
- Combine with feature flags for full protection

This ensures the application remains stable, predictable, and production-safe even when unfinished work is merged into `main`.
