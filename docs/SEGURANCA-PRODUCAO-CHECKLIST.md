# Checklist obrigatório antes da publicação

O deploy de contas e sincronização não deve ser aprovado enquanto algum item crítico estiver pendente.

## Supabase

- [ ] Aplicar `202608210001_meu_caminho_accounts.sql`.
- [ ] Aplicar `202608210002_account_consent_records.sql`.
- [ ] Confirmar RLS habilitado e forçado nas duas tabelas.
- [ ] Testar com duas contas: cada uma enxerga e altera somente a própria jornada/consentimento.
- [ ] Manter confirmação de e-mail obrigatória.
- [ ] Exigir no mínimo 12 caracteres para novas senhas.
- [ ] Ativar proteção contra senhas vazadas quando disponível no plano.
- [ ] Ativar Cloudflare Turnstile ou hCaptcha em cadastro, login e recuperação.
- [ ] Revisar os limites de autenticação e alertas de abuso.
- [ ] Configurar URLs de retorno apenas para produção e desenvolvimento autorizados.
- [ ] Ativar MFA nas contas administrativas do projeto.
- [ ] Revisar região, backups, logs, SMTP, DPA e suboperadores.

## Cloudflare

- [ ] Manter novos cadastros e provedores sociais desativados no Supabase; preservar as chaves somente enquanto forem necessárias para atender exclusões legadas.
- [ ] Configurar `SUPABASE_SERVICE_ROLE_KEY` como segredo de backend, nunca variável pública.
- [ ] Confirmar que o segredo não aparece em HTML, JavaScript, logs, build ou API de configuração.
- [ ] Configurar segredos de rate limiting e e-mail com rotação e acesso mínimo.
- [ ] Confirmar HTTPS obrigatório, HSTS, CSP, headers das Functions e domínio canônico.
- [ ] Revisar usuários do painel, Git e e-mail; remover acessos sem necessidade.

## Testes de aceite

- [ ] Executar `npm run verify`.
- [ ] Executar `npm run test:e2e`.
- [ ] Criar, confirmar, acessar, recuperar e excluir uma conta de teste.
- [ ] Conferir remoção da jornada e dos consentimentos no Supabase.
- [ ] Confirmar preservação dos dados locais após exclusão da conta.
- [ ] Ativar e revogar sincronização; conferir o registro imutável de consentimento.
- [ ] Desativar perfil público e confirmar TTL de 180 dias; excluir e confirmar remoção imediata.
- [ ] Testar pedidos de acesso, correção e eliminação ponta a ponta.
- [ ] Verificar CSP no console e no cabeçalho publicado; investigar violações antes de promover a política report-only nas páginas com anúncios.
- [ ] Executar simulação de incidente e registrar responsáveis/tempos.

## Aprovação

- Técnico: **PENDENTE — nome/data**.
- Privacidade: **PENDENTE — nome/data**.
- Controlador: **PENDENTE — nome/data**.
