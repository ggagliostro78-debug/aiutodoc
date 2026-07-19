const { execFileSync } = require('node:child_process');
const path = require('node:path');

const repository = path.resolve(__dirname, '..', '..');
const branch = execFileSync('git', ['branch', '--show-current'], { cwd: repository, encoding: 'utf8' }).trim();
const allowed = new Set(['aiutodoc-clinical-validation']);

if (!allowed.has(branch)) {
  console.error(`BLOCCATO: comando di validazione richiesto da branch non autorizzato: ${branch || '(detached)'}.`);
  console.error('Usare esclusivamente il branch aiutodoc-clinical-validation. Nessun deploy o merge automatico è consentito.');
  process.exit(1);
}

console.log(`AMBIENTE PARALLELO CONFERMATO: ${branch}. Produzione/main non saranno modificati.`);
