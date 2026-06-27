(function() {
  const COOKIE_CONSENT_KEY = 'aiutodoc_cookie_preferences';
  const GA_MEASUREMENT_ID = 'G-9C1TRG2K0X';

  function readJsonStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
      return null;
    }
  }

  function loadGoogleAnalytics() {
    if (window.__aiutodocGaLoaded) return;
    window.__aiutodocGaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){ window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true });

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  document.addEventListener('DOMContentLoaded', function() {
    const storedCookiePreferences = readJsonStorage(COOKIE_CONSENT_KEY);
    const storedCookieExpired = storedCookiePreferences && Date.parse(storedCookiePreferences.expiresAt || '') <= Date.now();

    if (storedCookiePreferences && !storedCookieExpired && storedCookiePreferences.analytics === true) {
      loadGoogleAnalytics();
    }
  });
})();
