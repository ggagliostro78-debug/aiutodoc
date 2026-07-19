# Proposta di tassonomia branca / specializzazione AIutoDoc

## Motivazione CTO

L'attuale indicazione della sola branca e troppo ampia per rappresentare correttamente l'orientamento e per confrontarlo con le competenze dichiarate dagli specialisti. `Cardiologia`, per esempio, non distingue aritmologia, scompenso cardiaco o cardiologia preventiva. Questa ambiguita riduce precisione del matching, qualita dei test e leggibilita dell'output.

La proposta introduce un livello separato di `specializzazione/sotto-area`, mantenendo una distinzione netta tra:

1. disciplina sanitaria generale;
2. competenza professionale piu specifica;
3. macro-aree trattate;
4. sintomi riferiti compatibili con l'orientamento;
5. segnali di allarme rilevati;
6. urgenza consigliata.

La tassonomia serve all'orientamento e al matching, non produce diagnosi, non prescrive trattamenti e non certifica competenze professionali. Patologie e sintomi sono metadati descrittivi: non implicano che l'utente abbia una determinata malattia.

## Modello dati minimo proposto

```json
{
  "taxonomy_version": "1.0.0",
  "branch": {
    "id": "cardiology",
    "label": "Cardiologia",
    "discipline_type": "medical"
  },
  "specialization": {
    "id": "cardiology_arrhythmology",
    "label": "Aritmologia",
    "parent_branch_id": "cardiology"
  },
  "treated_macro_areas": [
    {
      "id": "heart_rhythm_disorders",
      "label": "Disturbi del ritmo cardiaco"
    }
  ],
  "compatible_symptoms": [
    {
      "id": "palpitations",
      "label": "Palpitazioni",
      "status": "reported"
    }
  ],
  "red_flags": [
    {
      "id": "palpitations_with_syncope",
      "label": "Palpitazioni associate a perdita di coscienza",
      "status": "present",
      "reason": "Associazione riferita dall'utente"
    }
  ],
  "urgency": {
    "level": "high",
    "label": "Valutazione urgente",
    "reason": "Perdita di coscienza associata a sintomi cardiaci",
    "source": "clinical_rule_or_real_engine"
  }
}
```

### Campi e vincoli

| Campo | Funzione | Vincolo minimo |
|---|---|---|
| `branch` | Disciplina generale | `id`, `label`, `discipline_type` |
| `specialization` | Sotto-area professionale | `id`, `label`, `parent_branch_id` |
| `treated_macro_areas` | Ambiti/patologie trattate dallo specialista | Lista controllata; non equivale a diagnosi utente |
| `compatible_symptoms` | Sintomi compatibili con l'orientamento | Lista controllata con stato `reported`, `absent` o `unknown` |
| `red_flags` | Segnali clinici rilevanti | Stato, motivazione ed evidenza testuale separati dal disclaimer |
| `urgency` | Priorita dell'orientamento | Livello, etichetta, motivazione e origine |

Valori minimi consigliati per `urgency.level`: `low`, `routine_soon`, `priority`, `high`, `emergency`. Il livello `emergency` deve derivare da red flag effettive e non dal disclaimer generico.

Per evitare duplicazioni, gli identificativi devono essere stabili, in inglese tecnico o slug neutri, mentre le etichette restano localizzabili. La versione della tassonomia deve essere salvata insieme all'esito per rendere riproducibili test e report.

## Esempi per area

### Cardiologia

- Branca: `Cardiologia`.
- Specializzazioni/sotto-aree: Aritmologia; Cardiologia dello scompenso; Cardiologia preventiva; Cardiologia interventistica.
- Macro-aree trattate: disturbi del ritmo, cardiopatia ischemica, scompenso cardiaco, ipertensione e rischio cardiovascolare.
- Sintomi compatibili: palpitazioni, dolore toracico, dispnea da sforzo, ridotta tolleranza allo sforzo.
- Red flag: dolore toracico persistente, sincope associata a palpitazioni, dispnea severa, peggioramento improvviso.
- Urgenza: da programmata a emergenza, motivata dalle red flag effettivamente presenti.

### Neurologia

- Branca: `Neurologia`.
- Specializzazioni/sotto-aree: Neurologia neuromuscolare; Epilettologia; Neurologia cognitiva; Cefalee; Disturbi del movimento.
- Macro-aree trattate: malattie neuromuscolari, epilessia, disturbi cognitivi, cefalee, Parkinson e disturbi del movimento.
- Sintomi compatibili: debolezza progressiva, crisi riferite, tremore, cefalea ricorrente, alterazioni cognitive.
- Red flag: deficit neurologico improvviso, nuova perdita di coscienza, crisi prolungata, cefalea improvvisa e severa.
- Urgenza: prioritaria o emergenza quando insorgenza e segni associati lo richiedono.

### Psicologia

- Branca/area professionale: `Psicologia`, con `discipline_type: psychological_healthcare` per non presentarla impropriamente come specialita medica.
- Specializzazioni/sotto-aree: Psicologia clinica dell'adulto; Psicologia dell'eta evolutiva; Psicologia perinatale; Psico-oncologia; Neuropsicologia.
- Macro-aree trattate: disagio emotivo, stress, adattamento, supporto in malattia, difficolta evolutive e cognitive.
- Sintomi compatibili: ansia riferita, umore deflesso, insonnia correlata a stress, difficolta relazionali o di adattamento.
- Red flag: pensieri autolesivi o suicidari, rischio immediato per se o altri, grave alterazione dello stato mentale.
- Urgenza: ordinaria per supporto programmabile; emergenza e invio ai servizi appropriati in presenza di rischio immediato. Il matching deve distinguere Psicologo, Psicoterapeuta e Psichiatra in base a titolo e competenza verificata.

### Ortopedia

- Branca: `Ortopedia e Traumatologia`.
- Specializzazioni/sotto-aree: Chirurgia della spalla; Chirurgia del ginocchio; Chirurgia dell'anca; Chirurgia della mano; Ortopedia pediatrica; Colonna vertebrale.
- Macro-aree trattate: patologie articolari, traumi muscolo-scheletrici, lesioni tendinee/legamentose, deformita e disturbi dell'accrescimento.
- Sintomi compatibili: dolore articolare, limitazione funzionale, instabilita, gonfiore dopo trauma.
- Red flag: trauma ad alta energia, deformita evidente, deficit neurovascolare, impossibilita improvvisa al carico associata a trauma.
- Urgenza: programmata, prioritaria o urgente secondo trauma e compromissione funzionale/neurovascolare.

### Dermatologia

- Branca: `Dermatologia`.
- Specializzazioni/sotto-aree: Dermatologia oncologica; Dermatologia pediatrica; Dermatoscopia; Tricologia; Dermatologia allergologica.
- Macro-aree trattate: lesioni pigmentate, dermatosi infiammatorie, patologie di cute/capelli/unghie, allergie cutanee.
- Sintomi compatibili: prurito, rash, lesione che cambia aspetto, caduta di capelli, alterazioni ungueali.
- Red flag: reazione cutanea estesa con difficolta respiratoria, rapido coinvolgimento di mucose, lesione pigmentata con cambiamenti sospetti.
- Urgenza: programmata o prioritaria; emergenza solo in presenza di segni sistemici o respiratori effettivi.

## Impatto sul matching utenti/specialisti

Il matching proposto diventa gerarchico:

1. filtrare per branca compatibile;
2. aumentare il punteggio per sotto-area pertinente;
3. confrontare macro-aree trattate e sintomi compatibili;
4. applicare vincoli territoriali e di disponibilita;
5. in presenza di red flag, mostrare prima l'indicazione di urgenza e non trattare la ricerca dello specialista come sostituto dei servizi urgenti.

Un punteggio minimo trasparente potrebbe essere composto da: branca 40%, sotto-area 30%, macro-aree 20%, caratteristiche operative 10%. Le red flag non devono aumentare il ranking commerciale: devono modificare il percorso di sicurezza e l'urgenza.

Le competenze dello specialista devono provenire da informazioni pubbliche verificabili o da dichiarazioni professionali validate. Evitare inferenze automatiche da marketing, recensioni o semplice presenza di parole chiave. Mostrare sempre provenienza e data di aggiornamento.

Dal punto di vista privacy, i profili clinici dell'utente non devono essere conservati oltre il necessario per il matching. L'introduzione di nuovi campi persistenti richiederebbe una valutazione separata su consenso, minimizzazione, retention e informativa; questa proposta non autorizza tale persistenza.

## Impatto sui test clinico-funzionali

I test dovrebbero validare separatamente:

- `branch.id` e `branch.label`;
- coerenza di `specialization.parent_branch_id`;
- sotto-area attesa o insieme di sotto-aree accettabili;
- assenza di diagnosi implicite nelle macro-aree;
- sintomi positivi, negativi e non disponibili senza perdere la negazione;
- red flag strutturate, motivazione e separazione dal disclaimer;
- urgenza esplicita e coerente con le red flag;
- fallback sicuro quando la sotto-area non e determinabile;
- distinzione tra PASS TECNICO mocked e PASS CLINICO-FUNZIONALE da output reale;
- versione della tassonomia associata al risultato.

Il criterio di successo non deve richiedere sempre una sotto-area: quando i dati non bastano, `specialization` puo essere `null` con `reason: insufficient_information`, mantenendo valida la branca. Questo evita falsa precisione e riduce il rischio di orientamenti eccessivamente specifici.

## Stato di implementazione

**Nessuna modifica applicativa eseguita.**

Il presente documento e soltanto una proposta. Non sono stati modificati codice, prompt, API, schema database, CSS, layout, UX, dipendenze, test clinici o configurazioni di deploy. Non sono stati eseguiti test, merge o deploy in produzione.
