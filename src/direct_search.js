// Direct lookup is kept separate from clinical orientation and its saved records.
const DIRECT_SPECIALTIES = [
    'Allergologia', 'Andrologia', 'Angiologia', 'Cardiologia', 'Chirurgia generale',
    'Chirurgia vascolare', 'Dermatologia', 'Diabetologia', 'Ematologia', 'Endocrinologia',
    'Fisiatria', 'Gastroenterologia', 'Geriatria', 'Ginecologia e ostetricia',
    'Infettivologia', 'Medicina dello sport', 'Medicina interna', 'Nefrologia',
    'Neurochirurgia', 'Neurologia', 'Oculistica', 'Odontoiatria', 'Oncologia',
    'Ortopedia e traumatologia', 'Otorinolaringoiatria', 'Pediatria', 'Pneumologia',
    'Psichiatria', 'Reumatologia', 'Urologia'
];

function setupEntryPaths(engine) {
    const get = id => document.getElementById(id);
    const guided = get('initial-medical-form');
    const direct = get('direct-search-panel');
    const form = get('direct-search-form');
    const specialty = get('direct-specialty');
    const location = get('direct-location');
    const status = get('direct-search-status');
    const results = get('direct-search-results');
    const invite = get('direct-orientation-invite');
    const submit = get('direct-search-submit');
    if (!guided || !direct) return;
    let request = null;
    let generation = 0;
    DIRECT_SPECIALTIES.forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        specialty.appendChild(option);
    });
    function choose(mode) {
        generation++;
        request?.abort();
        request = null;
        submit.disabled = false;
        status.textContent = '';
        guided.hidden = mode !== 'guided';
        direct.hidden = mode !== 'direct';
        for (const name of ['guided', 'direct']) {
            get(`choose-${name}`).setAttribute('aria-expanded', String(mode === name));
        }
        const target = mode === 'guided' ? guided.querySelector('input') : specialty;
        target.focus();
        target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    get('choose-guided').addEventListener('click', () => choose('guided'));
    get('choose-direct').addEventListener('click', () => choose('direct'));
    get('direct-start-guided').addEventListener('click', () => choose('guided'));
    guided.addEventListener('submit', () => {
        if (engine.state === '1_SESSO_ETA') return;
        generation++;
        request?.abort();
        get('entry-choice').hidden = true;
        direct.hidden = true;
    });
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (request || !form.reportValidity()) return;
        const zona = location.value.trim();
        if (!DIRECT_SPECIALTIES.includes(specialty.value) || zona.length < 2 || zona.length > 160) {
            status.textContent = 'Seleziona una branca e indica un’area geografica valida.';
            return;
        }
        // The existing entry consent remains required, including after expiry.
        if (!window.aiutodocEntryReceipt()) {
            const modal = get('privacy-modal');
            modal.style.display = 'flex';
            modal.classList.remove('hidden');
            status.textContent = 'Conferma i consensi di ingresso, poi premi nuovamente Cerca specialisti.';
            return;
        }
        const current = ++generation;
        const selectedSpecialty = specialty.value;
        const controller = new AbortController();
        request = controller;
        const timeout = setTimeout(() => controller.abort(), 16000);
        submit.disabled = true;
        results.replaceChildren();
        invite.hidden = true;
        status.textContent = 'Ricerca delle schede pubbliche in corso…';
        try {
            const payload = { specialista: selectedSpecialty, zona, searchMode: 'direct' };
            let response = await fetch('/api/places', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload), signal: controller.signal
            });
            let data = await response.json();
            if (current !== generation || controller.signal.aborted) return;
            // Same provider order as the guided journey: Places first, then the
            // existing web search only if Places is unavailable.
            if (!response.ok && (data.code === 'GOOGLE_PLACES_CONFIG_MISSING' || response.status === 502)) {
                response = await fetch('/api/specialist-search', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload), signal: controller.signal
                });
                data = await response.json();
            }
            if (current !== generation) return;
            if (!response.ok) {
                status.textContent = /^(GOOGLE_SEARCH_CONFIG_MISSING|GOOGLE_PLACES_CONFIG_MISSING)$/.test(data.code || '')
                    ? 'Ricerca specialisti non configurata in questo ambiente. Puoi rivolgerti al tuo medico.'
                    : response.status === 429 ? 'Troppe ricerche ravvicinate. Attendi un minuto prima di riprovare.'
                    : 'Ricerca temporaneamente non disponibile. Riprova più tardi.';
                return;
            }
            const foundResults = Array.isArray(data.results) ? data.results : data.risultati;
            if (!Array.isArray(foundResults)) throw new Error('Invalid search response');
            const cards = foundResults.filter(item => item && typeof item === 'object').slice(0, 20)
                .map(card => engine._buildCard(card, selectedSpecialty)).filter(Boolean);
            status.textContent = cards.length
                ? `${cards.length} schede pubbliche per ${selectedSpecialty}. Area richiesta: ${zona}.`
                : 'Nessuna scheda pubblica trovata. Puoi modificare la branca o ampliare l’area geografica.';
            if (cards.length) {
                results.innerHTML = '<p>Informazioni da fonti pubbliche: l’ordine non indica qualità clinica o una raccomandazione. Verifica branca, indirizzo e disponibilità sulla fonte: i risultati del motore di ricerca possono essere imprecisi.</p>' +
                    cards.join('');
            }
        } catch (error) {
            if (current === generation) status.textContent = 'Ricerca non completata. Controlla la connessione o riprova più tardi.';
        } finally {
            clearTimeout(timeout);
            if (current === generation) {
                request = null;
                submit.disabled = false;
                invite.hidden = false;
            }
        }
    });
}
