# Relatório de Impacto — Meu Caminho Be

Status: avaliação técnica inicial. A aprovação formal do controlador e a revisão jurídica continuam obrigatórias antes da operação definitiva de contas com dados sensíveis.

## Escopo e necessidade

O Meu Caminho Be organiza uma jornada esportiva educativa. Pode tratar objetivos, rotina, atividades, sono, hidratação, alimentação, disposição, relatos e respostas de segurança que revelam dados relacionados à saúde. A jornada funciona localmente; nuvem, conta, publicação e publicidade são escolhas separadas.

A finalidade pode ser alcançada sem CPF, endereço completo, diagnóstico, exames ou prontuário. Esses dados não devem ser solicitados. A personalização é recusável e não impede o acesso aos conteúdos públicos.

## Fluxos

1. Pessoa maior de 18 anos escolhe iniciar e fornece consentimento específico para a jornada.
2. Dados ficam no navegador por padrão.
3. Continuidade criptografada envia somente pacote AES-GCM ao Cloudflare, mediante escolha.
4. Sincronização por conta envia jornada legível ao Supabase, mediante consentimento separado e RLS.
5. Perfil público exige confirmação de maioridade e escolha explícita de cada publicação.
6. Exclusão local, da cópia criptografada, da conta e do perfil público possuem controles distintos e informados.

## Riscos e medidas

| Risco | Probabilidade/impacto | Medidas implementadas | Pendência |
| --- | --- | --- | --- |
| Outro usuário acessa jornada no mesmo aparelho | Média/alta | Aviso sobre aparelho compartilhado, conta opcional e exclusão local | Avaliar bloqueio local adicional |
| XSS captura sessão ou dados locais | Média/alta | Sanitização, ausência de handlers inline, CSP estrita no Meu Caminho, dependências locais | Monitorar CSP report-only e reduzir estilos inline |
| Usuário acessa jornada alheia | Baixa/alta | Supabase Auth, RLS forçado e políticas por `auth.uid()` | Teste de produção com duas contas |
| Chave administrativa exposta | Baixa/crítica | Segredo somente backend, teste contra bundle, rotação documentada | Configurar segredo Cloudflare e dupla revisão |
| Brute force/bots | Média/média | Rate limits do provedor e mensagens genéricas | Ativar CAPTCHA e revisar limites no Supabase |
| Publicação acidental | Média/alta | Privado por padrão, maioridade, consentimento e escolha por publicação | Teste periódico e moderação |
| Retenção excessiva | Média/média | Limites de histórico, prazos de métricas/comunidade e TTL de perfil desativado | Definir inatividade da continuidade criptografada |
| Dados de menor | Baixa/alta | Versão restrita a maiores de 18 anos e bloqueio por faixa etária | Auditoria periódica do bloqueio e canal de remoção |
| Incidente não comunicado | Baixa/alta | Plano e registro de incidentes | Nomear responsáveis e realizar exercício |
| Transferência internacional sem governança | Média/média | Transparência na política | Revisar DPA, regiões, suboperadores e mecanismo aplicável |

## Decisão residual

O risco residual é aceitável apenas depois de: aplicar migrações e RLS em produção; habilitar confirmação de e-mail, CAPTCHA e limites; configurar segredos; testar exclusão; nomear responsáveis; e concluir avaliação contratual de Cloudflare e Supabase.

## Aprovações

- Responsável técnico: **PENDENTE — nome/data**.
- Responsável por privacidade: **PENDENTE — nome/data**.
- Controlador: **PENDENTE — nome/data**.
- Próxima revisão: em 90 dias ou antes de qualquer nova coleta/fornecedor.
