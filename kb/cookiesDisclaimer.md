# Cookie Disclaimer Component

The **CookieDisclaimer** (`CookiesDisclaimer.tsx`) is a **fixed bottom banner** that asks visitors to accept or decline cookies. It ties into **localStorage** consent and **PostHog** opt-in / opt-out via `cookieConsentController`.

## Purpose

- Meet expectations for cookie / analytics consent UX
- Persist choice so the banner does not reappear after a decision
- Gate display on the **`cookie_consent_is_enabled`** feature flag

## Behaviour

1. On mount, if **`getCookieConsent()`** returns no stored value, the banner becomes visible.
2. **Accept** → `acceptCookies()` (writes consent, PostHog **opt in**), banner hides.
3. **Decline** → `declineCookies()` (writes consent, PostHog **opt out**), banner hides.
4. If the feature flag is off, the component returns **`null`** (nothing rendered).

## Integration

Mounted once in **`App.tsx`** so it appears across routes. It sits above the main content with a high `z-index`.

## Copy and links

The banner text references analytics / traffic and links to **`/privacy-policy`** (opens in a new tab).

## Styling notes

Action buttons currently use **inline Tailwind** styles; commented blocks in source reference future **PixelatedButton** usage.

## Related

- `src/lib/cookieConsentController.ts` – `getCookieConsent`, `acceptCookies`, `declineCookies`
- [Analytics](analytics.md) – PostHog setup
- [Feature Flags](feature_flags.md) – `cookie_consent_is_enabled`
