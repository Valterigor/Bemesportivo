# Segurança e privacidade — operação

Este documento transforma as proteções do site em rotina operacional. Ele não substitui revisão jurídica especializada.

## Responsáveis e dados institucionais

Antes de lançar contas, sincronização entre aparelhos, análise de imagens ou pagamentos, preencher e publicar:

- nome empresarial ou nome civil do controlador;
- CPF/CNPJ e endereço de contato aplicáveis;
- responsável interno por privacidade e segurança;
- canal monitorado para titulares e incidentes;
- lista de operadores, contratos e locais de tratamento.

Canal atual: `contato@bemesportivo.com`.

## Inventário mínimo

| Recurso | Dados | Local | Retenção/controle |
| --- | --- | --- | --- |
| Meu Caminho Be | perfil, contexto de saúde, diário e progresso | navegador do usuário | até exclusão pelo usuário; histórico limitado pela aplicação |
| Análise visual | imagem autorizada e contexto escolhido | trânsito temporário por Netlify e API da OpenAI | imagem não persistida pelo BeMEsportivo; somente texto confirmado entra no diário local |
| Limite da análise visual | resumo criptográfico da conexão e horários de uso | Netlify Blobs | janela móvel de uma hora; revisar eliminação automática de chaves inativas |
| Comunidade | apelido, texto, data, reações e denúncias | Netlify Blobs | até 24 meses e até 250 comentários por área |
| Antispam | resumo criptográfico de IP e identificador do dispositivo | estado da API | janelas ativas de limitação; revisar e eliminar entradas antigas |
| Privacidade | escolha sobre publicidade | navegador do usuário | até nova escolha ou limpeza do navegador |
| Contato | dados enviados voluntariamente | canal de atendimento | somente pelo tempo necessário ao pedido e às obrigações legais |

Os segredos `COMMUNITY_RATE_LIMIT_SECRET`, `VISUAL_ANALYSIS_SECRET` e `OPENAI_API_KEY` devem ser criados no ambiente da Netlify, com valores apropriados, nunca incluídos no Git. O modelo pode ser configurado por `OPENAI_VISION_MODEL`.

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

- revisar acessos à Netlify, domínio, e-mail e repositório;
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
