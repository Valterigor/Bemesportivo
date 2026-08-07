# Biblioteca BeM

## Objetivo

A Biblioteca BeM é o núcleo editorial local do Meu Caminho Be. Ela transforma contexto e texto livre em orientações curtas, humanas e acionáveis sem depender de IA generativa, conexão com a internet ou envio da pergunta para terceiros.

O arquivo executável é `js/be-knowledge-library.js`. A interface e a coleta de contexto permanecem em `js/be-ia.js` para separar conteúdo editorial de comportamento de tela.

## Fluxo de decisão

```text
mensagem da pessoa
        ↓
normalização local
        ↓
porta de segurança ── sinal de alerta → parar e encaminhar
        ↓
intenção (tempo, cansaço, retorno, alimentação...)
        ↓
contexto local da jornada
        ↓
resposta editorial versionada + próximo passo + referências
```

Nenhuma pergunta livre é salva. O histórico guarda somente identificador, intenção, classificação de cuidado, data e feedback positivo ou negativo.

## Princípios editoriais

- Falar com a pessoa, sem fingir ser uma pessoa ou profissional.
- Validar dificuldade sem infantilizar, culpar ou prometer resultado.
- Tratar pausa, adaptação e retorno como partes legítimas da história esportiva.
- Não usar sequência, peso, alimentação ou desempenho como pressão moral.
- Dar uma escolha possível, explicando por que ela apareceu.
- Não diagnosticar, prescrever treino, dieta, hidratação ou retorno clínico.
- Encaminhar sinais de alerta antes de qualquer meta ou gamificação.

## Conteúdo inicial

A versão 1.0.0 cobre:

- desânimo e motivação;
- falta de tempo;
- cansaço e recuperação;
- retorno ao esporte;
- interrupção e recomeço;
- alimentação sem julgamento;
- hidratação sem quantidade universal;
- próximo passo e dúvidas gerais;
- observações contextualizadas para corrida, caminhada, esportes coletivos, força, ciclismo e natação.

## Fontes de base

- [OMS — Diretrizes sobre atividade física e comportamento sedentário](https://www.who.int/publications/i/item/9789240014886)
- [COI — Consenso sobre carga, recuperação e risco de adoecimento](https://bjsm.bmj.com/content/50/17/1043)
- [Consenso de Berna — Retorno ao esporte centrado na pessoa](https://bjsm.bmj.com/content/50/14/853)
- [ACSM — Fundamentos para recuperação muscular](https://www.acsm.org/docs/default-source/files-for-resource-library/a-road-map-to-effective-muscle-recovery.pdf)

As fontes sustentam princípios gerais. Elas não transformam respostas automáticas em avaliação individual.

## Governança necessária

Cada alteração editorial deve registrar versão e data de revisão, passar pelos testes automatizados e receber revisão humana de conteúdo. Conteúdo de saúde, dor, lesão, alimentação ou retorno deve ter revisão de profissional habilitado na área correspondente antes da publicação.

Checklist de publicação:

1. A resposta acolhe sem culpar?
2. Evita diagnóstico, prescrição e certeza indevida?
3. Tem um próximo passo realmente executável?
4. A porta de segurança continua tendo prioridade?
5. A fonte é adequada e continua disponível?
6. Os testes de contrato e cenários passam?

Execute `npm test` para validar o contrato da biblioteca e `npm run verify` antes de publicar.

## Evolução sem dependência obrigatória de IA

Uma IA generativa poderá ser adicionada futuramente apenas como camada opcional de reformulação. A Biblioteca BeM deve continuar decidindo segurança, limites, intenção, fontes e ações. Se a IA falhar ou estiver desligada, a mesma orientação essencial precisa continuar disponível localmente.
