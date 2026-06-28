(function() {
  const COOKIE_CONSENT_KEY = 'aiutodoc_cookie_preferences';
  const GA_MEASUREMENT_ID = 'G-9C1TRG2K0X';

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
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) return false;

    return preferences.analytics === true;
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

  ensureGtagStub();

  let analyticsConsentGranted = hasValidAnalyticsConsent();

  // The tag is always detectable, but measurement remains disabled until consent.
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: analyticsConsentGranted ? 'granted' : 'denied',
    wait_for_update: analyticsConsentGranted ? 0 : 500
  });
  window.gtag('set', 'ads_data_redaction', true);
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    send_page_view: analyticsConsentGranted
  });
  ensureGoogleTagScript();

  window.__aiutodocGaConfigured = true;
  window.__aiutodocGaLoaded = true;

  window.aiutodocSetAnalyticsConsent = function(granted) {
    const shouldGrant = granted === true;

    window.gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: shouldGrant ? 'granted' : 'denied'
    });

    if (shouldGrant && !analyticsConsentGranted) {
      window.gtag('event', 'page_view', {
        page_location: window.location.href,
        page_title: document.title
      });
    }

    analyticsConsentGranted = shouldGrant;
  };

  window.aiutodocApplyAnalyticsConsent = function() {
    window.aiutodocSetAnalyticsConsent(true);
  };
})();
