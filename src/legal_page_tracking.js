(function() {
  const COOKIE_CONSENT_KEY = 'aiutodoc_cookie_preferences';
  const LEGACY_COOKIE_CONSENT_KEY = 'aiutodoc_beta_cookie_preferences';

  function readJsonStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
      return null;
    }
  }

  try {
    const legacyPreferences = localStorage.getItem(LEGACY_COOKIE_CONSENT_KEY);
    if (localStorage.getItem(COOKIE_CONSENT_KEY) === null && legacyPreferences !== null) localStorage.setItem(COOKIE_CONSENT_KEY, legacyPreferences);
    localStorage.removeItem(LEGACY_COOKIE_CONSENT_KEY);
  } catch (error) {}

  function loadGoogleAnalytics() {
    if (typeof window.aiutodocApplyAnalyticsConsent === 'function') {
      window.aiutodocApplyAnalyticsConsent();
    }
  }

  document.addEventListener('DOMContentLoaded', function() {
    const storedCookiePreferences = readJsonStorage(COOKIE_CONSENT_KEY);
    const storedCookieExpired = storedCookiePreferences && Date.parse(storedCookiePreferences.expiresAt || '') <= Date.now();

    if (storedCookiePreferences && !storedCookieExpired && storedCookiePreferences.analytics === true) {
      loadGoogleAnalytics();
    }
  });
})();
