# Notificações da rotina

O calendário funciona localmente sem configuração externa. Para ativar o push em segundo plano no ambiente publicado, configure três variáveis no painel da Netlify em **Project configuration > Environment variables**:

- `WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT` com o valor `mailto:contato@bemesportivo.com`

Gere o par VAPID fora do repositório:

```powershell
npx web-push generate-vapid-keys --json
```

Nunca salve a chave privada no Git. Depois de configurar as variáveis, publique novamente o site. A função `send-routine-notifications` aparecerá como agendada e será executada a cada minuto, em UTC.

## Proteção de dados

Títulos, categorias e conclusões permanecem no navegador. O servidor recebe somente a assinatura técnica do navegador, um identificador aleatório e os próximos horários de aviso. O conteúdo do push é genérico.
