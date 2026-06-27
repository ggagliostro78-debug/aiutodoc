(function() {
  const COOKIE_CONSENT_KEY = 'aiutodoc_cookie_preferences';
  const GA_MEASUREMENT_ID = 'G-9C1TRG2K0X';
  const FORCE_COOKIE_PREFERENCES_KEY = 'aiutodoc_open_cookie_preferences';

  function readJsonStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (error) {
      return null;
    }
  }

  function writeJsonStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function readStorageValue(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function removeStorageValue(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {}
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

  function applyCookiePreferences(preferences) {
    if (preferences && preferences.analytics === true) {
      loadGoogleAnalytics();
    }
  }

  function ensureBannerStyles() {
    if (document.getElementById('legal-cookie-banner-style')) return;

    const style = document.createElement('style');
    style.id = 'legal-cookie-banner-style';
    style.textContent = `
      .legal-cookie-banner {
        position: fixed;
        left: 16px;
        right: 16px;
        bottom: 16px;
        z-index: 9999;
        background: #ffffff;
        border: 1px solid #d8eeee;
        border-radius: 12px;
        box-shadow: 0 18px 40px rgba(18, 49, 58, 0.18);
        padding: 18px;
        max-width: 720px;
        margin: 0 auto;
      }
      .legal-cookie-banner.hidden {
        display: none;
      }
      .legal-cookie-banner h2 {
        margin: 0 0 8px;
        color: #0F5464;
        font-size: 1.05rem;
      }
      .legal-cookie-banner p {
        margin: 0 0 12px;
        color: #111111;
        font-size: 0.95rem;
        line-height: 1.5;
      }
      .legal-cookie-banner label {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        margin-bottom: 12px;
        font-size: 0.94rem;
      }
      .legal-cookie-banner-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .legal-cookie-banner-actions button {
        appearance: none;
        border: 0;
        border-radius: 999px;
        padding: 10px 16px;
        font: inherit;
        cursor: pointer;
      }
      .legal-cookie-accept {
        background: #0F5464;
        color: #ffffff;
      }
      .legal-cookie-reject {
        background: #e8f5f5;
        color: #0F5464;
      }
    `;
    document.head.appendChild(style);
  }

  function buildBanner() {
    ensureBannerStyles();
    if (document.getElementById('legal-cookie-banner')) return document.getElementById('legal-cookie-banner');

    const banner = document.createElement('section');
    banner.id = 'legal-cookie-banner';
    banner.className = 'legal-cookie-banner hidden';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Preferenze cookie');
    banner.innerHTML = `
      <h2>Preferenze cookie</h2>
      <p>Usiamo cookie tecnici necessari al funzionamento del sito. I cookie analytics vengono caricati solo con il tuo consenso.</p>
      <label>
        <input type="checkbox" id="legal-cookie-analytics">
        <span>Cookie analytics per statistiche aggregate</span>
      </label>
      <div class="legal-cookie-banner-actions">
        <button type="button" class="legal-cookie-accept" id="legal-cookie-accept">Accetta analytics</button>
        <button type="button" class="legal-cookie-reject" id="legal-cookie-reject">Rifiuta analytics</button>
      </div>
    `;
    document.body.appendChild(banner);

    const checkbox = banner.querySelector('#legal-cookie-analytics');
    const accept = banner.querySelector('#legal-cookie-accept');
    const reject = banner.querySelector('#legal-cookie-reject');

    accept.addEventListener('click', function() {
      saveCookiePreferences({ analytics: checkbox && checkbox.checked !== false });
    });
    reject.addEventListener('click', function() {
      saveCookiePreferences({ analytics: false });
    });

    return banner;
  }

  function hideCookieBanner() {
    const banner = buildBanner();
    banner.classList.add('hidden');
  }

  function showCookieBanner() {
    const banner = buildBanner();
    const saved = readJsonStorage(COOKIE_CONSENT_KEY);
    const checkbox = banner.querySelector('#legal-cookie-analytics');
    if (checkbox) checkbox.checked = !!(saved && saved.analytics);
    banner.classList.remove('hidden');
  }

  function saveCookiePreferences(preferences) {
    const record = {
      necessary: true,
      analytics: preferences.analytics === true,
      marketing: false,
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
    };
    writeJsonStorage(COOKIE_CONSENT_KEY, record);
    applyCookiePreferences(record);
    hideCookieBanner();
  }

  document.addEventListener('DOMContentLoaded', function() {
    const storedCookiePreferences = readJsonStorage(COOKIE_CONSENT_KEY);
    const storedCookieExpired = storedCookiePreferences && Date.parse(storedCookiePreferences.expiresAt || '') <= Date.now();
    const forceCookiePreferences = readStorageValue(FORCE_COOKIE_PREFERENCES_KEY) === '1';

    if (forceCookiePreferences) {
      removeStorageValue(FORCE_COOKIE_PREFERENCES_KEY);
      showCookieBanner();
      return;
    }

    if (storedCookiePreferences && !storedCookieExpired) {
      applyCookiePreferences(storedCookiePreferences);
      return;
    }

    showCookieBanner();
  });
})();
