const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const indexPath = path.join(root, "index.html");
const indexHtml = fs.readFileSync(indexPath, "utf8");

function matchOrThrow(regex, label) {
  const match = indexHtml.match(regex);
  if (!match) {
    throw new Error(`Impossibile trovare la sezione ${label} in index.html`);
  }
  return match[0];
}

function absolutize(html) {
  return html.replaceAll('src="./', 'src="/').replaceAll('href="./', 'href="/');
}

function revealStandaloneSection(html) {
  return html
    .replace(/class="tab-content hidden-section info-section specialty-detail-section"/g, 'class="info-section specialty-detail-section"')
    .replace(/class="tab-content hidden-section info-section"/g, 'class="info-section"');
}

function buildStandaloneHeader(activeKey) {
  const activeLabels = {
    about: "Chi Siamo",
    specialists: "Per gli Specialisti",
    glossary: "Glossario",
    specializations: "Specializzazioni",
    recovery: "Recupera ricerca"
  };

  let header = absolutize(matchOrThrow(/<header class="chat-header">[\s\S]*?<\/header>/, "header"));

  header = header
    .replace(/class="nav-btn active"/g, 'class="nav-btn"')
    .replace(
      '<button class="nav-btn" data-target="chat-section">Orientamento</button>',
      '<button type="button" class="nav-btn" onclick="window.location.href=\'/\'">Orientamento</button>'
    )
    .replace(
      '<button class="nav-btn" data-target="about-section">Chi Siamo</button>',
      '<button type="button" class="nav-btn" onclick="window.location.href=\'/chi-siamo/\'">Chi Siamo</button>'
    );

  const activeLabel = activeLabels[activeKey];
  if (activeLabel) {
    header = header.replace(
      new RegExp(`class="nav-btn"([^>]*)>${activeLabel}<\\/button>`),
      `class="nav-btn active"$1>${activeLabel}</button>`
    );
  }

  return header;
}

function pageTemplate({ title, description, canonicalPath, bodyContent, extraScript = "", activeKey, robotsContent = "index, follow" }) {
  const appSplashStart = indexHtml.indexOf('<div id="app-splash" class="app-splash">');
  const privacyModalStart = indexHtml.indexOf('<div id="privacy-modal"', appSplashStart);
  if (appSplashStart === -1 || privacyModalStart === -1) {
    throw new Error("Impossibile trovare il blocco app-splash in index.html");
  }
  const appSplash = absolutize(indexHtml.slice(appSplashStart, privacyModalStart).replace(/\s*<!-- Privacy[\s\S]*$/, "").trim());
  const cookieConsent = absolutize(matchOrThrow(/<section id="cookie-consent"[\s\S]*?<\/section>/, "cookie-consent"));
  const legalModal = absolutize(matchOrThrow(/<div id="legal-modal" class="modal-overlay hidden">[\s\S]*?<button id="close-legal-btn" class="btn-primary-wide">Chiudi<\/button>\s*<\/div>\s*<\/div>/, "legal-modal"));
  const footer = absolutize(matchOrThrow(/<footer class="legal-footer">[\s\S]*?<\/footer>/, "legal-footer"));
  const header = buildStandaloneHeader(activeKey);

  const commonScript = `
  <script>
    (function() {
      const COOKIE_CONSENT_KEY = 'aiutodoc_cookie_preferences';
      const GA_MEASUREMENT_ID = 'G-9C1TRG2K0X';
      const cookieConsent = document.getElementById('cookie-consent');
      const cookieCustomizePanel = document.getElementById('cookie-customize-panel');
      const cookieAnalytics = document.getElementById('cookie-analytics');
      const cookieAcceptAll = document.getElementById('cookie-accept-all');
      const cookieRejectAll = document.getElementById('cookie-reject-all');
      const cookieCustomize = document.getElementById('cookie-customize');
      const cookieSaveCustom = document.getElementById('cookie-save-custom');
      const manageCookiePreferences = document.getElementById('manage-cookie-preferences');
      const menuToggle = document.getElementById('menu-toggle');
      const mainNav = document.querySelector('.main-nav');
      const closeLegalBtn = document.getElementById('close-legal-btn');
      const resetBtn = document.getElementById('reset-btn');
      const recoveryBtn = document.getElementById('recovery-btn');
      const splash = document.getElementById('app-splash');
      const banner = document.querySelector('.banner-img');

      function readJsonStorage(key) {
        try {
          const raw = window.localStorage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        } catch (error) {
          console.warn('Impossibile leggere localStorage:', error);
          return null;
        }
      }

      function writeJsonStorage(key, value) {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.warn('Impossibile salvare localStorage:', error);
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

      function applyCookiePreferences(preferences) {
        if (preferences && preferences.analytics === true) {
          loadGoogleAnalytics();
        }
      }

      function hideCookieBanner() {
        if (cookieConsent) cookieConsent.classList.add('hidden');
      }

      function showCookieBanner(customizeFirst) {
        if (!cookieConsent) return;
        cookieConsent.classList.remove('hidden');
        const saved = readJsonStorage(COOKIE_CONSENT_KEY);
        if (cookieAnalytics) cookieAnalytics.checked = !!(saved && saved.analytics);
        if (customizeFirst && cookieCustomizePanel && cookieSaveCustom) {
          cookieCustomizePanel.classList.remove('hidden');
          cookieSaveCustom.classList.remove('hidden');
        }
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

      if (cookieAcceptAll) {
        cookieAcceptAll.addEventListener('click', function() {
          saveCookiePreferences({ analytics: true });
        });
      }
      if (cookieRejectAll) {
        cookieRejectAll.addEventListener('click', function() {
          saveCookiePreferences({ analytics: false });
        });
      }
      if (cookieCustomize) {
        cookieCustomize.addEventListener('click', function() {
          if (cookieCustomizePanel) cookieCustomizePanel.classList.remove('hidden');
          if (cookieSaveCustom) cookieSaveCustom.classList.remove('hidden');
        });
      }
      if (cookieSaveCustom) {
        cookieSaveCustom.addEventListener('click', function() {
          saveCookiePreferences({ analytics: cookieAnalytics && cookieAnalytics.checked });
        });
      }
      if (manageCookiePreferences) {
        manageCookiePreferences.addEventListener('click', function() {
          showCookieBanner(true);
        });
      }

      const storedCookiePreferences = readJsonStorage(COOKIE_CONSENT_KEY);
      const storedCookieExpired = storedCookiePreferences && Date.parse(storedCookiePreferences.expiresAt || '') <= Date.now();
      if (storedCookiePreferences && !storedCookieExpired) {
        applyCookiePreferences(storedCookiePreferences);
      } else {
        showCookieBanner(false);
      }

      if (menuToggle && mainNav) {
        const syncMenuState = function(isOpen) {
          mainNav.classList.toggle('open', isOpen);
          document.body.classList.toggle('menu-open', isOpen);
          menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
          menuToggle.textContent = isOpen ? 'Chiudi' : 'Menu';
        };

        syncMenuState(false);

        menuToggle.addEventListener('click', function(event) {
          event.stopPropagation();
          syncMenuState(!mainNav.classList.contains('open'));
        });

        mainNav.querySelectorAll('button, a').forEach(function(el) {
          el.addEventListener('click', function() {
            syncMenuState(false);
          });
        });

        document.addEventListener('click', function(event) {
          if (!mainNav.classList.contains('open')) return;
          if (mainNav.contains(event.target) || menuToggle.contains(event.target)) return;
          syncMenuState(false);
        });

        window.addEventListener('resize', function() {
          if (window.innerWidth > 950) {
            syncMenuState(false);
          }
        });
      }

      if (banner) {
        banner.setAttribute('role', 'button');
        banner.setAttribute('tabindex', '0');
        banner.setAttribute('title', 'Torna alla home');

        const goHome = function() { window.location.href = '/'; };
        banner.addEventListener('click', goHome);
        banner.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            goHome();
          }
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener('click', function() {
          window.location.href = '/';
        });
      }

      if (recoveryBtn) {
        recoveryBtn.addEventListener('click', function() {
          window.location.href = '/';
        });
      }

      if (closeLegalBtn) {
        closeLegalBtn.addEventListener('click', function() {
          document.getElementById('legal-modal')?.classList.add('hidden');
        });
      }

      if (splash) {
        window.requestAnimationFrame(function() {
          setTimeout(function() {
            splash.classList.add('hidden');
          }, 160);
        });
      }
    })();
  </script>
`;

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#0F5464">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="application-name" content="AIutoDoc">
  <meta name="apple-mobile-web-app-title" content="AIutoDoc">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="${robotsContent}">
  <link rel="canonical" href="https://aiutodoc.it/${canonicalPath}">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32.png">
  <link rel="apple-touch-icon" href="/assets/favicon-192.png">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="stylesheet" href="/src/style.css?v=4.1.0">
</head>
<body>
  ${appSplash}
  ${cookieConsent}
  ${legalModal}
  <div id="app">
    ${header}
    <main class="content-container">
${bodyContent}
    </main>
    ${footer}
  </div>
${commonScript}
${extraScript}
</body>
</html>
`;
}

const specialistsSection = revealStandaloneSection(absolutize(matchOrThrow(/<section id="specialists-section"[\s\S]*?<\/section>/, "specialists-section")));
const aboutSection = revealStandaloneSection(absolutize(matchOrThrow(/<section id="about-section"[\s\S]*?<\/section>\s*(?:<!--[\s\S]*?-->\s*)*<section id="specialists-section"/, "about-section")).replace(/\s*(?:<!--[\s\S]*?-->\s*)*<section id="specialists-section"[\s\S]*$/, ""));
const glossarySection = revealStandaloneSection(absolutize(matchOrThrow(/<section id="glossary-section"[\s\S]*?<\/section>\s*\n\s*<section id="practices-section"/, "glossary-section")).replace(/\s*<section id="practices-section"[\s\S]*$/, ""));
const specializationsBlock = absolutize(matchOrThrow(/<section id="practices-section"[\s\S]*?(?=\s*<\/main>)/, "practices-section and specialty detail sections"));

const glossaryScript = `
  <script>
    (function() {
      const glossarySearchInput = document.getElementById('glossary-search');
      const gCards = document.querySelectorAll('.g-card');
      gCards.forEach(function(card) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() {
          const strongTag = card.querySelector('strong');
          if (strongTag) {
            const term = strongTag.innerText.replace(':', '').trim();
            window.open('https://www.google.com/search?q=' + encodeURIComponent(term + ' significato medico'), '_blank');
          }
        });
      });
      if (glossarySearchInput) {
        glossarySearchInput.addEventListener('input', function(e) {
          const val = e.target.value.toLowerCase().trim();
          gCards.forEach(function(card) {
            card.style.display = card.innerText.toLowerCase().indexOf(val) > -1 ? 'block' : 'none';
          });
          const categories = document.querySelectorAll('#glossary-section h3');
          categories.forEach(function(cat) {
            const grid = cat.nextElementSibling;
            if (grid && grid.classList.contains('grid-cards')) {
              const hasVisible = Array.from(grid.querySelectorAll('.g-card')).some(function(c) { return c.style.display !== 'none'; });
              cat.style.display = hasVisible ? 'block' : 'none';
              grid.style.display = hasVisible ? 'grid' : 'none';
            }
          });
        });
      }
    })();
  </script>
`;

const specializationsScript = `
  <script>
    (function() {
      const tabContents = document.querySelectorAll('.tab-content');

      function scrollToPageTop() {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }

      function navigateToSection(targetId) {
        if (!targetId) return;
        if (targetId === 'chat-section') {
          window.location.href = '/';
          return;
        }
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;
        scrollToPageTop();
        tabContents.forEach(function(content) { content.classList.add('hidden-section'); });
        targetEl.classList.remove('hidden-section');
        scrollToPageTop();
      }

      document.querySelectorAll('[data-target]').forEach(function(el) {
        el.addEventListener('click', function(event) {
          const targetId = el.getAttribute('data-target');
          if (!targetId) return;
          event.preventDefault();
          navigateToSection(targetId);
        });
      });

      tabContents.forEach(function(content) { content.classList.add('hidden-section'); });
      const practicesSection = document.getElementById('practices-section');
      if (practicesSection) {
        practicesSection.classList.remove('hidden-section');
      }
    })();
  </script>
`;

const recoveryPageBody = `
<section class="info-section">
  <div class="info-body">
    <div style="text-align: center;">
      <img src="/assets/logo-aiutodoc.png" alt="Recupera ricerca AIutoDoc" class="section-image" loading="lazy" decoding="async" onerror="this.style.display='none'">
    </div>
    <h2>Recupera una ricerca già eseguita</h2>
    <p>Se hai salvato un codice ricerca, puoi usarlo qui per <strong>recuperare il risultato già ottenuto</strong> senza rifare tutto il percorso.</p>
    <div class="recovery-page-card">
      <label class="recovery-page-label" for="recovery-page-input">Inserisci il tuo ID ricerca</label>
      <div class="recovery-page-form">
        <input type="text" id="recovery-page-input" class="recovery-page-input" placeholder="Es. AB12CD34" autocomplete="off" inputmode="text">
        <button type="button" id="recovery-page-submit" class="btn-premium-wide recovery-page-submit">Recupera ricerca</button>
      </div>
      <p class="recovery-page-note">Dopo il click ti riportiamo in home e mostriamo direttamente la ricerca recuperata.</p>
    </div>
  </div>
</section>
`;

const recoveryPageScript = `
  <script>
    (function() {
      const input = document.getElementById('recovery-page-input');
      const submit = document.getElementById('recovery-page-submit');
      if (!input || !submit) return;

      const normalize = function(value) {
        return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      };

      const redirectToRecovery = function() {
        const id = normalize(input.value);
        if (!id) {
          input.focus();
          return;
        }
        try {
          localStorage.setItem('aiutodoc_pending_recovery_id', id);
        } catch (error) {
          console.warn('Impossibile salvare ID recupero:', error);
        }
        window.location.href = '/';
      };

      submit.addEventListener('click', redirectToRecovery);
      input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          redirectToRecovery();
        }
      });
    })();
  </script>
`;

const outputs = [
  {
    filePath: path.join(root, "recupera-ricerca", "index.html"),
    html: pageTemplate({
      title: "Recupera ricerca | AIutoDoc.it",
      description: "Inserisci il tuo ID ricerca per recuperare un orientamento sanitario già eseguito.",
      canonicalPath: "recupera-ricerca/",
      bodyContent: recoveryPageBody,
      extraScript: recoveryPageScript,
      activeKey: "recovery",
      robotsContent: "noindex, nofollow"
    })
  },
  {
    filePath: path.join(root, "chi-siamo", "index.html"),
    html: pageTemplate({
      title: "Chi Siamo | AIutoDoc.it",
      description: "AIutoDoc nasce per rendere piu semplice l'orientamento sanitario e aiutarti a individuare la branca specialistica piu coerente con le tue esigenze.",
      canonicalPath: "chi-siamo/",
      bodyContent: aboutSection,
      activeKey: "about"
    })
  },
  {
    filePath: path.join(root, "per-gli-specialisti", "index.html"),
    html: pageTemplate({
      title: "Per gli specialisti | AIutoDoc.it",
      description: "AIutoDoc.it permette agli specialisti e alle strutture private di migliorare la propria visibilita digitale ed entrare in contatto con nuovi pazienti.",
      canonicalPath: "per-gli-specialisti/",
      bodyContent: specialistsSection,
      activeKey: "specialists"
    })
  },
  {
    filePath: path.join(root, "glossario", "index.html"),
    html: pageTemplate({
      title: "Breve Glossario Medico | AIutoDoc.it",
      description: "Questo glossario raccoglie i termini piu comuni utilizzati nei principali rami ambulatoriali per aiutarti a capire meglio i tuoi referti.",
      canonicalPath: "glossario/",
      bodyContent: glossarySection,
      extraScript: glossaryScript,
      activeKey: "glossary"
    })
  },
  {
    filePath: path.join(root, "specializzazioni", "index.html"),
    html: pageTemplate({
      title: "Specializzazioni | AIutoDoc.it",
      description: "Esplora le singole specializzazioni per capire quale fa al caso tuo, oppure usa AIutoDoc per orientarti attraverso poche domande.",
      canonicalPath: "specializzazioni/",
      bodyContent: specializationsBlock,
      extraScript: specializationsScript,
      activeKey: "specializations"
    })
  }
];

for (const output of outputs) {
  fs.mkdirSync(path.dirname(output.filePath), { recursive: true });
  fs.writeFileSync(output.filePath, output.html, "utf8");
}

console.log("Pagine indicizzabili generate:", outputs.map((item) => path.relative(root, item.filePath)).join(", "));
