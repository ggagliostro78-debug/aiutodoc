// Chat UI, rendering and clipboard helpers.
class ChatInterface {
    constructor(containerId, onSend) {
        this.messagesContainer = document.getElementById('chat-messages');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.typingIndicator = document.getElementById('typing-indicator');
        this.inputArea = document.querySelector('.chat-input-area');
        this.quickReplies = null;

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

        const pendingRecoveryId = this._consumePendingRecoveryId();
        if (pendingRecoveryId) {
            window.setTimeout(() => {
                this.handleRecovery(pendingRecoveryId);
            }, 120);
        }
    }

    _consumePendingRecoveryId() {
        try {
            const key = 'aiutodoc_pending_recovery_id';
            const pending = localStorage.getItem(key);
            if (!pending) return '';
            localStorage.removeItem(key);
            return String(pending).trim();
        } catch (error) {
            console.warn('Recovery pending ID non disponibile:', error);
            return '';
        }
    }

    _shouldShowQuickReplies() {
        const placeholder = this.userInput ? this.userInput.placeholder : '';
        return /A,\s*B(?:,\s*C)?\s*o\s*[CD]/i.test(placeholder) || Boolean(this._extractLatestChoices());
    }

    _hasLatestDetailChoicePrompt() {
        const messages = Array.from(this.messagesContainer.querySelectorAll('.message.system-msg .msg-bubble'));
        const latest = messages[messages.length - 1];
        return Boolean(latest && latest.querySelector('.detail-choice-btn[data-reply]'));
    }

    _extractLatestChoices() {
        const messages = Array.from(this.messagesContainer.querySelectorAll('.message.system-msg .msg-bubble'));
        const latest = messages[messages.length - 1];
        if (!latest) return null;

        const optionRows = Array.from(latest.querySelectorAll('.mcq-option[data-reply]'));
        if (optionRows.length >= 3) {
            const choices = {};
            optionRows.forEach((row) => {
                const reply = row.dataset.reply || '';
                const match = reply.match(/^([ABCD])\)\s*(.+)$/i);
                if (match) choices[match[1].toUpperCase()] = reply;
            });
            if (['A', 'B', 'C'].every((letter) => choices[letter])) return choices;
        }

        const text = latest.innerText || latest.textContent || '';
        const choices = {};
        text.split(/\n+/).forEach((line) => {
            const match = line.trim().match(/^([ABCD])\)\s*(.+)$/i);
            if (match) {
                const letter = match[1].toUpperCase();
                choices[letter] = `${letter}) ${match[2].trim()}`;
            }
        });

        return ['A', 'B', 'C'].every((letter) => choices[letter]) ? choices : null;
    }

    _enhanceMultipleChoiceBubble(bubble) {
        bubble.querySelectorAll('i').forEach((italicBlock) => {
            // Convert <br> nodes into real line breaks before reading text. innerText is
            // inconsistent on mobile and can merge A/B/C/D choices into a single line.
            const optionContent = italicBlock.cloneNode(true);
            optionContent.querySelectorAll('br').forEach((breakEl) => {
                breakEl.replaceWith(document.createTextNode('\n'));
            });
            const rawText = normalizeMedicalText(optionContent.textContent || '');
            const lines = rawText
                .split(/\n+/)
                .map((line) => line.trim())
                .filter(Boolean);

            const options = lines.map((line) => {
                const match = line.match(/^([ABCD])\)\s*(.+)$/i);
                return match ? { letter: match[1].toUpperCase(), text: match[2].trim() } : null;
            });

            if (options.length < 2 || options.some((option) => !option)) return;

            const list = document.createElement('div');
            list.className = 'mcq-options';
            list.dataset.testid = 'orientation-question';

            options.forEach((option) => {
                const row = document.createElement('div');
                row.className = 'mcq-option';
                row.setAttribute('role', 'button');
                row.setAttribute('tabindex', '0');
                row.dataset.reply = `${option.letter}) ${option.text}`;

                const badge = document.createElement('span');
                badge.className = 'mcq-letter';
                badge.textContent = option.letter;

                const text = document.createElement('span');
                text.className = 'mcq-text';
                text.textContent = option.text;

                row.appendChild(badge);
                row.appendChild(text);
                row.addEventListener('click', () => {
                    if (this.userInput.disabled || row.classList.contains('is-disabled')) return;
                    this._lockMultipleChoiceGroup(row);
                    this.handleSendViaDispatcher(row.dataset.reply);
                });
                row.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        if (this.userInput.disabled || row.classList.contains('is-disabled')) return;
                        this._lockMultipleChoiceGroup(row);
                        this.handleSendViaDispatcher(row.dataset.reply);
                    }
                });
                list.appendChild(row);
            });

            italicBlock.replaceWith(list);
        });
    }

    _lockMultipleChoiceGroup(selectedRow) {
        const group = selectedRow.closest('.mcq-options');
        if (!group || group.classList.contains('is-locked')) return;

        group.classList.add('is-locked');
        group.querySelectorAll('.mcq-option').forEach((row) => {
            const isSelected = row === selectedRow;
            row.classList.toggle('is-selected', isSelected);
            row.classList.add('is-disabled');
            row.setAttribute('aria-disabled', 'true');
            row.setAttribute('tabindex', '-1');
        });
    }

    _lockDetailChoiceGroup(selectedButton) {
        const group = selectedButton.closest('.detail-choice-actions');
        if (!group || group.classList.contains('is-locked')) return;

        group.classList.add('is-locked');
        group.querySelectorAll('.detail-choice-btn').forEach((button) => {
            button.disabled = true;
            button.classList.toggle('is-selected', button === selectedButton);
        });
    }

    _lockQuickReplies() {
        if (!this.quickReplies) return;
        this.quickReplies.querySelectorAll('.quick-reply-btn').forEach((button) => {
            button.disabled = true;
            button.setAttribute('aria-disabled', 'true');
        });
    }

    _updateQuickReplyLabels() {
        if (!this.quickReplies) return;
        const choices = this._extractLatestChoices();

        this.quickReplies.querySelectorAll('.quick-reply-btn').forEach((button) => {
            const letter = button.dataset.choice;
            const reply = choices && choices[letter] ? choices[letter] : letter;
            button.dataset.reply = reply;

            const letterEl = button.querySelector('.quick-choice-letter');
            const textEl = button.querySelector('.quick-choice-text');
            if (letterEl) letterEl.textContent = letter;
            if (textEl) textEl.textContent = reply.replace(/^[ABCD]\)\s*/, '');
        });
    }

    _syncQuickReplies() {
        const shouldHideTextInput = !this.userInput.disabled && (this._shouldShowQuickReplies() || this._hasLatestDetailChoicePrompt());
        if (this.quickReplies) {
            this.quickReplies.classList.add('hidden');
            this.quickReplies.classList.remove('desktop-choice-mode');
        }
        if (this.messagesContainer) {
            this.messagesContainer.classList.remove('choice-mode');
        }
        if (this.inputArea) {
            this.inputArea.classList.remove('desktop-choice-mode');
            this.inputArea.classList.toggle('choice-hidden', shouldHideTextInput);
        }
    }

    async handleRecovery(idOverride) {
        const sourceValue = typeof idOverride === 'string'
            ? idOverride
            : (this.recoveryInput ? this.recoveryInput.value : '');
        const id = String(sourceValue || '').trim();
        if (!id) return;
        const recoverySource = typeof idOverride === 'string'
            ? 'recovery_page_redirect'
            : 'manual_input';
        console.log("Recovery: avviato recupero per ID", id);

        trackEvent('recovery_requested', {
            recovery_source: recoverySource
        });

        const cleanID = normalizeTriageID(id);
        const allResults = getStoredTriages();
        let saved = allResults[cleanID];

        if (!saved) {
            console.log("Recovery: ID non presente in locale, cerco nel Cloud...");
            saved = await this._loadFromCloud(cleanID);
            if (saved) {
                saveStoredTriage(saved);
            }
        }

        if (saved) {
            trackEvent('recovery_success', {
                retrieval_mode: saved === allResults[cleanID] ? 'local' : 'cloud'
            });
            const chatBtn = document.querySelector('.nav-btn[data-target="chat-section"]');
            if (chatBtn && !chatBtn.classList.contains('active')) {
                chatBtn.click();
            }

            this.addMessage(`Recupero: Recupero ricerca ID: ${cleanID}...`, 'user-msg');

            const inputArea = document.querySelector('.chat-input-area');
            if (inputArea) {
                inputArea.style.display = 'none';
            }

            this.displaySavedTriage(saved);
            if (this.recoveryInput) {
                this.recoveryInput.value = '';
            }
        } else {
            trackEvent('recovery_failed', {
                retrieval_mode: 'unknown'
            });
            alert("ID non trovato. Controlla il numero e riprova (gli ID sono universali se salvati online).");
        }
    }

    async _loadFromCloud(id) {
        try {
            const response = await fetch((typeof CONFIG !== 'undefined' && CONFIG.TRIAGE_RECOVER_API_URL) ? CONFIG.TRIAGE_RECOVER_API_URL : "/api/triage-recover", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                console.log("Cloud Recovery (Firebase): Triage trovato!");
                const payload = await response.json();
                return payload.triage || null;
            }
            console.log("Cloud Recovery: codice non trovato o non disponibile.", response.status);
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
        <div id="medical-disclaimer-start" class="result-start" style="background: var(--danger-bg); border: 1px solid #fecaca; color: var(--danger); padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500;">
          Attenzione: ${escapeHTML(DISCLAIMER)}
        </div>
        <strong>OK: Ricerca recuperata (ID: ${escapeHTML(saved.id)})</strong>.<br>
        Data: ${escapeHTML(new Date(saved.date).toLocaleDateString('it-IT'))}<br><br>

        <div class="result-card-main" style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 25px;">
            <h3 style="color: var(--primary); margin-top: 0;">Sintesi Anamnestica</h3>
            <p style="line-height: 1.6; color: #4a5568;">${escapeHTML(normalizeMedicalText(saved.result.sintesi_anamnestica || saved.result.patologia_presunta))}</p>
            
            <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 20px 0;">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: #f0f7f7; padding: 15px; border-radius: 10px;">
                    <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #0F5464; font-weight: bold; margin-bottom: 5px;">Specialista Consigliato</span>
                    <strong style="font-size: 1.1rem; color: #2d3748;">${escapeHTML(normalizeMedicalText(saved.result.specialista_indicato))}</strong>
                    ${buildSpecialtyEvidenceHTML(saved.result.specialista_indicato)}
                </div>
                <div style="background: #fff9e6; padding: 15px; border-radius: 10px;">
                    <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #d48806; font-weight: bold; margin-bottom: 5px;">Guida al Comportamento</span>
                    <p style="margin: 0; font-size: 0.9rem; color: #2d3748;">${escapeHTML(normalizeMedicalText(saved.result.preparazione_visita))}</p>
                </div>
            </div>
            
            <div style="margin-top: 20px; background: #fef2f2; padding: 15px; border-radius: 10px; border: 1px dashed #f87171;">
                <span style="display: block; font-size: 0.8rem; text-transform: uppercase; color: #b91c1c; font-weight: bold; margin-bottom: 5px;">Nota per l'Impegnativa (MMG)</span>
                <p style="margin: 0; font-style: italic; color: #374151;">"${escapeHTML(normalizeMedicalText(saved.result.impegnativa_medico))}"</p>
            </div>
        </div>
        `;

        let resultsHTML = "";
        const engine = new TriageEngine(() => {});
        saved.result.risultati.forEach(r => {
            resultsHTML += engine._buildCard(r.nome, r.specializzazione || saved.result.specialista_indicato, r.tipo, r.indirizzo_modalita, r.contatti, r.fonte || "Archivio", r.info, r.url);
        });
        if (!resultsHTML) {
            resultsHTML = `
            <div class="triage-result">
              <div class="triage-result-header">
                Nessuna scheda specialistica disponibile <span class="tag-badge">Archivio</span>
              </div>
              <div class="triage-result-body">
                <p>Questa ricerca salvata non contiene schede pubbliche verificabili per specialisti o strutture.</p>
                <p>Puoi avviare una nuova ricerca ampliando la zona geografica.</p>
              </div>
            </div>`;
        }
        out += resultsHTML + `</div>`;

        this.addMessage(out, 'system-msg');
    }

    handleSendViaDispatcher(text) {
        if (!text) return;
        this._lockQuickReplies();
        this.addMessage(text, 'user-msg');
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        if (this.quickReplies) this.quickReplies.classList.add('hidden');
        if (this.quickReplies) this.quickReplies.classList.remove('desktop-choice-mode');
        if (this.messagesContainer) this.messagesContainer.classList.remove('choice-mode');
        if (this.inputArea) this.inputArea.classList.remove('desktop-choice-mode');
        if (this.inputArea) this.inputArea.classList.remove('choice-hidden');
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
        if (type.includes('clinical-emergency')) {
            msgDiv.dataset.testid = 'clinical-emergency-output';
        }

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        if (type === 'user-msg') {
            bubble.textContent = content;
        } else {
            bubble.innerHTML = sanitizeHTML(normalizeMedicalText(content));
            this._enhanceMultipleChoiceBubble(bubble);
        }

        bubble.querySelectorAll('.id-copy-box[data-triage-id]').forEach((el) => {
            el.addEventListener('click', () => {
                copyTriageID(el.dataset.triageId, el);
            });
        });

        bubble.querySelectorAll('.detail-choice-btn[data-reply]').forEach((button) => {
            button.addEventListener('click', () => {
                if (this.userInput.disabled || button.disabled) return;
                this._lockDetailChoiceGroup(button);
                this.handleSendViaDispatcher(button.dataset.reply);
            });
        });

        bubble.querySelectorAll('.register-and-save-triage, .save-triage-after-registration').forEach((button) => {
            button.addEventListener('click', async () => {
                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = "Salvataggio...";
                try {
                    await window.triageEngine.registerAndSavePendingTriage(button);
                } catch (error) {
                    alert(error.message || "Non è stato possibile completare la registrazione.");
                    button.disabled = false;
                    button.textContent = originalText;
                }
            });
        });

        const time = document.createElement('div');
        time.className = 'msg-time';
        const now = new Date();
        time.innerText = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

        msgDiv.appendChild(bubble);
        msgDiv.appendChild(time);

        this.messagesContainer.appendChild(msgDiv);

        const resultStartEl = msgDiv.querySelector('.result-start, #medical-disclaimer-start');
        if (resultStartEl) {
            setTimeout(() => {
                resultStartEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                if (window.innerWidth <= 950) {
                    this.scrollToBottom();
                }
            }, 100);
        }
        this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.messagesContainer.children.length <= 1) return;

        window.requestAnimationFrame(() => {
            const quickVisible = this.quickReplies && !this.quickReplies.classList.contains('hidden');
            const lastMessage = this.messagesContainer.lastElementChild;
            const resultStartEl = lastMessage ? lastMessage.querySelector('.result-start, #medical-disclaimer-start') : null;

            if (resultStartEl) {
                resultStartEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                return;
            }

            if (window.innerWidth <= 950) {
                if (lastMessage) {
                    lastMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
                setTimeout(() => {
                    if (!this.inputArea) return;
                    const inputStyle = window.getComputedStyle(this.inputArea);
                    const inputIsVisible = inputStyle.display !== 'none'
                        && inputStyle.visibility !== 'hidden'
                        && !this.inputArea.classList.contains('choice-hidden')
                        && !this.inputArea.classList.contains('onboarding-hidden');
                    if (inputIsVisible) {
                        this.inputArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                }, 180);
                return;
            }

            const target = lastMessage;
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'end' });
                setTimeout(() => {
                    if (!lastMessage) return;

                    const bottomBar = quickVisible ? this.quickReplies : this.inputArea;
                    if (!bottomBar) return;

                    const barStyle = window.getComputedStyle(bottomBar);
                    if (barStyle.display === 'none' || barStyle.visibility === 'hidden') return;

                    const barRect = bottomBar.getBoundingClientRect();
                    const lastRect = lastMessage.getBoundingClientRect();
                    const neededGap = quickVisible ? 18 : 22;
                    const overlap = lastRect.bottom - (barRect.top - neededGap);

                    if (overlap > 0) {
                        window.scrollBy({ top: overlap, behavior: 'smooth' });
                    }
                }, 120);
            }
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
                hint.innerHTML = "<span style='color:#fff; font-weight:bold;'>OK: Copiato negli appunti!</span>";
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

