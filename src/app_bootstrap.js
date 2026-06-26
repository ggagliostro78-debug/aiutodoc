// App bootstrap and orchestration.
function setupMobileViewport() {
    const root = document.documentElement;

    const applyViewportHeight = () => {
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        root.style.setProperty('--app-height', `${Math.round(viewportHeight)}px`);
    };

    applyViewportHeight();
    window.addEventListener('resize', applyViewportHeight);
    window.addEventListener('orientationchange', applyViewportHeight);

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', applyViewportHeight);
        window.visualViewport.addEventListener('scroll', applyViewportHeight);
    }
}

function setupInputAutoGrow() {
    const input = document.getElementById('user-input');
    if (!input) return;

    const resizeInput = () => {
        input.style.height = 'auto';
        input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
    };

    resizeInput();
    input.addEventListener('input', resizeInput);
    input.addEventListener('focus', () => {
        resizeInput();
    });
}

function setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    if (!menuToggle || !mainNav) return;

    const syncMenuState = (isOpen) => {
        mainNav.classList.toggle('open', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
        menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        menuToggle.textContent = isOpen ? 'Chiudi' : 'Menu';
    };

    syncMenuState(false);

    menuToggle.onclick = (e) => {
        e.stopPropagation();
        syncMenuState(!mainNav.classList.contains('open'));
    };

    mainNav.querySelectorAll('[data-target], #reset-btn, #recovery-btn, #recovery-page-btn').forEach((el) => {
        el.addEventListener('click', () => syncMenuState(false));
    });

    document.addEventListener('click', (event) => {
        if (!mainNav.classList.contains('open')) return;
        if (mainNav.contains(event.target) || menuToggle.contains(event.target)) return;
        syncMenuState(false);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 950) {
            syncMenuState(false);
        }
    });
}

function setupBannerReload() {
    const banner = document.querySelector('.banner-img');
    if (!banner) return;

    banner.setAttribute('role', 'button');
    banner.setAttribute('tabindex', '0');
    banner.setAttribute('title', 'Riavvia AIutoDoc');

    const reload = () => window.location.reload();
    banner.addEventListener('click', reload);
    banner.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            reload();
        }
    });
}

function setupSplashScreen() {
    const splash = document.getElementById('app-splash');
    if (!splash) return;

    window.requestAnimationFrame(() => {
        setTimeout(() => splash.classList.add('hidden'), 160);
    });
}

function setupInstallPrompt() {
    const installBtn = document.getElementById('install-app-btn');
    if (!installBtn) return;

    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        installBtn.classList.remove('hidden');
        trackEvent('pwa_install_prompt_available', {
            prompt_origin: 'beforeinstallprompt'
        });
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        trackEvent('pwa_install_button_click', {
            prompt_origin: 'install_app_button'
        });
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        trackEvent('pwa_install_prompt_choice', {
            outcome: choice && choice.outcome ? choice.outcome : 'unknown',
            platform: choice && choice.platform ? choice.platform : 'unknown'
        });
        deferredPrompt = null;
        installBtn.classList.add('hidden');
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        installBtn.classList.add('hidden');
        trackEvent('pwa_app_installed', {
            prompt_origin: 'appinstalled'
        });
    });
}

function setupNavigationTracking() {
    document.querySelectorAll('[data-target]').forEach((el) => {
        el.addEventListener('click', () => {
            const targetId = String(el.getAttribute('data-target') || '').trim();
            if (!targetId) return;
            trackEvent('nav_page_open', {
                destination_section: targetId
            });
        });
    });
}

function setupMailtoTracking() {
    document.addEventListener('click', (event) => {
        const mailtoLink = event.target.closest('a[href^="mailto:"]');
        if (!mailtoLink) return;

        const href = String(mailtoLink.getAttribute('href') || '');
        const label = String(mailtoLink.textContent || '').trim().toLowerCase();
        let contact_type = 'generic';

        if (href.includes('Opportunita investimento istituzionale AIutoDoc')) {
            contact_type = 'investor';
        } else if (href.includes('Collaborazione AIutoDoc')) {
            contact_type = 'collaboration';
        } else if (href.includes('Informazioni servizi specialisti AIutoDoc')) {
            contact_type = 'specialist_services';
        } else if (label.includes('contattaci')) {
            contact_type = 'contact';
        }

        trackEvent('mailto_click', {
            contact_type
        });
    });

    const investorBtn = document.getElementById('investor-btn');
    if (investorBtn) {
        investorBtn.addEventListener('click', () => {
            trackEvent('mailto_click', {
                contact_type: 'investor'
            });
        });
    }
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return;

    window.addEventListener('load', () => {
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });

        navigator.serviceWorker.register('./service-worker.js').then((registration) => {
            const activateWaitingWorker = () => {
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            };

            activateWaitingWorker();
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });
            registration.update().catch(() => {});
        }).catch((error) => {
            console.warn('Service worker non registrato:', error);
        });
    });
}

function initApp() {
    console.log("Initializing App Engine (v3.0.0)...");

    setupMobileViewport();
    setupInputAutoGrow();
    setupMobileMenu();
    setupBannerReload();
    setupInstallPrompt();
    setupNavigationTracking();
    setupMailtoTracking();
    registerServiceWorker();

    const chatUI = new ChatInterface('app', (userText) => {
        if (window.triageEngine) window.triageEngine.processUserInput(userText);
    });
    window.chatUI = chatUI;

    const triageEngine = new TriageEngine((botMessage, msgType = 'system-msg') => {
        setTimeout(() => {
            chatUI.addMessage(botMessage, msgType);
            chatUI.setLoading(false);
        }, 120);
    });
    window.triageEngine = triageEngine;

    setupSplashScreen();
    window.scrollTo(0, 0);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
