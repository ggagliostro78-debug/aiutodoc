# Mappa completa branche AiutoDoc

Analisi statica/documentale eseguita sul branch `aiutodoc-clinical-validation`, senza chiamate Gemini, senza Playwright clinico e senza testare produzione.

File/aree analizzate:

- `src/app_v3_standalone.js`
- `src/app_shared.js`
- `src/chat_interface.js`
- `aiutodoc-validation/test-cases.json`
- `aiutodoc-validation/expected-results.json`
- `aiutodoc-validation/reports/`

## Sintesi numerica

- Totale branche/aree clinico-funzionali rilevate: 31
- Branche validate con batch dedicato concluso: 5
- Branche/aree parzialmente validate tramite casi critici, normalizzazioni o test collegati: 10
- Branche/aree non validate con batch dedicato: 16
- Fonti specifiche presenti nel catalogo: 18 aree principali
- Fonti incomplete/generiche o potenzialmente improprie: 13 aree
- Emergenze locali rilevate: 5 strutturate esplicitamente + 6 intercettazioni generiche di segnali urgenti

Nota metodologica: “validata” significa batch clinico-funzionale dedicato concluso con criteri minimi superati o fix finale documentato. “Parzialmente validata” significa presenza di test/casi critici o normalizzazioni specifiche, ma assenza di batch dedicato completo.

## Tabella branche

| Branca canonica | Sinonimi/output rilevati | Sotto-aree | Fonti presenti | Stato validazione | Rischio | Priorità | Note |
|---|---|---|---|---|---|---|---|
| Cardiologia | Cardiologo; emergenza cardiologica; cardiovascolare | dolore toracico da sforzo; sindrome coronarica acuta possibile; scompenso; palpitazioni/aritmologia; crisi ipertensiva | NICE CG95 chest pain; fonti referral comuni | Validata | Alto | Completata | Batch 01 + fix CARDIO_04; emergenze locali per dolore toracico e crisi ipertensiva |
| Neurologia | Neurologo; emergenza neurologica; stroke unit | cefalee; parestesie; epilessia; FAST/ictus; neuromuscolare | NICE NG127 neurologia | Validata | Alto | Completata | Batch 02 + fix NEURO_04; neuromuscolare resta area parzialmente coperta |
| Psicologia / Psichiatria | Psicologo; psicoterapeuta; psichiatra; salute mentale urgente | ansia/panico; depressione; suicidarietà; psicosi; DCA adolescenziale | NICE CG123 mental health | Validata | Alto | Completata | Batch 03 + fix PSY_01; rischio suicidario coperto nei casi test |
| Ortopedia e Traumatologia | Ortopedico; traumatologo; emergenza neuro-ortopedica | rachide; cauda equina; ginocchio; spalla; caviglia/frattura | NICE NG59; NICE NG38; AAFP knee; NICE CKS shoulder | Validata | Alto | Completata | Batch 04 + fix; fonti muscoloscheletriche specifiche introdotte |
| Fisiatria / Medicina fisica e riabilitativa | Fisiatra; fisioterapia; riabilitazione | lombalgia; spalla; rachide; dolore muscoloscheletrico | Parziale via ortopedia/reumatologia; NICE NG59/shoulder | Parzialmente validata | Medio | Media | Compare come co-branca in Ortopedia; manca batch fisiatrico/riabilitativo dedicato |
| Dermatologia | Dermatologo; dermatoscopia; lesioni pigmentate | neo/melanoma sospetto; eczema/dermatite; impetigine; dermatologia pediatrica | NICE NG14; NICE CKS dermatitis; NICE CKS impetigo; fonte dermatologia generale | Validata | Alto | Completata | Batch 05 + fix; fonti specifiche presenti |
| Allergologia / Immunologia clinica | Allergologo; emergenza allergologica; patch test | anafilassi; angioedema; orticaria; dermatite allergica da contatto | NICE CKS anaphylaxis; fonte dermatite da contatto | Parzialmente validata | Alto | Alta | Coperta nei casi DERM_02/DERM_04; manca batch allergologia dedicato |
| Infettivologia | Infettivologo; infezione cutanea; cellulite/erisipela | infezioni cute; febbre/sintomi sistemici; rischio diabetico | NICE CKS cellulitis | Parzialmente validata | Alto | Alta | Coperta in DERM_03; manca batch infettivologia generale |
| Pediatria | Pediatra; pediatria; bambino | celiachia pediatrica; impetigine pediatrica; febbre under 5 come fonte generica | NICE NG143 fever under 5; NICE NG20 se celiachia; NICE CKS impetigo | Parzialmente validata | Alto | Alta | Rischio fonte pediatrica generica non pertinente se non prevale il mapping specifico |
| Gastroenterologia | Gastroenterologo | diarrea cronica; celiachia; reflusso/dispepsia; dolore addominale | NICE CG184 GERD/dyspepsia; NICE NG20 celiachia | Parzialmente validata | Alto | Alta | CELIACHIA_01/02 testate, ma manca batch gastro completo |
| Gastroenterologia pediatrica | Gastroenterologo pediatrico; pediatra gastroenterologo | celiachia; malassorbimento; crescita | NICE NG20 celiachia | Parzialmente validata | Alto | Alta | CELIACHIA_02 conforme; serve batch pediatrico GI più ampio |
| Pneumologia | Pneumologo | BPCO; dispnea; saturazione bassa; COVID/influenza fragili | NICE NG115 COPD | Parzialmente validata | Alto | Alta | INFLUENZA_02/COVID_02 validano red flag respiratorie, ma manca batch pneumologia |
| Medicina Generale / Medicina Interna | MMG; internista; medicina generale; medicina interna | primo filtro; anemia lieve; COVID/influenza lieve; multimorbidità | NICE NG56 multimorbidity | Parzialmente validata | Medio-Alto | Alta | ANEMIA_01, COVID_01, influenza lieve; manca batch cure primarie/interna |
| Medicina d'urgenza / Pronto Soccorso | PS; emergenza; 112/118; medico urgente | dolore toracico; ictus; crisi ipertensiva; anafilassi; cauda equina; frattura | Fonti indirette per branca specifica | Parzialmente validata | Alto | Alta | Output locale strutturato in più scenari; manca mappa emergenze generale |
| Ginecologia / Ostetricia | Ginecologo; ostetrico | menorragia; perdite mestruali; possibile secondo livello anemia | NICE NG88 heavy menstrual bleeding | Parzialmente validata | Medio | Media | Solo secondo livello ANEMIA_01; manca batch dedicato |
| Neuropsichiatria infantile | Neuropsichiatra infantile | DCA adolescenziale; neuromuscolare pediatrico; sviluppo | Fonte mental health generica; neurologia/pediatria indiretta | Parzialmente validata | Alto | Alta | PSY_05 e NEUROMUSCOLARE_01; serve batch età evolutiva |
| Urologia / Andrologia | Urologo; andrologo | LUTS; sintomi urinari; andrologia | NICE CG97 LUTS men | Non validata | Alto | Alta | Presente in catalogo fonti e search; nessun batch dedicato |
| Nefrologia | Nefrologo | CKD; urine/edemi/pressione; rischio rene | NICE NG203 CKD | Non validata | Alto | Alta | Fonte presente; nessun caso test dedicato |
| Endocrinologia / Diabetologia | Endocrinologo; diabetologo | diabete tipo 2; tiroide; endocrino-metabolico | NICE NG28; ISS/SNLG diabete tipo 2 | Non validata | Alto | Alta | Diabete usato come red flag in cardio/derm, ma branca non validata |
| Oculistica / Oftalmologia | Oculista; oftalmologo | glaucoma; vista offuscata; urgenze oculari | NICE NG81 glaucoma | Non validata | Alto | Alta | Vista offuscata compare come red flag crisi ipertensiva; nessun triage oculistico dedicato |
| Otorinolaringoiatria | Otorino; otorinolaringoiatra | ipoacusia; vertigini/orecchio; gola/naso | NICE NG98 hearing loss adults | Non validata | Medio | Media | Fonte presente ma limitata a ipoacusia |
| Reumatologia | Reumatologo | dolore articolare; autoimmune; infiammazione | Mappa su fonte ortopedica/fratture se match generico | Non validata | Medio-Alto | Media | Rischio fonte impropria: reumatologia cade su NG38 ortopedico |
| Ematologia | Ematologo | anemia; sospetto neoplasie ematologiche | NICE NG12 suspected cancer | Non validata | Alto | Alta | ANEMIA_01 indirizza correttamente a MMG/Interna; manca batch ematologia |
| Oncologia | Oncologo | sospetto tumore; dolore oncologico; invio oncologico | NICE NG12; ISS/SNLG dolore oncologico | Non validata | Alto | Alta | Fonte presente; nessun batch; alta sensibilità medico-legale |
| Odontoiatria | Dentista; odontoiatra | dolore dentale; infezioni odontogene | Nessuna fonte specifica rilevata | Non validata | Medio | Media | Presente nei filtri/search, non nel catalogo fonti |
| Nutrizione / Dietistica | Nutrizionista; dietista | DCA come secondo livello; nutrizione clinica | Nessuna fonte specifica autonoma | Non validata | Medio-Alto | Media | Rischio prescrizione/dieta impropria; nei DCA non deve essere unico riferimento |
| Angiologia / Chirurgia vascolare | Angiologo; vasi | vascolare periferico; edema; ischemia | Nessuna fonte specifica rilevata | Non validata | Alto | Media-Alta | Presente nei filtri/search; manca mapping fonti e test |
| Senologia | Senologo; senologia | nodulo mammario; screening | Nessuna fonte specifica rilevata | Non validata | Alto | Media-Alta | Presente nei filtri/search; alta sensibilità oncologica |
| Logopedia | Logopedista; logopedia | linguaggio; deglutizione; riabilitazione | Nessuna fonte specifica rilevata | Non validata | Medio | Bassa-Media | Presente nei filtri/search; attenzione a red flag neurologiche |
| Podologia | Podologo; podologia | piede diabetico; unghie/piede | Nessuna fonte specifica rilevata | Non validata | Medio-Alto | Media | Rischio sottotriage piede diabetico/infezioni |
| Fisioterapia | Fisioterapista; fisioterapia | riabilitazione; dolore meccanico | Nessuna fonte autonoma; indiretta via Fisiatria/Ortopedia | Non validata | Medio | Bassa-Media | Deve restare secondo livello, non sostituire valutazione medica in red flag |

## Branche validate

| Branca | Batch | Casi | Stato | Fix principali | Report |
|---|---:|---:|---|---|---|
| Cardiologia | Batch 01 | 5 + rerun/fix mirati | Validata dopo fix | CARDIO_05 temporalità infarto remoto; CARDIO_02 emergenza locale strutturata; CARDIO_01 escalation condizionale; CARDIO_04 crisi ipertensiva sintomatica 112/PS | `batch-01-cardiologia-fix.md`, `cardio04-hypertensive-crisis-fix.md` |
| Neurologia | Batch 02 | 5 + fix NEURO_04 | Validata dopo fix | FAST/ictus con 112/118, PS e stroke unit; output locale strutturato | `batch-02-neurologia.md`, `neuro04-stroke-fast-fix.md` |
| Psicologia/Psichiatria | Batch 03 | 5 + fix PSY_01 | Validata dopo fix | Attacchi di panico stabili a urgenza bassa/programmata; rischio suicidario e psicosi coperti nel batch | `batch-03-psicologia-psichiatria.md`, `psy01-panic-urgency-fix.md` |
| Ortopedia | Batch 04 | 5 + fix/rerun 4 casi | Validata dopo fix | Lombalgia meccanica non urgente; fonti ginocchio/spalla/caviglia; cauda equina già PASS | `batch-04-ortopedia-fix.md` |
| Dermatologia | Batch 05 | 5 | Validata dopo fix | Fonti dermatologiche/allergologiche; DERM_04 anafilassi 112/118; DERM_01 neo senza falso PS | `batch-05-dermatologia-fix.md` |

## Branche non validate

| Branca | Rischio clinico | Rischio fonti | Rischio PS/112 | Priorità | Batch proposto |
|---|---|---|---|---|---|
| Gastroenterologia | sanguinamento GI, dolore addominale acuto, disidratazione, celiachia/IBD | CG184 troppo centrata su reflusso se usata genericamente | Medio-Alto | Alta | Batch 06 |
| Pneumologia | dispnea, saturazione bassa, BPCO, asma, embolia/polmonite | NG115 COPD non copre tutto il respiratorio | Alto | Alta | Batch 07 |
| Urologia/Nefrologia | ritenzione urinaria, colica, ematuria, infezione/rene, AKI | fonti separate ma batch unico iniziale utile | Medio-Alto | Alta | Batch 08 |
| Endocrinologia/Diabetologia | ipo/iperglicemia, piede diabetico, tireotossicosi | buona per T2D, incompleta per tiroide/surrene | Medio-Alto | Alta | Batch 09 |
| Ginecologia/Ostetricia | gravidanza, sanguinamento, dolore pelvico, menorragia | NG88 copre solo sanguinamento mestruale abbondante | Alto | Alta | Batch 10 |
| Pediatria generale | febbre, disidratazione, crescita, respiro, rash | rischio fonte under 5 non pertinente per età maggiori | Alto | Alta | Batch 11 |
| Medicina Generale/Interna | triage cure primarie vs specialista/PS | NG56 generica | Medio-Alto | Alta | Batch 12 |
| Allergologia | anafilassi vs allergia lieve; angioedema | fonte anafilassi presente; allergie non anafilattiche incomplete | Alto | Media-Alta | Batch 13 |
| Infettivologia | sepsi, febbre persistente, immunodepressione | mappata solo cellulite | Alto | Media-Alta | Batch 14 |
| Oculistica | perdita visiva, dolore occhio, glaucoma/acuto | NG81 glaucoma non copre retina/trauma | Alto | Alta | Batch 15 |
| ORL | ipoacusia, vertigine, epistassi, gola | NG98 solo hearing loss | Medio | Media | Batch 16 |
| Reumatologia | artrite acuta, arterite temporale, autoimmune | fonte attuale rischia caduta ortopedica | Medio-Alto | Media-Alta | Batch 17 |
| Ematologia/Oncologia | anemia grave, sospetto tumore, linfonodi, calo peso | NG12 ampia; rischio ansia/sottotriage | Alto | Alta | Batch 18 |
| Neuropsichiatria infantile | sviluppo, neuromuscolare, crisi, DCA | fonti indirette | Alto | Alta | Batch 19 |
| Odontoiatria/Maxillo-facciale | ascesso, trauma, trisma, cellulite odontogena | assenti | Medio-Alto | Media | Batch 20 |
| Professioni sanitarie/riabilitative | fisioterapia, logopedia, podologia, nutrizione | assenti o indirette | Medio | Media-Bassa | Batch 21 |

## Mapping fonti

| Branca | Fonte attuale | Pertinenza | Problemi | Fix consigliato |
|---|---|---|---|---|
| Neurologia | NICE NG127 | Alta | Non copre in modo specifico epilessia/stroke emergency | Aggiungere fonti stroke/TIA e crisi epilettiche per casi dedicati |
| Cardiologia | NICE CG95 chest pain | Alta per dolore toracico | Meno specifica per scompenso, aritmie, crisi ipertensiva | Aggiungere linee guida scompenso, fibrillazione/palpitazioni, ipertensione severa |
| Dermatologia melanoma | NICE NG14 | Alta | Nessuno rilevante nei casi DERM_01 | Mantenere priorità su pattern lesione pigmentata |
| Dermatite/eczema | NICE CKS dermatitis contact | Alta | Copre contatto; eczema atopico può richiedere fonte diversa | Aggiungere eczema/atopic dermatitis se batch lo include |
| Cellulite/erisipela | NICE CKS cellulitis acute | Alta | Non copre tutte infezioni cutanee | Mantenere fonte specifica per DERM_03; aggiungere sepsi/infezioni sistemiche |
| Anafilassi | NICE CKS angio-oedema and anaphylaxis | Alta | Nessuno per DERM_04 | Mantenere priorità fonte prima di allergologia generica |
| Impetigine | NICE CKS impetigo | Alta | Nessuno per DERM_05 | Mantenere |
| Ortopedia rachide | NICE NG59 | Alta per lombalgia | Rischio improprio su ginocchio/spalla già corretto | Tenere match ristretto a lombalgia/sciatica |
| Fratture/traumi | NICE NG38 | Alta per fratture non complesse | Generica per ortopedia non traumatica | Usare solo per frattura/lussazione/trauma acuto |
| Ginocchio | AAFP knee pain initial evaluation | Media-Alta | Fonte USA non NICE, ma pertinente | Valutare fonte NICE/BOA se disponibile in futuro |
| Spalla | NICE CKS shoulder pain | Alta | Nessuno rilevante | Mantenere |
| Oculistica | NICE NG81 glaucoma | Media | Troppo stretta per vista offuscata/urgenze oculari | Aggiungere red eye, retinal detachment, acute vision loss |
| Ginecologia | NICE NG88 heavy menstrual bleeding | Media-Alta | Copre menorragia, non gravidanza/dolore pelvico | Aggiungere gravidanza extrauterina/sanguinamento gravidanza/dolore pelvico |
| Celiachia | NICE NG20 | Alta | Rischio caduta su Pediatria NG143 se match non specifico | Mantenere mapping celiachia prima di pediatria generica |
| Pediatria | NICE NG143 fever under 5 | Bassa-Media | Impropria per bambini >5 o patologie non febbrili | Rendere fonte pediatrica contestuale, non default unico |
| Gastroenterologia | NICE CG184 GERD/dyspepsia | Media | Troppo stretta per IBD, sanguinamento, celiachia, dolore acuto | Ampliare fonti GI per allarme addominale e malassorbimento |
| Pneumologia | NICE NG115 COPD | Media-Alta per BPCO | Non copre asma, polmonite, embolia, COVID lieve | Aggiungere asma, pneumonia, COVID/viral respiratory |
| Salute mentale | NICE CG123 | Media-Alta | Non specifica suicidio, psicosi, DCA | Aggiungere self-harm/suicide, psychosis, eating disorders |
| Urologia | NICE CG97 LUTS men | Media | Non copre donna, ematuria, colica, infezioni | Aggiungere UTI, renal colic, haematuria referral |
| Endocrino/diabete | NICE NG28 + ISS/SNLG diabete | Alta per T2D | Incompleta per tiroide e urgenze glicemiche | Aggiungere thyroid disease, hypoglycaemia/hyperglycaemia red flags |
| Nefrologia | NICE NG203 CKD | Alta per CKD | Non copre colica/AKI/urgenze acute | Aggiungere AKI e ematuria/proteinuria |
| ORL | NICE NG98 hearing loss | Media | Solo ipoacusia | Aggiungere vertigine acuta, epistassi, tonsillitis red flags |
| Oncologia/Ematologia | NICE NG12 + ISS dolore oncologico | Media-Alta | Rischio eccesso allarme se usata genericamente | Separare sospetto tumore, ematologia e dolore oncologico |
| Medicina Generale/Interna | NICE NG56 multimorbidity | Media | Fonte molto generale | Aggiungere criteri cure primarie e red flag per rinvio |
| Reumatologia | NG38 via match ortopedico/reumatologico | Bassa | Fonte potenzialmente errata | Aggiungere fonti artrite infiammatoria, arterite temporale, connettiviti |
| Odontoiatria, Senologia, Angiologia, Logopedia, Podologia, Nutrizione, Fisioterapia | Nessuna fonte specifica rilevata | Incompleta | Caduta su fonti comuni metodologiche | Aggiungere fonti specifiche o limitare output fino a validazione |

## Emergenze locali

| Emergenza | Trigger | Branca | Output 112/PS | Stato | Rischio residuo |
|---|---|---|---|---|---|
| FAST / sospetto ictus | bocca/viso storto + deficit braccio + linguaggio confuso + esordio recente/improvviso | Emergenza neurologica / ictus | 112/118, PS, stroke unit | Strutturata e validata con NEURO_04 | Sensibilità su varianti linguistiche non testate |
| Dolore toracico acuto con red flag | dolore con irradiazione braccio/mandibola, sudorazione fredda, nausea/dispnea/diabete | Emergenza cardiologica / PS | 112/118 o PS immediato | Strutturata e validata con CARDIO_02 | Può perdere formulazioni atipiche senza irradiazione testuale |
| Crisi ipertensiva sintomatica | pressione severa >=180 sistolica o >=120 diastolica + cefalea/vista offuscata/confusione/dolore toracico/dispnea/sincope | Emergenza cardiovascolare / emergenza medica | 112/118 o PS | Strutturata e validata con CARDIO_04 | Non deve attivarsi su ipertensione isolata senza sintomi |
| Segnali urgenti generici | dispnea, dolore toracico, feci nere/melena/emorragia, perdita coscienza, infarto ora, suicidio, richiamo emergenza | Medicina d'urgenza | 112/118 o PS | Presente ma generico | Rischio sovratriage se sintomi negati non rimossi; mitigazione negazioni presente |
| Anafilassi possibile | frutta secca + orticaria diffusa + gonfiore labbra/lingua + gola che si chiude + respiro difficile + stordimento | Emergenza allergologica / PS | 112/118 o PS | Normalizzata e validata con DERM_04 | Non è blocco locale pre-Gemini nel codice emergenze generico; dipende da normalizzazione post-Gemini |
| Cauda equina | dolore lombare bilaterale + difficoltà urinare + intorpidimento genitale/interno cosce + debolezza gambe | Emergenza neuro-ortopedica / PS | 112/118 o PS | Validata in ORTO_02 | Non risulta come blocco locale dedicato nel codice estratto; dipende da Gemini/test |
| Trauma/frattura con segni vascolari | trauma caviglia + deformità/gonfiore + impossibilità carico + dita fredde/pallide | Emergenza ortopedico-traumatologica | PS immediato; 112 se trasporto non sicuro/segni vascolari | Validata in ORTO_05 | Non risulta blocco locale generico; dipende da output Gemini/normalizzazione |
| Rischio suicidario | parole chiave suicidio/uccidersi/farla finita; PSY_03 piano e mezzi | Emergenza psichiatrica | PS/servizi emergenza; 112/118 auspicabile | Validata in PSY_03, trigger generico presente | Necessario rafforzare output locale strutturato specifico salute mentale |
| Dispnea grave / saturazione bassa | dispnea/difficoltà respiratoria; saturazione <=93 | Medicina d'urgenza / Pneumologia | PS/112 se severa | Parzialmente validata in COVID_02/INFLUENZA_02 | Serve batch Pneumologia per soglie, BPCO, saturazione 91-93 |
| Sanguinamento / melena | feci nere/scure, melena, emorragia | Medicina d'urgenza / Gastroenterologia/Interna | PS/medico urgente | Parzialmente validata in ANEMIA_02 | Serve batch Gastroenterologia |
| Perdita di coscienza/sincope | perdita coscienza, privo di coscienza, svenimento improvviso | Medicina d'urgenza / Cardiologia/Neurologia | PS/112 generico | Parziale | Distinguere sincope attuale, prima crisi risolta, trauma |

## Gap principali

- Branche senza fonti specifiche: Odontoiatria, Senologia, Angiologia, Logopedia, Podologia, Nutrizione/Dietistica, Fisioterapia.
- Branche con fonti troppo strette: Gastroenterologia, Pneumologia, ORL, Oculistica, Pediatria, Salute mentale.
- Branche con fonte potenzialmente errata: Reumatologia mappata su fonte ortopedica/fratture; Pediatria generica su febbre under 5 anche per età/patologie diverse se non prevalgono match specifici.
- Branche senza batch dedicato ma con rischio alto: Gastroenterologia, Pneumologia, Urologia/Nefrologia, Endocrinologia/Diabetologia, Ginecologia/Ostetricia, Pediatria, Oculistica, Ematologia/Oncologia.
- Specialista troppo generico possibile in branche non validate: “Medico specialista”, “Medico di Medicina Generale”, “Dermatologo/Allergologo” senza sotto-area, “Neurologo” senza centro cefalee/epilettologia/stroke unit se non normalizzato.
- Rischio sovratriage: ansia/panico, lombalgia meccanica, rash lieve, impetigine lieve, palpitazioni senza sincope/dolore, ipertensione isolata.
- Rischio sottotriage: dispnea/saturazione bassa, dolore toracico atipico, FAST incompleto, crisi ipertensiva sintomatica, anafilassi, cauda equina, emorragia/melena, rischio suicidario, dolore occhio/perdita visiva, gravidanza con dolore/sanguinamento.
- Branche pediatriche non sempre distinte dall’adulto: Pediatria generale, Gastroenterologia pediatrica, Dermatologia pediatrica, Neuropsichiatria infantile, DCA adolescenziale.
- Branche in cui serve differenziare SSN/privato/PS: Emergenza, Cardiologia, Neurologia stroke, Ortopedia trauma, Oncologia/Ematologia, Pediatria, Ginecologia/Ostetricia.
- Branche in cui serve distinguere MMG da specialista: Medicina Generale/Interna, Gastroenterologia, Pneumologia, Dermatologia, Ortopedia/Fisiatria, Ginecologia, Endocrinologia, Urologia/Nefrologia.

