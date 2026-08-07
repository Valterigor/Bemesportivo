# Biblioteca BeM

## Objetivo

A Biblioteca BeM é o núcleo editorial local do Meu Caminho Be. Ela transforma contexto, texto livre e ações do produto em retornos curtos, humanos e acionáveis, sem depender de IA generativa, conexão com a internet ou envio de respostas pessoais para terceiros.

O arquivo executável é `js/be-knowledge-library.js`. A interface de perguntas permanece em `js/be-ia.js`, enquanto as ações do diário e do planejamento consomem a mesma biblioteca. Assim, conteúdo editorial e comportamento de tela continuam separados.

## Duas entradas, uma mesma voz

### Perguntas em texto livre

`buildResponse(query, context)` identifica sinais de alerta, intenção e contexto da jornada antes de selecionar uma orientação editorial.

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

### Interações do produto

`buildInteraction(type, context)` oferece respostas determinísticas para acontecimentos reais do Meu Caminho Be. A versão 1.1.0 cobre:

- plano do dia salvo;
- primeira atividade e atividade atualizada;
- retorno depois de uma pausa;
- registro realizado em um dia difícil;
- marco pessoal e semana consistente;
- atividade e check-in diário salvos;
- pausa registrada;
- refeição registrada sem nota, culpa ou julgamento.

O planejamento continua sendo uma intenção. Para contar o que realmente aconteceu, a pessoa é conduzida ao registro diário; o sistema não transforma automaticamente um plano em atividade concluída.

## Princípios editoriais

- Falar com a pessoa, sem fingir ser uma pessoa ou profissional.
- Validar dificuldade sem infantilizar, culpar ou prometer resultado.
- Tratar pausa, adaptação e retorno como partes legítimas da história esportiva.
- Não usar sequência, peso, alimentação ou desempenho como pressão moral.
- Dar uma escolha possível, explicando por que ela apareceu.
- Não diagnosticar, prescrever treino, dieta, hidratação ou retorno clínico.
- Encaminhar sinais de alerta antes de qualquer meta ou gamificação.

## Conteúdo de orientação

A biblioteca cobre:

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

## Versão e revisão

- Versão atual: `1.1.0`
- Revisão editorial interna: `2026-08-07`
- Estado: `editorial-pending-professional`

A data acima registra a revisão interna do produto; não representa aprovação por profissional habilitado. Textos de saúde, dor, lesão, alimentação, recuperação ou retorno precisam dessa revisão profissional antes da publicação definitiva.

Cada alteração editorial deve registrar versão e data, passar pelos testes automatizados e receber revisão humana de conteúdo.

Checklist de publicação:

1. A resposta acolhe sem culpar?
2. Evita diagnóstico, prescrição e certeza indevida?
3. Tem um próximo passo realmente executável?
4. A porta de segurança continua tendo prioridade?
5. A fonte é adequada e continua disponível?
6. Os testes de contrato e cenários passam?
7. A revisão profissional exigida foi documentada?

Execute `npm test` para validar o contrato da biblioteca e `npm run verify` antes de publicar.

## Evolução sem dependência obrigatória de IA

Uma IA generativa poderá ser adicionada futuramente apenas como camada opcional de reformulação. A Biblioteca BeM deve continuar decidindo segurança, limites, intenção, fontes e ações. Se a IA falhar ou estiver desligada, a mesma orientação essencial precisa continuar disponível localmente.
