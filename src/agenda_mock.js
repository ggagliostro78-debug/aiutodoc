// Offline agenda mock for AiutoDoc specialist booking MVP.
console.log("Agenda mock loading...");

(function () {
    const BOOKING_KEY = "aiutodoc_mock_bookings";
    const COUNTER_KEY = "aiutodoc_mock_booking_counters";
    const DRAFT_KEY = "aiutodoc_mock_booking_draft";
    const SPECIALISTS_KEY = "aiutodoc_mock_specialists";
    const ADMIN_SESSION_KEY = "aiutodoc_mock_admin_session";
    const MOCK_CONSENT_VERSION = "2026-05-booking-mock-v1";

    const SPECIALIST_OVERRIDES = {
        "dott vincenzo calafiore": {
            clinicalAreas: ["anca", "ginocchio", "spalla", "traumatologia sportiva"],
            visitType: "Visita ortopedica",
            price: 120,
            city: "Reggio Calabria / Vibo Valentia",
            paymentEnabled: false,
            paymentMode: "in_studio",
            cancellationRules: "Cancellazione gratuita fino a 48 ore prima.",
            slots: [
                ["2026-05-20T09:30:00", "2026-05-20T10:00:00"],
                ["2026-05-20T10:30:00", "2026-05-20T11:00:00"],
                ["2026-05-22T16:00:00", "2026-05-22T16:30:00"]
            ]
        },
        "dr ssa greta devoli": {
            clinicalAreas: ["ansia", "relazioni", "lutto", "traumi"],
            visitType: "Colloquio psicologico",
            price: 70,
            city: "Roma / Online",
            paymentEnabled: true,
            paymentMode: "online_placeholder",
            cancellationRules: "Cancellazione gratuita fino a 24 ore prima; sotto le 24 ore non rimborsabile.",
            slots: [
                ["2026-05-19T15:00:00", "2026-05-19T15:50:00"],
                ["2026-05-21T18:00:00", "2026-05-21T18:50:00"],
                ["2026-05-23T10:00:00", "2026-05-23T10:50:00"]
            ]
        },
        "dott carmelo pecora": {
            clinicalAreas: ["colonna vertebrale", "ernia del disco", "stenosi lombare"],
            visitType: "Visita neurochirurgica",
            price: 130,
            city: "Messina / Milazzo / Reggio Calabria",
            paymentEnabled: false,
            paymentMode: "in_studio",
            cancellationRules: "Cancellazione gratuita fino a 48 ore prima; rimborso parziale fino a 24 ore.",
            slots: [
                ["2026-05-20T17:00:00", "2026-05-20T17:30:00"],
                ["2026-05-25T11:30:00", "2026-05-25T12:00:00"],
                ["2026-05-27T16:30:00", "2026-05-27T17:00:00"]
            ]
        }
    };

    function getJson(key, fallback) {
        try {
            return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
        } catch (error) {
            console.warn("Agenda mock: dato locale non leggibile", key, error);
            return fallback;
        }
    }

    function setJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function normalizeName(value) {
        return String(value || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, " ")
            .trim();
    }

    function specialistIdFromName(name) {
        return `sp_${normalizeName(name).replace(/\s+/g, "_").slice(0, 48) || "generic"}`;
    }

    function slotIdFromParts(specialistId, start) {
        return `${specialistId}_${String(start).replace(/[^0-9]/g, "")}`;
    }

    function formatDateTime(iso) {
        return new Date(iso).toLocaleString("it-IT", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function money(value, currency = "EUR") {
        return new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(value || 0);
    }

    function isAdminAuthenticated() {
        return sessionStorage.getItem(ADMIN_SESSION_KEY) === "active";
    }

    function getAdminAuthUrl() {
        return (typeof CONFIG !== "undefined" && CONFIG.ADMIN_AUTH_URL) ? CONFIG.ADMIN_AUTH_URL : "/api/admin-login";
    }

    function seedSpecialistFromOverride(normalizedName, override) {
        const nameMap = {
            "dott vincenzo calafiore": ["Dott.", "Vincenzo", "Calafiore", "Ortopedia"],
            "dr ssa greta devoli": ["Dr.ssa", "Greta", "Devoli", "Psicologia"],
            "dott carmelo pecora": ["Dott.", "Carmelo", "Pecora", "Neurochirurgia"]
        };
        const [title, nome, cognome, specialita] = nameMap[normalizedName] || ["Dott.", "Specialista", "AiutoDoc", "Specialistica"];
        return {
            id: specialistIdFromName(`${title} ${nome} ${cognome}`),
            nome,
            cognome,
            titolo: title,
            emailProfessionale: "",
            telefonoStudio: "",
            specialitaPrincipale: specialita,
            sottospecialita: "",
            areeCliniche: override.clinicalAreas.join(", "),
            patologieAssociate: override.clinicalAreas.join(", "),
            bio: "",
            cvBreve: "",
            anniEsperienza: "",
            studioNome: override.city,
            indirizzo: override.city,
            citta: override.city,
            provincia: "",
            regione: "",
            cap: "",
            subscriptionPlan: "plus",
            subscriptionStatus: "active",
            agendaEnabled: true,
            paymentEnabled: override.paymentEnabled === true,
            paymentMode: override.paymentMode || (override.paymentEnabled ? "online_placeholder" : "in_studio"),
            visitPrice: override.price,
            cancellationPolicy: override.cancellationRules,
            status: "attivo",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    function getManagedSpecialists() {
        const saved = getJson(SPECIALISTS_KEY, null);
        if (Array.isArray(saved) && saved.length) return saved;

        const seeded = Object.entries(SPECIALIST_OVERRIDES)
            .map(([name, override]) => seedSpecialistFromOverride(name, override));
        setJson(SPECIALISTS_KEY, seeded);
        return seeded;
    }

    function saveManagedSpecialists(specialists) {
        setJson(SPECIALISTS_KEY, specialists);
    }

    function fullSpecialistName(specialist) {
        return [specialist.titolo, specialist.nome, specialist.cognome].filter(Boolean).join(" ").trim();
    }

    function getSpecialistProfile(raw) {
        const name = raw && raw.name ? raw.name : "Specialista AiutoDoc";
        const normalized = normalizeName(name);
        const override = SPECIALIST_OVERRIDES[normalized] || {};
        const managed = getManagedSpecialists()
            .find((specialist) => normalizeName(fullSpecialistName(specialist)) === normalized);
        const specialistId = specialistIdFromName(name);
        const defaultSlots = [
            ["2026-05-19T09:00:00", "2026-05-19T09:30:00"],
            ["2026-05-21T12:00:00", "2026-05-21T12:30:00"],
            ["2026-05-26T15:30:00", "2026-05-26T16:00:00"]
        ];

        return {
            id: specialistId,
            name,
            specialization: raw && raw.specialization ? raw.specialization : "Specialista",
            address: managed?.indirizzo || raw?.address || override.city || "Sede da confermare",
            city: managed?.citta || override.city || raw.address || "Sede da confermare",
            agendaEnabled: managed ? managed.agendaEnabled === true : true,
            paymentEnabled: managed ? managed.paymentEnabled === true : override.paymentEnabled === true,
            paymentMode: managed?.paymentMode || override.paymentMode || (override.paymentEnabled ? "online_placeholder" : "in_studio"),
            visitType: override.visitType || "Prima visita specialistica",
            price: Number(managed?.visitPrice || override.price || 90),
            currency: "EUR",
            cancellationRules: managed?.cancellationPolicy || override.cancellationRules || "Cancellazione gratuita fino a 48 ore prima.",
            clinicalAreas: managed?.areeCliniche ? managed.areeCliniche.split(",").map((item) => item.trim()).filter(Boolean) : (override.clinicalAreas || [raw.specialization || "area clinica"]),
            slots: (override.slots || defaultSlots).map(([startDateTime, endDateTime]) => ({
                id: slotIdFromParts(specialistId, startDateTime),
                specialistId,
                startDateTime,
                endDateTime,
                status: "available",
                source: "aiutodoc",
                visitType: override.visitType || "Prima visita specialistica",
                price: Number(managed?.visitPrice || override.price || 90)
            }))
        };
    }

    function getBookings() {
        return getJson(BOOKING_KEY, []);
    }

    function getBookedSlotIds() {
        return new Set(getBookings()
            .filter((booking) => booking.status === "confirmed")
            .map((booking) => booking.slotId));
    }

    function saveBooking(profile, slot) {
        if (!slot) {
            throw new Error("Slot non valido o non disponibile.");
        }

        const registeredUser = typeof getRegisteredUser === "function" ? getRegisteredUser() : null;
        if (!registeredUser) {
            throw new Error("Per prenotare e' necessario registrarsi o accedere.");
        }

        const bookedSlotIds = getBookedSlotIds();
        if (bookedSlotIds.has(slot.id)) {
            throw new Error("Questo slot non e' piu' disponibile.");
        }

        const existing = getBookings();
        const booking = {
            id: `BKG-${Date.now().toString(36).toUpperCase()}`,
            patientId: registeredUser.userId,
            patientEmailMasked: registeredUser.emailMasked,
            specialistId: profile.id,
            specialistName: profile.name,
            slotId: slot.id,
            status: "confirmed",
            paymentStatus: profile.paymentMode === "online_placeholder" ? "pending" : "not_required",
            paymentMode: profile.paymentMode,
            cancellationStatus: "active",
            source: "aiutodoc",
            visitType: profile.visitType,
            price: profile.price,
            currency: profile.currency,
            startDateTime: slot.startDateTime,
            endDateTime: slot.endDateTime,
            preliminaryAnamnesisId: window._currentTriageData && window._currentTriageData.id ? window._currentTriageData.id : null,
            specialistAnamnesisStatus: "sent_to_patient",
            documentsStatus: "not_uploaded",
            consentLog: {
                version: MOCK_CONSENT_VERSION,
                timestamp: new Date().toISOString(),
                consentTypes: ["terms", "privacy", "personal_data_booking", "health_data", "share_with_specialist", "medical_disclaimer"],
                ipAddress: "not_available_offline",
                retentionPolicy: {
                    account: "placeholder",
                    booking: "placeholder",
                    anamnesis: "placeholder",
                    documents: "private-storage-placeholder",
                    payment: "placeholder"
                }
            },
            createdAt: new Date().toISOString(),
            confirmedAt: new Date().toISOString()
        };

        existing.push(booking);
        setJson(BOOKING_KEY, existing);
        rebuildCounters(existing);
        setJson(DRAFT_KEY, null);
        return booking;
    }

    function rebuildCounters(bookings = getBookings()) {
        const counters = {};
        bookings.forEach((booking) => {
            const date = new Date(booking.createdAt || booking.startDateTime);
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const quarter = Math.floor((month - 1) / 3) + 1;
            const key = `${booking.specialistId}_${year}_${quarter}_${month}`;

            if (!counters[key]) {
                counters[key] = {
                    specialistId: booking.specialistId,
                    specialistName: booking.specialistName,
                    month,
                    quarter,
                    year,
                    totalBookings: 0,
                    confirmedBookings: 0,
                    cancelledBookings: 0,
                    paidBookings: 0,
                    unpaidBookings: 0,
                    grossBookingValue: 0,
                    aiutodocFeeValue: 0
                };
            }

            const counter = counters[key];
            counter.totalBookings += 1;
            if (booking.status === "confirmed") counter.confirmedBookings += 1;
            if (String(booking.status).includes("cancelled")) counter.cancelledBookings += 1;
            if (booking.paymentStatus === "paid") counter.paidBookings += 1;
            if (booking.paymentStatus !== "paid") counter.unpaidBookings += 1;
            counter.grossBookingValue += Number(booking.price || 0);
            counter.aiutodocFeeValue += Math.round(Number(booking.price || 0) * 0.08 * 100) / 100;
        });

        const list = Object.values(counters);
        setJson(COUNTER_KEY, list);
        return list;
    }

    function renderAgenda(rawSpecialist, selectedSlotId = "") {
        const profile = getSpecialistProfile(rawSpecialist);
        if (!profile.agendaEnabled) return "";

        const bookedSlotIds = getBookedSlotIds();
        const selectedSlot = profile.slots.find((slot) => slot.id === selectedSlotId);
        const registeredUser = typeof getRegisteredUser === "function" ? getRegisteredUser() : null;
        const safeProfile = encodeURIComponent(JSON.stringify(rawSpecialist || {}));

        const slotButtons = profile.slots.map((slot) => {
            const isBooked = bookedSlotIds.has(slot.id);
            const isSelected = slot.id === selectedSlotId;
            const status = isBooked ? "booked" : (isSelected ? "selected" : "available");
            return `
                <button type="button" class="agenda-slot agenda-slot-${status}" data-agenda-action="select-slot" data-slot-id="${escapeHTML(slot.id)}" ${isBooked ? "disabled" : ""}>
                    <span>${escapeHTML(formatDateTime(slot.startDateTime))}</span>
                    <small>${isBooked ? "Prenotato" : escapeHTML(profile.visitType)}</small>
                </button>`;
        }).join("");

        const paymentLabel = profile.paymentMode === "online_placeholder"
            ? "Pagamento online placeholder"
            : (profile.paymentMode === "none" ? "Nessun pagamento gestito" : "Pagamento presso lo studio");

        return `
            <div class="specialist-agenda" data-specialist="${escapeHTML(safeProfile)}" data-selected-slot="${escapeHTML(selectedSlotId)}">
                <div class="agenda-heading">
                    <div>
                        <h4>Prenota una visita con questo specialista</h4>
                        <p>${escapeHTML(profile.city)} · ${escapeHTML(profile.visitType)} · ${escapeHTML(money(profile.price, profile.currency))}</p>
                    </div>
                    <span class="agenda-pill">${escapeHTML(paymentLabel)}</span>
                </div>
                <div class="agenda-slots" aria-label="Slot disponibili AiutoDoc">
                    ${slotButtons}
                </div>
                <div class="agenda-policy">${escapeHTML(profile.cancellationRules)} AiutoDoc non sostituisce il medico, non formula diagnosi e non gestisce emergenze. Per emergenze sanitarie chiamare il 112/118 o rivolgersi al pronto soccorso.</div>
                ${selectedSlot ? renderBookingStep(profile, selectedSlot, registeredUser) : ""}
            </div>`;
    }

    function renderBookingStep(profile, slot, registeredUser) {
        if (!registeredUser) {
            return `
                <div class="booking-panel">
                    <strong>Per prenotare e' necessario registrarsi o accedere.</strong>
                    <label class="registration-field">
                        <span>Email</span>
                        <input type="text" class="booking-email" placeholder="nome@email.it" autocomplete="email" inputmode="email">
                    </label>
                    <label class="consent-row"><input type="checkbox" class="booking-consent" data-consent="terms"><span>Accetto i Termini del servizio.</span></label>
                    <label class="consent-row"><input type="checkbox" class="booking-consent" data-consent="privacy"><span>Ho letto l'Informativa Privacy.</span></label>
                    <label class="consent-row"><input type="checkbox" class="booking-consent" data-consent="personalData"><span>Acconsento al trattamento dei dati personali necessari alla prenotazione.</span></label>
                    <label class="consent-row"><input type="checkbox" class="booking-consent" data-consent="healthData"><span>Acconsento al trattamento dei dati sanitari necessari per anamnesi e documenti.</span></label>
                    <label class="consent-row"><input type="checkbox" class="booking-consent" data-consent="medicalDisclaimer"><span>Confermo che AiutoDoc non sostituisce il medico, non formula diagnosi e non gestisce emergenze.</span></label>
                    <div class="booking-gate-actions">
                        <button type="button" class="btn-primary-wide" data-agenda-action="register-booking">Accedi</button>
                        <button type="button" class="btn-secondary-wide" data-agenda-action="register-booking">Registrati</button>
                    </div>
                </div>`;
        }

        const paymentSummary = profile.paymentMode === "online_placeholder"
            ? "Pagamento online placeholder"
            : (profile.paymentMode === "none" ? "Nessun pagamento gestito da AiutoDoc" : "Presso lo studio");

        return `
            <div class="booking-panel">
                <strong>Riepilogo prenotazione</strong>
                <dl class="booking-summary">
                    <div><dt>Specialista</dt><dd>${escapeHTML(profile.name)}</dd></div>
                    <div><dt>Data e ora</dt><dd>${escapeHTML(formatDateTime(slot.startDateTime))}</dd></div>
                    <div><dt>Luogo</dt><dd>${escapeHTML(profile.city)}</dd></div>
                    <div><dt>Prezzo</dt><dd>${escapeHTML(money(profile.price, profile.currency))}</dd></div>
                    <div><dt>Pagamento</dt><dd>${escapeHTML(paymentSummary)}</dd></div>
                </dl>
                <label class="consent-row"><input type="checkbox" class="confirm-consent" data-consent="share"><span>Acconsento all'invio dei miei dati, anamnesi e documenti allo specialista scelto.</span></label>
                <label class="consent-row"><input type="checkbox" class="confirm-consent" data-consent="retention"><span>Ho letto l'informativa sulla conservazione dei dati e la policy cancellazione.</span></label>
                <button type="button" class="btn-primary-wide" data-agenda-action="confirm-booking" data-slot-id="${escapeHTML(slot.id)}">Conferma prenotazione</button>
            </div>`;
    }

    function renderAdminDashboard() {
        if (!isAdminAuthenticated()) {
            return renderAdminGate();
        }

        const bookings = getBookings();
        const counters = rebuildCounters(bookings);
        const specialists = getManagedSpecialists();
        const totalValue = bookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0);
        const totalFees = counters.reduce((sum, counter) => sum + Number(counter.aiutodocFeeValue || 0), 0);

        const bookingRows = bookings.length ? bookings.slice().reverse().map((booking) => `
            <tr>
                <td>${escapeHTML(booking.id)}</td>
                <td>${escapeHTML(booking.specialistName)}</td>
                <td>${escapeHTML(formatDateTime(booking.startDateTime))}</td>
                <td>${escapeHTML(booking.status)}</td>
                <td>${escapeHTML(booking.paymentStatus)}</td>
                <td>${escapeHTML(money(booking.price, booking.currency))}</td>
            </tr>`).join("") : `<tr><td colspan="6">Nessuna prenotazione mock ancora registrata.</td></tr>`;

        const counterRows = counters.length ? counters.map((counter) => `
            <tr>
                <td>${escapeHTML(counter.specialistName)}</td>
                <td>${counter.month}/${counter.year}</td>
                <td>${counter.totalBookings}</td>
                <td>${counter.confirmedBookings}</td>
                <td>${counter.cancelledBookings}</td>
                <td>${escapeHTML(money(counter.grossBookingValue))}</td>
                <td>${escapeHTML(money(counter.aiutodocFeeValue))}</td>
            </tr>`).join("") : `<tr><td colspan="7">Contatori in attesa di prenotazioni.</td></tr>`;

        return `
            <div class="admin-dashboard">
                <div class="admin-dashboard-head">
                    <div>
                        <h2>Admin AiutoDoc · Agenda mock</h2>
                        <p>Ambiente locale: dati salvati solo in questo browser tramite localStorage.</p>
                    </div>
                    <div class="admin-actions">
                        <button type="button" class="btn-secondary-wide" data-agenda-action="export-counters">Esporta CSV mock</button>
                        <button type="button" class="btn-secondary-wide" data-agenda-action="admin-logout">Esci admin</button>
                    </div>
                </div>
                <div class="admin-metrics">
                    <div><strong>${bookings.length}</strong><span>Prenotazioni</span></div>
                    <div><strong>${escapeHTML(money(totalValue))}</strong><span>Valore visite</span></div>
                    <div><strong>${escapeHTML(money(totalFees))}</strong><span>Fee stimate AiutoDoc</span></div>
                </div>
                <h3>Prenotazioni generate</h3>
                <div class="table-wrap"><table><thead><tr><th>ID</th><th>Specialista</th><th>Slot</th><th>Stato</th><th>Pagamento</th><th>Valore</th></tr></thead><tbody>${bookingRows}</tbody></table></div>
                <h3>Contatori per specialista</h3>
                <div class="table-wrap"><table><thead><tr><th>Specialista</th><th>Mese</th><th>Totali</th><th>Confermate</th><th>Cancellate</th><th>Lordo</th><th>Fee</th></tr></thead><tbody>${counterRows}</tbody></table></div>
                ${renderSpecialistManagement(specialists)}
            </div>`;
    }

    function renderSpecialistManagement(specialists) {
        const rows = specialists.map((specialist) => `
            <tr>
                <td>${escapeHTML(fullSpecialistName(specialist))}</td>
                <td>${escapeHTML(specialist.specialitaPrincipale || "")}</td>
                <td>${escapeHTML(specialist.citta || "")}</td>
                <td>${escapeHTML(specialist.agendaEnabled ? "attiva" : "non attiva")}</td>
                <td>${escapeHTML(specialist.paymentMode || "in_studio")}</td>
                <td>${escapeHTML(specialist.status || "bozza")}</td>
                <td><button type="button" class="inline-admin-btn" data-agenda-action="toggle-specialist" data-specialist-id="${escapeHTML(specialist.id)}">${specialist.status === "sospeso" ? "Riattiva" : "Sospendi"}</button></td>
            </tr>`).join("");

        return `
            <h3>Gestione specialisti</h3>
            <div class="table-wrap"><table><thead><tr><th>Nome</th><th>Specialita'</th><th>Citta'</th><th>Agenda</th><th>Pagamento</th><th>Status</th><th>Azione</th></tr></thead><tbody>${rows}</tbody></table></div>
            <form class="specialist-admin-form" data-agenda-action="create-specialist">
                <h3>Crea specialista mock</h3>
                <div class="admin-form-grid">
                    <label>Nome<input name="nome" required></label>
                    <label>Cognome<input name="cognome" required></label>
                    <label>Titolo<input name="titolo" value="Dott."></label>
                    <label>Email professionale<input name="emailProfessionale" inputmode="email"></label>
                    <label>Telefono studio<input name="telefonoStudio"></label>
                    <label>Specialita' principale<input name="specialitaPrincipale" required></label>
                    <label>Sottospecialita'<input name="sottospecialita"></label>
                    <label>Aree cliniche trattate<input name="areeCliniche" placeholder="ginocchio, anca, spalla"></label>
                    <label>Patologie/sintomi associabili<input name="patologieAssociate"></label>
                    <label>Citta'<input name="citta"></label>
                    <label>Provincia<input name="provincia"></label>
                    <label>Regione<input name="regione"></label>
                    <label>CAP<input name="cap"></label>
                    <label>Piano abbonamento<input name="subscriptionPlan" value="plus"></label>
                    <label>Stato abbonamento<input name="subscriptionStatus" value="active"></label>
                    <label>Prezzo visita<input name="visitPrice" type="number" min="0" step="1" value="90"></label>
                    <label>Pagamento<select name="paymentMode"><option value="in_studio">in_studio</option><option value="none">none</option><option value="online_placeholder">online_placeholder</option></select></label>
                    <label>Status<select name="status"><option value="attivo">attivo</option><option value="bozza">bozza</option><option value="sospeso">sospeso</option></select></label>
                </div>
                <label>Policy cancellazione<textarea name="cancellationPolicy">Cancellazione gratuita fino a 48 ore prima.</textarea></label>
                <label>Descrizione professionale<textarea name="bio"></textarea></label>
                <label>CV breve<textarea name="cvBreve"></textarea></label>
                <div class="admin-checkbox-row">
                    <label><input type="checkbox" name="agendaEnabled" checked> Agenda attiva</label>
                    <label><input type="checkbox" name="paymentEnabled"> Pagamento online attivo</label>
                </div>
                <button type="submit" class="btn-primary-wide">Salva specialista mock</button>
            </form>`;
    }

    function renderAdminGate(errorMessage = "") {
        return `
            <div class="admin-login-card">
                <h2>Area admin riservata</h2>
                <p>Inserisci la password amministratore per visualizzare prenotazioni, contatori ed export.</p>
                <label class="registration-field">
                    <span>Password admin</span>
                    <input type="password" class="admin-password-input" autocomplete="current-password">
                </label>
                ${errorMessage ? `<p class="admin-login-error">${escapeHTML(errorMessage)}</p>` : ""}
                <button type="button" class="btn-primary-wide" data-agenda-action="admin-login">Accedi all'area admin</button>
            </div>`;
    }

    function renderSpecialistArea() {
        return `
            <div class="specialist-login-card">
                <h2>Accesso specialista</h2>
                <label>
                    <span>Nome o email</span>
                    <input type="text" autocomplete="username" inputmode="email">
                </label>
                <label>
                    <span>Password</span>
                    <input type="password" autocomplete="current-password">
                </label>
                <button type="button" class="btn-primary-wide">Accedi</button>
            </div>`;
    }

    function rerenderAgenda(container, selectedSlotId) {
        const raw = JSON.parse(decodeURIComponent(container.dataset.specialist || "%7B%7D"));
        container.outerHTML = renderAgenda(raw, selectedSlotId);
    }

    async function handleAgendaAction(event) {
        const actionEl = event.target.closest("[data-agenda-action]");
        if (!actionEl) return;

        const action = actionEl.dataset.agendaAction;
        const container = actionEl.closest(".specialist-agenda");

        if (action === "select-slot" && container) {
            rerenderAgenda(container, actionEl.dataset.slotId || "");
            return;
        }

        if (action === "register-booking" && container) {
            const email = container.querySelector(".booking-email")?.value || "";
            const consentFlags = {};
            container.querySelectorAll(".booking-consent").forEach((input) => {
                consentFlags[input.dataset.consent] = input.checked;
            });

            try {
                await registerUserForRecovery(email, consentFlags);
                rerenderAgenda(container, container.dataset.selectedSlot || "");
            } catch (error) {
                alert(error.message || "Registrazione non completata.");
            }
            return;
        }

        if (action === "confirm-booking" && container) {
            const allConfirmed = Array.from(container.querySelectorAll(".confirm-consent")).every((input) => input.checked);
            if (!allConfirmed) {
                alert("Per confermare devi accettare i consensi di prenotazione richiesti.");
                return;
            }

            try {
                const raw = JSON.parse(decodeURIComponent(container.dataset.specialist || "%7B%7D"));
                const profile = getSpecialistProfile(raw);
                const slot = profile.slots.find((item) => item.id === actionEl.dataset.slotId);
                const booking = saveBooking(profile, slot);
                container.outerHTML = `
                    <div class="booking-success">
                        <strong>Prenotazione confermata</strong>
                        <p>ID prenotazione: ${escapeHTML(booking.id)}</p>
                        <p>Abbiamo predisposto anamnesi specifica e upload documenti come placeholder offline. Il pagamento online resta in stato ${escapeHTML(booking.paymentStatus)}.</p>
                    </div>`;
                refreshAdminDashboard();
                refreshSpecialistArea();
            } catch (error) {
                alert(error.message || "Prenotazione non completata.");
            }
            return;
        }

        if (action === "export-counters") {
            exportCountersCsv();
            return;
        }

        if (action === "toggle-specialist") {
            const specialists = getManagedSpecialists();
            const targetId = actionEl.dataset.specialistId;
            const next = specialists.map((specialist) => {
                if (specialist.id !== targetId) return specialist;
                return {
                    ...specialist,
                    status: specialist.status === "sospeso" ? "attivo" : "sospeso",
                    agendaEnabled: specialist.status === "sospeso",
                    updatedAt: new Date().toISOString()
                };
            });
            saveManagedSpecialists(next);
            refreshAdminDashboard();
            return;
        }

        if (action === "admin-login") {
            const root = actionEl.closest("#admin-agenda-root");
            const input = root ? root.querySelector(".admin-password-input") : null;
            const result = await requestAdminLogin(input ? input.value : "");
            if (result.ok) {
                sessionStorage.setItem(ADMIN_SESSION_KEY, "active");
                refreshAdminDashboard();
            } else if (root) {
                root.innerHTML = renderAdminGate(result.error || "Password non corretta.");
            }
            return;
        }

        if (action === "admin-logout") {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            refreshAdminDashboard();
        }
    }

    async function requestAdminLogin(password) {
        try {
            const response = await fetch(getAdminAuthUrl(), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password })
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                return {
                    ok: false,
                    error: payload.error || "Accesso admin non disponibile. Configura ADMIN_PASSWORD e l'endpoint /api/admin-login."
                };
            }
            return payload && payload.ok ? payload : { ok: false, error: "Risposta admin non valida." };
        } catch (error) {
            return {
                ok: false,
                error: "Endpoint admin non raggiungibile in questa modalita' offline. Avvia un server con /api/admin-login e ADMIN_PASSWORD configurata."
            };
        }
    }

    function handleAdminSubmit(event) {
        const form = event.target.closest(".specialist-admin-form");
        if (!form) return;

        event.preventDefault();
        if (!isAdminAuthenticated()) return;

        const data = new FormData(form);
        const name = `${data.get("titolo") || ""} ${data.get("nome") || ""} ${data.get("cognome") || ""}`;
        const specialist = {
            id: specialistIdFromName(name),
            nome: String(data.get("nome") || "").trim(),
            cognome: String(data.get("cognome") || "").trim(),
            titolo: String(data.get("titolo") || "").trim(),
            emailProfessionale: String(data.get("emailProfessionale") || "").trim(),
            telefonoStudio: String(data.get("telefonoStudio") || "").trim(),
            specialitaPrincipale: String(data.get("specialitaPrincipale") || "").trim(),
            sottospecialita: String(data.get("sottospecialita") || "").trim(),
            areeCliniche: String(data.get("areeCliniche") || "").trim(),
            patologieAssociate: String(data.get("patologieAssociate") || "").trim(),
            bio: String(data.get("bio") || "").trim(),
            cvBreve: String(data.get("cvBreve") || "").trim(),
            anniEsperienza: "",
            studioNome: "",
            indirizzo: "",
            citta: String(data.get("citta") || "").trim(),
            provincia: String(data.get("provincia") || "").trim(),
            regione: String(data.get("regione") || "").trim(),
            cap: String(data.get("cap") || "").trim(),
            subscriptionPlan: String(data.get("subscriptionPlan") || "").trim(),
            subscriptionStatus: String(data.get("subscriptionStatus") || "").trim(),
            agendaEnabled: data.get("agendaEnabled") === "on",
            paymentEnabled: data.get("paymentEnabled") === "on",
            paymentMode: String(data.get("paymentMode") || "in_studio"),
            visitPrice: Number(data.get("visitPrice") || 0),
            cancellationPolicy: String(data.get("cancellationPolicy") || "").trim(),
            status: String(data.get("status") || "bozza"),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const existing = getManagedSpecialists().filter((item) => item.id !== specialist.id);
        existing.push(specialist);
        saveManagedSpecialists(existing);
        refreshAdminDashboard();
        refreshSpecialistArea();
    }

    function refreshAdminDashboard() {
        const target = document.getElementById("admin-agenda-root");
        if (target) target.innerHTML = renderAdminDashboard();
    }

    function refreshSpecialistArea() {
        const target = document.getElementById("specialist-area-root");
        if (target) target.innerHTML = renderSpecialistArea();
    }

    function exportCountersCsv() {
        const counters = rebuildCounters();
        const headers = ["specialistId", "specialistName", "month", "quarter", "year", "totalBookings", "confirmedBookings", "cancelledBookings", "paidBookings", "unpaidBookings", "grossBookingValue", "aiutodocFeeValue"];
        const lines = [
            headers.join(","),
            ...counters.map((row) => headers.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))
        ];
        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "aiutodoc-contatori-agenda-mock.csv";
        link.click();
        URL.revokeObjectURL(url);
    }

    window.AiutoDocAgenda = {
        renderAgenda,
        renderAdminDashboard,
        refreshAdminDashboard,
        refreshSpecialistArea,
        getBookings,
        rebuildCounters
    };

    document.addEventListener("click", handleAgendaAction);
    document.addEventListener("submit", handleAdminSubmit);
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", refreshAdminDashboard);
        document.addEventListener("DOMContentLoaded", refreshSpecialistArea);
    } else {
        refreshAdminDashboard();
        refreshSpecialistArea();
    }
})();
