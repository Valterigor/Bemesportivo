# Notificações da rotina

O calendário funciona localmente sem configuração externa. O envio com o site fechado usa um Cloudflare Worker separado, ligado ao mesmo namespace KV do Pages e executado por Cron Trigger.

## Primeira implantação

Gere o par VAPID fora do repositório:

```powershell
npm run push:keys
```

Cadastre os segredos diretamente no Cloudflare:

```powershell
npx --yes wrangler@4.80.0 secret put WEB_PUSH_PUBLIC_KEY --config workers/wrangler.notifications.jsonc
npx --yes wrangler@4.80.0 secret put WEB_PUSH_PRIVATE_KEY --config workers/wrangler.notifications.jsonc
npx --yes wrangler@4.80.0 secret put WEB_PUSH_SUBJECT --config workers/wrangler.notifications.jsonc
```

`WEB_PUSH_SUBJECT` deve usar `mailto:bemesportivo@yahoo.com`. Nunca salve a chave privada no Git.

Depois dos segredos, publique o Worker:

```powershell
npm run deploy:notifications
```

## Componentes

- Cadastro e agenda: `functions/api/routine-notifications/[[path]].js`.
- Validação e armazenamento: `server/routine-notifications-core.mjs`.
- Envio agendado: `workers/routine-notifications.js`.
- Configuração: `workers/wrangler.notifications.jsonc`.
- Recebimento no navegador: `sw.js`.

## Proteção de dados

Títulos, categorias e conclusões permanecem no navegador. O servidor recebe somente a assinatura técnica, um identificador aleatório e os próximos horários de aviso. O conteúdo do push é genérico.
