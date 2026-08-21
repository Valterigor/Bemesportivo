'use strict';

const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();

console.log('Configure estes valores como segredos do Worker de notificações na Cloudflare:');
console.log(`WEB_PUSH_PUBLIC_KEY=${keys.publicKey}`);
console.log(`WEB_PUSH_PRIVATE_KEY=${keys.privateKey}`);
console.log('WEB_PUSH_SUBJECT=mailto:bemesportivo@yahoo.com');
console.log('');
console.log('A chave privada é secreta: não salve este resultado no Git nem nas variáveis do Pages.');
