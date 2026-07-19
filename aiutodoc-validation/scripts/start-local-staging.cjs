const path = require('node:path');

process.env.PORT = process.env.PORT || '4273';
process.chdir(path.resolve(__dirname, '..', '..'));
console.log(`STAGING CLINICO LOCALE: http://127.0.0.1:${process.env.PORT}`);
console.log('Branch richiesto: aiutodoc-clinical-validation. Nessun deploy di produzione.');
require('../../scripts/dev-local.js');
