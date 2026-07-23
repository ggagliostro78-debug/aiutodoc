# Fix routing domande anamnestiche

Data: 2026-07-11  
Branch: `aiutodoc-clinical-validation`  
Tipo attività: correzione metodologica del secondo blocco domande, senza nuovi batch clinico-funzionali.

## Obiettivo

Rendere le domande anamnestiche il più possibile aderenti alla branca/specialità pertinente, evitando che parole isolate o negate attivino blocchi di domande di altre branche.

## Problema risolto

Il generatore precedente selezionava le domande tramite parole chiave anatomiche/sintomatiche isolate. Questo causava routing non pertinente, per esempio:

- cefalea con “non ho rigidità del collo” → domande schiena/collo;
- dolore toracico con mandibola → domande dentali;
- crisi ipertensiva con vista offuscata → domande oculistiche;
- scompenso con caviglie gonfie → domande piede/caviglia;
- panico con nodo alla gola → domande ORL;
- DCA con “non ho dolore al petto” → domande cardiologiche;
- ginocchio con “deformità evidente” → falso match dentale.

## Modifiche applicate

- Aggiunto routing specialistico prioritario per le branche già validate:
  - Cardiologia;
  - Neurologia;
  - Psicologia/Psichiatria;
  - Ortopedia/Fisiatria;
  - Dermatologia/Allergologia/Infettivologia cutanea/Pediatria dermatologica.
- Aggiunta normalizzazione del testo attivo per ignorare segmenti negati nel routing domande.
- Resi più restrittivi i trigger per evitare collisioni:
  - DCA richiede riferimenti espliciti a cibo/peso/immagine corporea/paura di ingrassare;
  - cefalea non viene più attivata dalla sola parola “testa” in contesti come “sopra la testa”;
  - anafilassi, cauda equina, ictus/FAST e crisi ipertensiva sintomatica hanno priorità sui blocchi ordinari;
  - dermatoscopia/neo, eczema, cellulite, impetigine pediatrica hanno blocchi propri.
- Aggiunta opzione:
  - `D) Nessuna delle precedenti`
  a domande conoscitive e anamnestiche, senza modifiche CSS/grafiche.
- Aggiornata validazione input per accettare `A`, `B`, `C` o `D`.
- Aggiornati placeholder e messaggi guida da `A, B o C` a `A, B, C o D`.

## Esito statico sui 25 casi delle branche validate

| Branca | Casi | Esito routing dopo fix |
|---|---:|---|
| Cardiologia | 5 | Coerente con dolore toracico, palpitazioni, crisi ipertensiva e scompenso |
| Neurologia | 5 | Coerente con cefalea, parestesie, FAST/ictus e prima crisi convulsiva |
| Psicologia/Psichiatria | 5 | Coerente con panico, depressione, rischio suicidario, psicosi e DCA |
| Ortopedia | 5 | Coerente con lombalgia, cauda equina, ginocchio, spalla e caviglia |
| Dermatologia | 5 | Coerente con neo, eczema, cellulite, anafilassi e impetigine pediatrica |

## Verifiche eseguite

- Simulazione statica locale della funzione `_generaDomandeAnamnestiche()` sui 25 casi già validati.
- `npm run check`: PASS.
- `npm run build`: PASS.

## Vincoli rispettati

- Nessuna modifica a `main`.
- Nessun merge, push, PR o deploy.
- Nessun test su produzione.
- Nessuna chiamata Gemini.
- Nessun Playwright clinico.
- Nessun nuovo batch clinico-funzionale.
- Nessuna modifica CSS, grafica, layout o UX visiva.
- Nessuna modifica a documenti legali, database, Netlify, analytics, privacy o consensi.

## Nota QA

La quarta risposta “Nessuna delle precedenti” riduce il rischio che l’utente scelga una risposta forzata o fuorviante. La risposta viene accettata come scelta strutturata `D` e resta disponibile al motore come dato raccolto, senza trasformarla in diagnosi o prescrizione.

