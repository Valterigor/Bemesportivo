# Be IA Esportiva — contrato legado

> A implementação atual foi substituída pela **Biblioteca BeM**, descrita em `docs/BIBLIOTECA-BEM.md`. Este documento permanece como histórico das decisões iniciais e não deve ser usado como fonte editorial vigente.

## Propósito

A Be IA transforma o contexto da jornada em uma orientação curta e acionável. Ela não deve se comportar como um chat de conhecimento geral, montar prescrições clínicas ou estimular treino para proteger sequência e pontuação.

O ciclo esperado é:

```text
situação atual → contexto mínimo → classificação de segurança
→ uma orientação → um passo possível → feedback → adaptação
```

## Contexto permitido

A resposta pode considerar:

- faixa etária declarada;
- objetivo atual;
- modalidade ou prática de referência;
- etapa e progresso do ciclo;
- tempo disponível;
- agregados dos últimos sete dias;
- último estado de disposição, sono e barreira registrada;
- restrição do questionário de segurança.

O texto livre não deve ser incorporado ao perfil nem ao histórico sem uma ação explícita do usuário. Diagnósticos, documentos, dados de terceiros e conteúdo integral do diário não devem ser enviados ao futuro provedor.

## Contrato de resposta

Todo motor deve devolver uma estrutura equivalente a:

```json
{
  "intent": "motivation",
  "safetyClass": "educational",
  "title": "Você não precisa esperar a vontade aparecer.",
  "message": "Observação contextual curta.",
  "nextAction": {
    "title": "Reserve 20 minutos para uma versão curta.",
    "detail": "Como executar ou registrar sem compensação.",
    "target": "movement"
  },
  "reasons": [
    "Objetivo atual",
    "Tempo disponível",
    "Histórico de sete dias"
  ],
  "engineVersion": "rules-1"
}
```

A interface, os botões e a segurança não podem depender de texto livre produzido pelo modelo.

## Regras obrigatórias

- separar fato registrado de inferência;
- explicar quais dados influenciaram a resposta;
- não diagnosticar, prescrever tratamento ou prometer resultado;
- nunca usar sequência, nível ou XP para pressionar alguém com dor, exaustão ou insegurança;
- diante de sinal de atenção, interromper a recomendação esportiva;
- oferecer acesso a profissional e orientação de urgência quando apropriado;
- permitir feedback positivo ou negativo;
- funcionar sem IA externa por meio de fallback local.

## Fases

### Fase 1 — motor contextual local

Implementada no beta inicial:

- situações frequentes e entrada livre;
- classificação por intenção;
- contexto calculado no aparelho;
- respostas estruturadas e direcionais;
- bloqueio por segurança;
- memória apenas de categoria e feedback;
- nenhuma transmissão do texto digitado.

### Fase 2 — gateway generativo controlado

- função server-side independente do fornecedor;
- autenticação, consentimento, limite de uso e orçamento;
- contexto reduzido e pseudonimizado;
- saída JSON validada pelo servidor;
- políticas antes e depois do modelo;
- versão de prompt, modelo e política registrada;
- timeout e fallback automático para o motor local.

### Fase 3 — adaptação avaliada

- medir se a orientação ajudou;
- comparar retorno, registro e conclusão de ação possível;
- revisar falsos bloqueios e respostas inseguras;
- liberar gradualmente somente após avaliação humana.

## Métricas iniciais

- orientação aberta;
- intenção classificada;
- resposta de segurança acionada;
- ação escolhida;
- feedback “ajudou” ou “não ajudou”;
- registro realizado depois da orientação.

Nenhuma métrica deve conter o texto livre da pessoa.
