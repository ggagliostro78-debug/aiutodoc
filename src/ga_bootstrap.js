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
    const storedCookiePreferences = readJsonStorage(COOKIE_CONSENT_KEY);
    if (!storedCookiePreferences) return false;

    const expiresAt = Date.parse(storedCookiePreferences.expiresAt || '');
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) return false;

    return storedCookiePreferences.analytics === true;
  }

  function ensureGtagStub() {
    window.dataLayer = window.dataLayer || [];

    if (typeof window.gtag !== 'function') {
      window.gtag = function() {
        window.dataLayer.push(arguments);
      };
    }
  }

  function ensureGoogleTagScript() {
    if (document.querySelector('script[data-aiutodoc-ga-loader="true"]')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    script.dataset.aiutodocGaLoader = 'true';
    document.head.appendChild(script);
  }

  function configureGoogleAnalytics() {
    ensureGtagStub();
    ensureGoogleTagScript();

    if (!window.__aiutodocGaConfigured) {
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });
      window.__aiutodocGaConfigured = true;
    }

    window.__aiutodocGaLoaded = true;
  }

  window.aiutodocApplyAnalyticsConsent = function() {
    configureGoogleAnalytics();
  };

  function initAnalyticsFromStoredConsent() {
    if (hasValidAnalyticsConsent()) {
      configureGoogleAnalytics();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalyticsFromStoredConsent, { once: true });
  } else {
    initAnalyticsFromStoredConsent();
  }
})();
