(function() {
  const COOKIE_CONSENT_KEY = 'aiutodoc_cookie_preferences';

  function readJsonStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
      return null;
    }
  }

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
