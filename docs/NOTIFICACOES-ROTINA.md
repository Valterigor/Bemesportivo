# Notificações da rotina

O calendário funciona localmente sem configuração externa. O envio com o site fechado usa um Cloudflare Worker separado, ligado ao mesmo namespace KV do Pages e executado a cada minuto por Cron Trigger.

## Primeira implantação

Gere o par VAPID fora do repositório:

```powershell
npm run push:keys
```

Implante o Worker:

```powershell
npm run deploy:notifications
```

Cadastre os segredos quando solicitado ou execute:

```powershell
npx --yes wrangler@4.80.0 secret put WEB_PUSH_PUBLIC_KEY --config wrangler.notifications.jsonc
npx --yes wrangler@4.80.0 secret put WEB_PUSH_PRIVATE_KEY --config wrangler.notifications.jsonc
npx --yes wrangler@4.80.0 secret put WEB_PUSH_SUBJECT --config wrangler.notifications.jsonc
```

O valor de `WEB_PUSH_SUBJECT` deve ser `mailto:contato@bemesportivo.com`. Nunca salve a chave privada no Git. O arquivo `wrangler.notifications.jsonc` configura o Cron `* * * * *` e o binding `BE_DATA`.

Depois dos segredos, faça uma nova implantação do Worker. Na primeira execução ele publica somente a chave pública no KV; a API do Pages usa essa chave para cadastrar os navegadores.

## Componentes

- Cadastro e agenda: `functions/api/routine-notifications/[[path]].js`.
- Validação e armazenamento: `server/routine-notifications-core.mjs`.
- Envio agendado: `workers/routine-notifications.js`.
- Configuração do Worker: `wrangler.notifications.jsonc`.
- Recebimento no navegador: `sw.js`.

## Proteção de dados

Títulos, categorias e conclusões permanecem no navegador. O servidor recebe somente a assinatura técnica do navegador, um identificador aleatório e os próximos horários de aviso. O conteúdo do push é genérico.
