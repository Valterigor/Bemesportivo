# Plano de resposta a incidentes com dados pessoais

## Responsáveis

- Coordenador do incidente: **PREENCHER**.
- Responsável por privacidade/controlador: **PREENCHER**.
- Responsável técnico Cloudflare: **PREENCHER**.
- Responsável técnico Supabase: **PREENCHER**.
- Apoio jurídico/comunicação: **PREENCHER ou indicar contratação sob demanda**.

Até o preenchimento, qualquer alerta deve ser encaminhado imediatamente para `bemesportivo@yahoo.com` com o assunto `URGENTE - Incidente de segurança`.

## Resposta

1. **Detectar e classificar:** data, origem, sistemas, disponibilidade, integridade e possível confidencialidade afetada.
2. **Conter:** revogar sessões/tokens, bloquear rota, rotacionar segredo, retirar recurso do ar ou limitar acesso conforme o risco.
3. **Preservar evidências:** guardar logs mínimos, linha do tempo, hashes e decisões em local restrito; não alterar originais.
4. **Investigar:** categorias de dados, titulares, volume, duração, agente da ameaça e controles que falharam.
5. **Avaliar risco relevante:** considerar dados sensíveis, autenticação, menores, escala, possibilidade de fraude, discriminação, dano físico, moral ou reputacional.
6. **Comunicar:** quando houver risco ou dano relevante, preparar comunicação à ANPD e aos titulares no prazo regulamentar de três dias úteis, ressalvada legislação específica.
7. **Recuperar:** corrigir causa, validar restauração, monitorar reincidência e reabrir somente após aceite técnico.
8. **Aprender:** registrar causa raiz, medidas, responsáveis e prazos; atualizar testes, inventário e RIPD.

## Conteúdo mínimo do registro

- identificador e datas de descoberta, início estimado, contenção e encerramento;
- sistemas e fornecedores envolvidos;
- natureza, categoria e quantidade estimada de dados e titulares;
- medidas técnicas e administrativas existentes e adotadas;
- análise de risco, decisão de comunicar ou não e responsáveis;
- cópias das comunicações e medidas oferecidas aos titulares;
- causa raiz e plano preventivo.

O registro deve ser mantido por pelo menos cinco anos, mesmo quando o incidente não exigir comunicação. O acesso deve ser restrito e auditável.

## Exercício semestral

Simular: chave administrativa exposta, tomada de conta, perfil público indevido, vazamento de jornada e abuso de formulário. Registrar tempo de detecção, contenção, decisão e comunicação.
