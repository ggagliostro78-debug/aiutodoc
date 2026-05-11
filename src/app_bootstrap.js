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
        setTimeout(() => {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 180);
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

    mainNav.querySelectorAll('[data-target], #reset-btn, #recovery-btn').forEach((el) => {
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

function setupSplashScreen() {
    const splash = document.getElementById('app-splash');
    if (!splash) return;

    window.requestAnimationFrame(() => {
        setTimeout(() => splash.classList.add('hidden'), 420);
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
    });

    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        installBtn.classList.add('hidden');
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        installBtn.classList.add('hidden');
    });
}

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch((error) => {
            console.warn('Service worker non registrato:', error);
        });
    });
}

function initApp() {
    console.log("Initializing App Engine (v3.0.0)...");

    setupMobileViewport();
    setupInputAutoGrow();
    setupMobileMenu();
    setupInstallPrompt();
    registerServiceWorker();

    const chatUI = new ChatInterface('app', (userText) => {
        if (window.triageEngine) window.triageEngine.processUserInput(userText);
    });
    window.chatUI = chatUI;

    const triageEngine = new TriageEngine((botMessage, msgType = 'system-msg') => {
        setTimeout(() => {
            chatUI.addMessage(botMessage, msgType);
            chatUI.setLoading(false);
        }, 600);
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
