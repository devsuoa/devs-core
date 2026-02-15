import { posthog } from './posthog';

const COOKIE_CONSENT_KEY = 'cookieConsent';

export type CookieConsentStatus = 'accepted' | 'declined' | null;

/**
 * Get the current cookie consent status from localStorage.
 */
export function getCookieConsent(): CookieConsentStatus {
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === 'accepted' || value === 'declined') {
    return value;
  }
  return null;
}

/**
 * Accept cookies: persist consent and opt in to PostHog data collection.
 */
export function acceptCookies(): void {
  localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
  posthog.opt_in_capturing();
}

/**
 * Decline cookies: persist consent and opt out of PostHog data collection.
 */
export function declineCookies(): void {
  localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
  posthog.opt_out_capturing();
}

