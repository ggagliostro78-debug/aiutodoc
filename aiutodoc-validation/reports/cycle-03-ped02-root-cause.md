# PED_02 - Root cause stato 5C

## Esito

`ROOT CAUSE: ERRORE RUNNER`

Il prodotto completa correttamente la raccolta dell'eta. Il runner precedente considerava conclusa la transizione solo quando `triageEngine.state` diventava diverso da `5C_DETTAGLIO_CONDIZIONATO`; questa assunzione e errata, perche `5C` rappresenta l'intera coda dei dettagli condizionati. Dopo `exact_age`, il caso pediatrico richiede anche `weight_kg` e `height_cm`, quindi lo stato resta `5C` mentre `currentConditionalDetail` avanza.

## Ispezione statica

Percorso completo:

1. `index.html:1435` associa il click di `#send-btn` a `handleInternalSend()`.
2. `handleInternalSend()` legge `#user-input.value.trim()` e invoca `window.handleUserSend(value)`.
3. `ChatInterface._bindEvents()` collega il dispatcher a `handleSendViaDispatcher()`; questo conserva il testo, pulisce il campo e invoca il callback del motore.
4. `TriageEngine.processUserInput()`, nello stato `5C_DETTAGLIO_CONDIZIONATO`, chiama `_handleConditionalDetailInput()` (`src/app_v3_standalone.js:1532`).
5. `_handleConditionalDetailInput()` accetta per `exact_age` solo un intero fra 0 e 120, salva `userData.exact_age` e `userData.age`, quindi chiama `_askNextConditionalDetailOrFinalNote()` (`src/app_v3_standalone.js:302`).
6. `_prepareConditionalDetailsQueue()` inserisce per la fascia pediatrica `exact_age`, `weight_kg` e `height_cm` (`src/app_v3_standalone.js:270`).
7. `_askNextConditionalDetailOrFinalNote()` mantiene lo stato `5C` finche la coda contiene un altro dettaglio e cambia `currentConditionalDetail` (`src/app_v3_standalone.js:280`).

Non sono presenti debounce. Il messaggio UI e reso con un ritardo di 120 ms dal callback in `app_bootstrap.js`, ma stato, dettaglio corrente e placeholder vengono aggiornati sincronicamente. Questo ritardo non impedisce la transizione.

## DOM reale

- URL: `http://127.0.0.1:4273/`.
- Stato iniziale: `5C_DETTAGLIO_CONDIZIONATO`; dettaglio: `exact_age`.
- Campo realmente usato: unico `textarea#user-input`, `data-testid="symptom-input"`, senza `name` e senza `aria-label`.
- Placeholder: `Inserisci l'eta precisa. Es. 47` nella rappresentazione normalizzata.
- Campo visibile, abilitato, non readonly e modificabile; bounding box circa `966 x 57.5` px.
- Pulsante: unico `button#send-btn`, testo/aria `Invia`, visibile e abilitato.
- Un selettore semantico generico trova 11 elementi: dieci radio nascosti della fascia di eta iniziale e il solo textarea visibile. Non esistono cloni o duplicati di `#user-input` o `#send-btn`.
- Il textarea resta lo stesso nodo prima e dopo l'invio; nessun re-render lo sostituisce.

## Tabella metodi

| Metodo | Campo corretto | Valore letto | Eventi | Pulsante | Transizione | Errore console | Esito |
|---|---|---|---|---|---|---|---|
| A - `fill`, blur, click | SI | DOM `7`; app `exact_age=7` | focus, beforeinput, input, change, blur | Visibile e abilitato | `exact_age` -> `weight_kg`; stato resta `5C` | Nessuna eccezione; solo warning fallback validazione sintomo | PASS |
| B - focus, digitazione sequenziale, Tab | SI | DOM `7`; app `exact_age=7` | focus, keydown, beforeinput, input, change, blur | Visibile e abilitato | `exact_age` -> `weight_kg`; stato resta `5C` | Nessuna eccezione; solo warning fallback validazione sintomo | PASS |
| C - setter nativo ed eventi | SI | DOM `7`; app `exact_age=7` | input, change, blur | Visibile e abilitato | `exact_age` -> `weight_kg`; stato resta `5C` | Nessuna eccezione; solo warning fallback validazione sintomo | PASS |
| D - interazione Chromium equivalente all'utente | SI | DOM `7`; app `exact_age=7` | focus, keydown, beforeinput, input, change, blur | Click tramite coordinate reali | `exact_age` -> `weight_kg`; stato resta `5C` | Nessuna eccezione; solo warning fallback validazione sintomo | PASS |

In tutte le sessioni il campo e rimasto lo stesso nodo. Le mutazioni osservate riguardano classi, `disabled` e placeholder; non vi sono rimozioni o sostituzioni. `pageerror`: 0. Gemini: 0 richieste. Ricerca specialisti, places ed enrichment: 0 chiamate esterne.

## Distinzione runner/prodotto

L'evidenza distingue nettamente il runner dal prodotto:

- quattro modalita di input differenti producono lo stesso salvataggio `exact_age=7`;
- la funzione applicativa legge correttamente il valore;
- la validazione accetta `7`;
- il dettaglio corrente avanza da `exact_age` a `weight_kg`;
- il runner precedente osservava soltanto che `state === 5C` e interpretava erroneamente la permanenza come blocco.

Riproducibilita: 4/4 sessioni. Gravita prodotto: nessun difetto riprodotto. Gravita runner: media, perche genera falsi FAIL e impedisce la chiusura tecnica.

## Modifica minima futura

Non serve alcuna modifica al prodotto. Il runner di chiusura dovra:

- considerare riuscita l'eta quando `userData.exact_age === 7` e `currentConditionalDetail !== "exact_age"`;
- continuare la coda compilando separatamente `weight_kg` e `height_cm`, senza attendere l'uscita immediata dallo stato `5C`;
- attendere `currentConditionalDetail` o il placeholder semantico corretto, non un cambio dello stato generale.

Regressioni da eseguire in seguito: `PED_02`, raccolta eta pediatrica nelle fasce 0-2/3-5/6-12/13-17, ordine eta-peso-altezza, percorsi con sola eta e interazioni tastiera/click. Nessuna di queste regressioni e stata eseguita in questo task diagnostico.

`ROOT CAUSE: ERRORE RUNNER`
