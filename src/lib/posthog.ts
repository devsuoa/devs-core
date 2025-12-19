import posthog from 'posthog-js';

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY || '';
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || '';

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
    loaded: () => {
      isInitialized = true;
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

