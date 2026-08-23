# Segurança e privacidade — operação

Este documento transforma as proteções do site em rotina operacional. Ele não substitui revisão jurídica especializada.

## Responsáveis e dados institucionais

Antes de ampliar a sincronização entre aparelhos, análise de imagens ou pagamentos, preencher e publicar:

- nome empresarial ou nome civil do controlador;
- CPF/CNPJ e endereço de contato aplicáveis;
- responsável interno por privacidade e segurança;
- canal monitorado para titulares e incidentes;
- lista de operadores, contratos e locais de tratamento.

Canal atual: `bemesportivo@yahoo.com`.

## Inventário mínimo

| Recurso | Dados | Local | Retenção/controle |
| --- | --- | --- | --- |
| Meu Caminho Be | perfil, contexto de saúde, diário e progresso | navegador do usuário | até exclusão pelo usuário; histórico limitado pela aplicação |
| Continuidade Meu Caminho Be | pacote criptografado, identificador derivado e verificador | Cloudflare | até exclusão pelo código ou atendimento de solicitação válida |
| Perfil público | nome de exibição, esporte, apresentação, foto e publicações escolhidas | Cloudflare KV | enquanto ativo; perfil desativado expira em 180 dias se não for reativado |
| Comunidade | apelido, texto, data, reações e denúncias | Cloudflare KV | até 24 meses e até 250 comentários por área |
| Antispam | resumo criptográfico de IP e identificador do dispositivo | estado da API | janelas ativas de limitação; revisar e eliminar entradas antigas |
| Privacidade | escolha sobre publicidade | navegador do usuário | até nova escolha ou limpeza do navegador |
| Contato | dados enviados voluntariamente | canal de atendimento | somente pelo tempo necessário ao pedido e às obrigações legais |

Segredos de limitação, autenticação e operação devem existir apenas nos ambientes Cloudflare e Supabase apropriados, com acesso mínimo, rotação e nunca incluídos no Git.

## Atendimento de direitos LGPD

1. Registrar data, pedido e canal sem coletar dados excessivos.
2. Confirmar a identidade de forma proporcional ao risco.
3. Identificar os sistemas e fornecedores envolvidos.
4. Responder ou informar providências conforme a LGPD e regulamentação vigente.
5. Registrar a conclusão e eliminar documentos auxiliares quando deixarem de ser necessários.

## Incidentes de segurança

1. Conter o incidente e preservar evidências com acesso restrito.
2. Registrar sistemas, dados, titulares, período, causa provável e medidas tomadas.
3. Avaliar risco ou dano relevante aos titulares.
4. Quando aplicável, comunicar ANPD e titulares em até três dias úteis, observada a regulamentação vigente.
5. Manter o registro do incidente por pelo menos cinco anos, mesmo quando não houver comunicação.
6. Corrigir a causa, revisar acessos e documentar aprendizados.

## Moderação comunitária

- revisar conteúdos ocultados por denúncias;
- atender contestações pelo canal publicado;
- não restaurar conteúdo ilegal, que exponha dados privados ou gere risco à saúde;
- preservar apenas registros estritamente necessários para defesa de direitos;
- documentar decisões difíceis e aplicar as regras de forma consistente.

## Rotina mensal

- revisar acessos à Cloudflare, Supabase, domínio, e-mail e repositório;
- remover contas e tokens sem uso;
- verificar dependências, logs de erro, backups e formulários públicos;
- testar exclusão/exportação do Meu Caminho Be;
- testar consentimento, recusa e reabertura do painel de privacidade;
- conferir se publicidade não carrega antes da autorização;
- revisar páginas legais quando fornecedores ou recursos mudarem.

## Pendências antes de recursos futuros

- validação jurídica da identidade do controlador e documentos finais;
- mecanismo proporcional e auditável de verificação etária;
- concluir a avaliação contratual dos fornecedores de nuvem e IA antes da liberação pública definitiva;
- validar periodicamente o consentimento separado, a ausência de persistência da imagem e a retenção do controle de abuso;
- autenticação, recuperação de conta e proteção contra tomada de conta;
- plano de resposta a incidentes com responsáveis nomeados;
- comprovação de autorização de imagens, especialmente de menores.

## Documentos operacionais obrigatórios

- `docs/LGPD-REGISTRO-DE-TRATAMENTO.md` — inventário, finalidades, bases e retenção;
- `docs/LGPD-DIREITOS-E-RETENCAO.md` — atendimento e exclusão;
- `docs/LGPD-RESPOSTA-A-INCIDENTES.md` — contenção, comunicação e registro;
- `docs/LGPD-RIPD-MEU-CAMINHO.md` — avaliação de impacto e risco residual;
- `docs/LGPD-FORNECEDORES-E-TRANSFERENCIAS.md` — contratos e transferências.
