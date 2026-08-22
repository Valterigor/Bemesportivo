# Registro de operações de tratamento — LGPD

Este registro deve ser revisado a cada mudança de finalidade, fornecedor, dado coletado ou prazo de retenção. O responsável pela revisão deve registrar data e evidência da aprovação.

## Identificação e responsabilidades

- Controlador: Bem Esportivo, projeto digital independente.
- Identificação civil ou empresarial: **PREENCHER antes da abertura pública de contas**.
- Responsável interno por privacidade: **PREENCHER**.
- Canal de titulares e incidentes: `bemesportivo@yahoo.com`.
- Operadores principais: Cloudflare, Supabase e Google, conforme a operação abaixo.

## Inventário

| Operação | Dados e titulares | Finalidade e base considerada | Operador/local | Retenção e eliminação | Acesso |
| --- | --- | --- | --- | --- | --- |
| Navegação essencial | IP, navegador, rota, data e controles técnicos | Entregar e proteger o site; execução do serviço e legítimo interesse sujeito a avaliação | Cloudflare; possível tratamento internacional | Logs pelo prazo técnico/contratual mínimo; revisar configuração trimestralmente | Operação técnica autorizada |
| Preferências de privacidade | categorias autorizadas e data | Respeitar e provar a escolha; consentimento e obrigação de transparência | Navegador | Até nova escolha ou limpeza do navegador | Própria pessoa |
| Conta | nome/apelido, e-mail, identificador, aceite e eventos de autenticação | Criar e proteger a conta; execução do serviço e consentimentos aplicáveis | Supabase | Até exclusão da conta, ressalvadas obrigações legais e cópias técnicas temporárias | Titular e operação mínima do fornecedor |
| Jornada local | perfil, faixa etária, objetivos, atividades, refeições, sono, hidratação, fotos e respostas de contexto/saúde | Personalização educativa solicitada; consentimento específico para dados sensíveis | Navegador | Até exclusão pela própria pessoa; limites internos de histórico | Pessoa com acesso ao navegador |
| Sincronização por conta | jornada sem fotos do diário; pode incluir foto de perfil | Continuidade entre aparelhos; consentimento separado | Supabase | Até exclusão da conta ou da jornada sincronizada | Próprio usuário por RLS e operação técnica restrita |
| Continuidade criptografada | pacote cifrado, identificador e verificador | Continuidade opcional sem acesso ao conteúdo legível | Cloudflare KV | Até exclusão pelo código ou revisão de inatividade definida pela operação | Titular com código; conteúdo cifrado para o operador |
| Perfil público | nome/apelido, idade adulta, profissão, esporte, biografia, foto e publicações escolhidas | Publicação solicitada; consentimento e execução da funcionalidade | Cloudflare KV e internet pública | Até exclusão; ao desativar, fica invisível e expira em 180 dias se não for reativado | Público enquanto ativo; moderação autorizada |
| Comunidade | apelido, texto, reações, denúncias e identificador pseudonimizado | Publicar, moderar e prevenir abuso | Cloudflare KV | Até 24 meses; máximo de 250 comentários por área | Público e moderação autorizada |
| Notificações | assinatura push, instalação e horários, sem título da tarefa | Entregar lembretes solicitados | Cloudflare | Até 100 dias, remoção ao cancelar ou ao expirar | Operação técnica |
| Métricas internas | rota e categoria de ação agregável, sem nome/e-mail/texto livre | Melhorar o serviço; consentimento para medição | Cloudflare | 90 dias | Operação autorizada |
| Contato e direitos | nome, e-mail, assunto, mensagem e evidência de atendimento | Responder pedido; medidas pré-contratuais, obrigação legal ou exercício de direitos | Cloudflare e Yahoo Mail | Pedido comum: até 12 meses após conclusão; direitos/controvérsia: prazo legal ou defesa de direitos, com revisão anual | Atendimento autorizado |
| Incidentes | fatos, sistemas, categorias afetadas, decisões e comunicações | Segurança, obrigação legal e prestação de contas | Repositório operacional restrito | Pelo menos 5 anos | Responsáveis por incidente e assessoria aplicável |

## Regras de minimização

- Não solicitar CPF, documento, endereço completo, diagnóstico ou exame no cadastro comum.
- Não inserir dados pessoais em métricas, logs de aplicação ou mensagens de erro.
- Não enviar fotos do diário para a sincronização por conta.
- Não reutilizar contato, jornada ou dados de saúde para publicidade.
- Toda nova coleta exige atualização deste registro, da política e dos testes antes da publicação.

## Revisão

- Periodicidade: trimestral e sempre que houver incidente ou novo fornecedor.
- Última revisão técnica: 21 de agosto de 2026.
- Aprovação do controlador: **PENDENTE — nome, data e evidência**.
