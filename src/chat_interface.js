// Chat UI, rendering and clipboard helpers.
class ChatInterface {
    constructor(containerId, onSend) {
        this.messagesContainer = document.getElementById('chat-messages');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.quickReplies = this._createQuickReplies();

        this.onSend = onSend;
        this.recoveryInput = document.getElementById('recovery-id-input');
        this.recoveryBtn = document.getElementById('recovery-btn');
        this._bindEvents();
    }

    _bindEvents() {
        window.handleUserSend = (text) => {
            console.log("App Engine: Ricevuto comando via Dispatcher ->", text);
            this.handleSendViaDispatcher(text);
        };

        if (this.recoveryBtn) {
            this.recoveryBtn.addEventListener('click', () => this.handleRecovery());
        }
        if (this.recoveryInput) {
            this.recoveryInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleRecovery();
            });
        }
    }

    _createQuickReplies() {
        const inputArea = document.querySelector('.chat-input-area');
        if (!inputArea || !inputArea.parentNode) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'quick-replies hidden';
        wrapper.setAttribute('aria-label', 'Risposte rapide');

        ['A', 'B', 'C'].forEach((choice) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quick-reply-btn';
            button.textContent = choice;
            button.addEventListener('click', () => {
                this.userInput.blur();
                this.handleSendViaDispatcher(choice);
            });
            wrapper.appendChild(button);
        });

        inputArea.parentNode.insertBefore(wrapper, inputArea);
        return wrapper;
    }

    _shouldShowQuickReplies() {
        const placeholder = this.userInput ? this.userInput.placeholder : '';
        return /A,\s*B\s*o\s*C/i.test(placeholder);
    }

    _syncQuickReplies() {
        if (!this.quickReplies) return;
        const show = !this.userInput.disabled && this._shouldShowQuickReplies();
        this.quickReplies.classList.toggle('hidden', !show);
        if (show) {
            this.userInput.blur();
            setTimeout(() => this.scrollToBottom(), 50);
        }
    }

    async handleRecovery() {
        const id = this.recoveryInput.value.trim();
        if (!id) return;

        console.log("Recovery: avviato recupero per ID", id);

        const allResults = JSON.parse(localStorage.getItem('aiutodoc_triages') || '{}');
        let saved = allResults[id];

        if (!saved) {
            console.log("Recovery: ID non presente in locale, cerco nel Cloud...");
            saved = await this._loadFromCloud(id);
            if (saved) {
                allResults[id] = saved;
                localStorage.setItem('aiutodoc_triages', JSON.stringify(allResults));
            }
        }

        if (saved) {
            const chatBtn = document.querySelector('.nav-btn[data-target="chat-section"]');
            if (chatBtn && !chatBtn.classList.contains('active')) {
                chatBtn.click();
            }

            this.addMessage(`Recupero triage ID: ${id}...`, 'user-msg');

            const inputArea = document.querySelector('.chat-input-area');
            if (inputArea) {
                inputArea.style.display = 'none';
            }

            this.displaySavedTriage(saved);
            this.recoveryInput.value = '';
        } else {
            alert("ID non trovato. Controlla il numero e riprova (gli ID sono universali se salvati online).");
        }
    }

    async _loadFromCloud(id) {
        if (window.firebaseReady) {
            await window.firebaseReady;
        }
        if (!db) return null;

        try {
            const docRef = db.collection("triages").doc(id);
            const doc = await docRef.get();

            if (doc.exists) {
                console.log("Cloud Recovery (Firebase): Triage trovato!");
                return doc.data();
            } else {
                console.log("Cloud Recovery (Firebase): Triage non trovato.");
            }
        } catch (err) {
            console.error("Cloud Recovery (Firebase) ERRORE:", err);
        }
        return null;
    }

    displaySavedTriage(saved) {
        this.currentTriageID = saved.id;
        window._currentTriageData = saved;

        let out = `
        <div id="printable-area">
        <div id="medical-disclaimer-start" style="background: var(--danger-bg); border: 1px solid #fecaca; color: var(--danger); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500;">
          ⚠️ ${escapeHTML(DISCLAIMER)}
        </div>
        ✅ <strong>Triage Recuperato (ID: ${escapeHTML(saved.id)})</strong>.<br>
        Data: ${escapeHTML(new Date(saved.date).toLocaleDateString('it-IT'))}<br><br>

        <div class="result-card-main" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 25px;">
            <h3 style="color: var(--primary); margin-top: 0;">🔍 Sintesi Anamnestica</h3>
            <p style="line-height: 1.6; color: #4a5568;">${escapeHTML(saved.result.sintesi_anamnestica || saved.result.patologia_presunta)}</p>
            
            <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: #f0f7f7; padding: 15px; border-radius: 10px;">
                    <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #1b9b9a; font-weight: bold; margin-bottom: 5px;">👨‍⚕️ Specialista Consigliato</span>
                    <strong style="font-size: 1.1rem; color: #2d3748;">${escapeHTML(saved.result.specialista_indicato)}</strong>
                </div>
                <div style="background: #fff9e6; padding: 15px; border-radius: 10px;">
                    <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #d48806; font-weight: bold; margin-bottom: 5px;">💡 Guida al Comportamento</span>
                    <p style="margin: 0; font-size: 0.9rem; color: #2d3748;">${escapeHTML(saved.result.preparazione_visita)}</p>
                </div>
            </div>
            
            <div style="margin-top: 20px; background: #fef2f2; padding: 15px; border-radius: 10px; border: 1px dashed #f87171;">
                <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #b91c1c; font-weight: bold; margin-bottom: 5px;">📑 Nota per l'Impegnativa (MMG)</span>
                <p style="margin: 0; font-style: italic; color: #374151;">"${escapeHTML(saved.result.impegnativa_medico)}"</p>
            </div>
        </div>
        `;

        let resultsHTML = "";
        const engine = new TriageEngine(() => {});
        saved.result.risultati.forEach(r => {
            resultsHTML += engine._buildCard(r.nome, saved.result.specialista_indicato, r.tipo, r.indirizzo_modalita, r.contatti, "Archivio", r.info);
        });
        out += resultsHTML + `</div>`;

        this.addMessage(out, 'system-msg');
    }

    handleSendViaDispatcher(text) {
        if (!text) return;
        this.addMessage(text, 'user-msg');
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        if (this.quickReplies) this.quickReplies.classList.add('hidden');
        this.setLoading(true);

        if (this.onSend) {
            this.onSend(text);
        }
    }

    handleSend() {
        const text = this.userInput.value.trim();
        this.handleSendViaDispatcher(text);
    }

    addMessage(content, type = 'system-msg') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        if (type === 'user-msg') {
            bubble.textContent = content;
        } else {
            bubble.innerHTML = sanitizeHTML(content);
        }

        bubble.querySelectorAll('.id-copy-box[data-triage-id]').forEach((el) => {
            el.addEventListener('click', () => {
                copyTriageID(el.dataset.triageId, el);
            });
        });

        const time = document.createElement('div');
        time.className = 'msg-time';
        const now = new Date();
        time.innerText = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        msgDiv.appendChild(bubble);
        msgDiv.appendChild(time);

        this.messagesContainer.appendChild(msgDiv);

        const disclaimerEl = msgDiv.querySelector('#medical-disclaimer-start');
        if (disclaimerEl) {
            setTimeout(() => {
                disclaimerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            this.scrollToBottom();
        }
    }

    setLoading(isLoading) {
        this.userInput.disabled = isLoading;
        this.sendBtn.disabled = isLoading;
        if (isLoading) {
            this.typingIndicator.classList.remove('hidden');
        } else {
            this.typingIndicator.classList.add('hidden');
            setTimeout(() => {
                this._syncQuickReplies();
                if (!this._shouldShowQuickReplies() && window.innerWidth > 950) {
                    this.userInput.focus();
                }
            }, 100);
        }
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.messagesContainer.children.length <= 1) return;

        window.requestAnimationFrame(() => {
            const behavior = window.innerWidth <= 950 ? 'auto' : 'smooth';
            this.messagesContainer.scrollTo({
                top: this.messagesContainer.scrollHeight,
                behavior
            });
        });
    }
}

window.copyTriageID = function(id, element) {
    if (!id) return;

    const copyToClipboard = (text) => {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            let textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful ? Promise.resolve() : Promise.reject();
            } catch (err) {
                document.body.removeChild(textArea);
                return Promise.reject(err);
            }
        }
    };

    copyToClipboard(id).then(() => {
        console.log("ID Copied to clipboard:", id);
        if (element) {
            const hint = element.querySelector('.copy-hint');
            if (hint) {
                const oldText = hint.innerHTML;
                hint.innerHTML = "✅ <span style='color:#fff; font-weight:bold;'>Copiato negli appunti!</span>";
                setTimeout(() => {
                    hint.innerHTML = oldText;
                }, 2500);
            }
        }
    }).catch(err => {
        console.error("Errore durante la copia:", err);
        alert("Non è stato possibile copiare l'ID automaticamente. Per favore terminalo manualmente: " + id);
    });
};
