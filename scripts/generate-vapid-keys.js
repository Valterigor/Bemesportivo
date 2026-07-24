'use strict';

const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();

console.log('Configure estes valores nas variáveis de ambiente do Netlify:');
console.log(`WEB_PUSH_PUBLIC_KEY=${keys.publicKey}`);
console.log(`WEB_PUSH_PRIVATE_KEY=${keys.privateKey}`);
console.log('WEB_PUSH_SUBJECT=mailto:contato@bemesportivo.com');
console.log('');
console.log('A chave privada é secreta: não salve este resultado no Git.');
