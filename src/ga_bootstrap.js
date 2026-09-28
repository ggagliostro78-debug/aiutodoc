(function() {
  const COOKIE_CONSENT_KEY = 'aiutodoc_cookie_preferences_ga4_v1';
  const ANALYTICS_CONSENT_VERSION = '2026-09-28-ga4-v1';
  // The GA4 measurement ID is a public identifier, not a credential. Keep the
  // optional window override for controlled tests, while making Analytics work
  // on every public page that loads this shared bootstrap.
  const GA_MEASUREMENT_ID = Object.prototype.hasOwnProperty.call(window, 'AIUTODOC_ANALYTICS_ID')
    ? window.AIUTODOC_ANALYTICS_ID
    : 'G-9C1TRG2K0X';

  function readJsonStorage(key) {
    try {
      return JSON.parse(window.localStorage.getItem(key) || 'null');
    } catch (error) {
      return null;
    }
  }

  function hasValidAnalyticsConsent() {
    const preferences = readJsonStorage(COOKIE_CONSENT_KEY);
    if (!preferences) return false;

    const expiresAt = Date.parse(preferences.expiresAt || '');
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

    return preferences.analytics === true && preferences.consentVersion === ANALYTICS_CONSENT_VERSION;
  }

  function ensureGtagStub() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function() {
      window.dataLayer.push(arguments);
    };
  }

  function ensureGoogleTagScript() {
    if (document.querySelector('script[data-aiutodoc-ga-loader="true"]')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    script.dataset.aiutodocGaLoader = 'true';
    document.head.appendChild(script);
  }

  let analyticsConsentGranted = hasValidAnalyticsConsent();
  let analyticsConfigured = false;

  function initializeGoogleAnalytics() {
    if (!GA_MEASUREMENT_ID) return;
    if (analyticsConfigured) { window.gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' }); return; }

    ensureGtagStub();
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    });
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      send_page_view: true
    });
    ensureGoogleTagScript();

    analyticsConfigured = true;
    window.__aiutodocGaConfigured = true;
    window.__aiutodocGaLoaded = true;
  }

  window.__aiutodocGaConfigured = false;
  window.__aiutodocGaLoaded = false;

  window.aiutodocSetAnalyticsConsent = function(granted) {
    const shouldGrant = granted === true;

    if (shouldGrant) {
      initializeGoogleAnalytics();
    } else if (analyticsConfigured && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied'
      });
    }

    analyticsConsentGranted = shouldGrant;
  };

  window.aiutodocApplyAnalyticsConsent = function() {
    window.aiutodocSetAnalyticsConsent(true);
  };

  if (analyticsConsentGranted) {
    initializeGoogleAnalytics();
  }
})();
