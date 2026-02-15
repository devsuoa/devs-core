import posthog from 'posthog-js';

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || '';
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || '';

const COOKIE_CONSENT_KEY = 'cookieConsent';

let isInitialized = false;

if (posthogKey && posthogHost) {
  const apiHost = posthogHost.startsWith('http') 
    ? posthogHost 
    : `https://${posthogHost}`;

  posthog.init(posthogKey, {
    api_host: apiHost,
    ui_host: apiHost,
    cross_subdomain_cookie: false,
    persistence: 'localStorage+cookie',
    opt_out_capturing_by_default: true,
    loaded: () => {
      isInitialized = true;
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (consent === 'accepted') posthog.opt_in_capturing();
      else if (consent === 'declined') posthog.opt_out_capturing();
      if (import.meta.env.DEV) {
        console.log('Analytics initialized');
      }
    },
  });
} else if (import.meta.env.DEV) {
  console.warn(
    'Analytics not initialized.'
  );
}

export { posthog, isInitialized };

