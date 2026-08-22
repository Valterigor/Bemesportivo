# Acesso ao Meu Caminho Be

## Estado temporário: modo local

Enquanto o envio de e-mails de autenticação não estiver estável, a página usa `be-meu-caminho-mode=local-only`. Nesse modo, ações de registro e inclusão são liberadas sem login; perfil, agenda, diário, refeições e progresso permanecem no armazenamento do aparelho. Login, sincronização por conta, continuidade criptografada entre aparelhos e publicações externas ficam pausados. Nenhum dado local existente é apagado.

Para reativar contas, primeiro valide cadastro, confirmação e recuperação de senha em produção. Depois altere o marcador da página, restaure o módulo de publicação, atualize a versão do cache e execute `npm run verify:full` antes do deploy.

## Experiência implementada

O Meu Caminho Be abre normalmente, sem bloquear a leitura ou a navegação. A tela de acesso aparece quando a pessoa aciona uma ação que registra, inclui, altera ou exclui informações, ou quando escolhe **Entrar** no topo.

O acesso oferece cadastro por e-mail e senha, confirmação de e-mail, entrada, recuperação de senha, troca de senha e login opcional com Google. Ao tentar modificar informações, a pessoa também pode continuar sem conta e manter os dados apenas no aparelho; a ação original é retomada depois dessa escolha. Após essa decisão, as próximas ações ficam liberadas no mesmo aparelho.

Os dados locais nunca são enviados automaticamente no primeiro acesso. Depois de entrar, a pessoa precisa autorizar explicitamente a migração do perfil, planos, atividades e refeições para a conta.

## Configuração do Supabase

1. Criar um projeto no Supabase.
2. Em **Authentication > URL Configuration**, definir:
   - Site URL: `https://bemesportivo.com`
   - Redirect URLs: `https://bemesportivo.com/meu-caminho-be*`
   - desenvolvimento: `http://localhost:3100/meu-caminho-be*`
3. Manter a confirmação de e-mail ativa.
   Em **Authentication > Bot and Abuse Protection**, ativar Cloudflare Turnstile ou hCaptcha para cadastro, login e recuperação. Em **Authentication > Rate Limits**, revisar os limites de produção. Em **Password Security**, exigir no mínimo 12 caracteres e, quando o plano permitir, bloquear senhas vazadas.
4. Executar no SQL Editor o arquivo `supabase/migrations/202608210001_meu_caminho_accounts.sql`.
   Depois, executar `supabase/migrations/202608210002_account_consent_records.sql`.
5. No Cloudflare Pages, criar as variáveis:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`, somente como segredo do backend, para a exclusão solicitada pela própria pessoa.
   - `SUPABASE_GOOGLE_ENABLED=true` somente depois de configurar o Google no Supabase.
6. Fazer um novo deploy.

A chave pública pode chegar ao navegador. A `SUPABASE_SERVICE_ROLE_KEY` nunca pode ser retornada pela API de configuração, incluída no bundle ou configurada como variável pública.

## Teste de aceite

1. Abrir `/meu-caminho-be` sem sessão e confirmar que a página aparece normalmente.
2. Acionar **Registrar** e confirmar a tela de acesso.
3. Continuar sem conta e confirmar que a ação de registro é retomada.
4. Criar uma conta e confirmar o e-mail.
5. Entrar e sair com e-mail e senha.
6. Solicitar recuperação e definir uma nova senha.
7. Criar dados locais, entrar e autorizar a migração.
8. Abrir outro navegador, entrar e confirmar a recuperação da jornada.
9. Confirmar no Supabase que cada usuário enxerga somente a própria linha.
10. Ativar Google, testar o retorno e somente então definir `SUPABASE_GOOGLE_ENABLED=true`.
11. Excluir uma conta de teste, confirmar a remoção de `auth.users`, da jornada e dos consentimentos, e verificar que os dados locais foram preservados.
