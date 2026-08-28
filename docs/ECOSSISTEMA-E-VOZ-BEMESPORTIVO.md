# Ecossistema e voz do BeMEsportivo

## Ideia central

> O BeMEsportivo é um ecossistema para viver o esporte. O Meu Caminho Be é sua experiência mais pessoal.

Essa distinção orienta produto, conteúdo, navegação e linguagem.

## Arquitetura oficial da experiência

Não existe um único percurso obrigatório. A Home identifica a necessidade expressa pela pessoa e a direciona para o produto adequado:

```text
                         BeMEsportivo
                              │
       ┌──────────┬───────────┼───────────┬──────────────┐
       ↓          ↓           ↓           ↓              ↓
  Reportagens   BEplay   Meu Caminho   Comunidade   Profissionais
                              │
                       experiência pessoal
```

A Home apresenta as áreas do ecossistema sem assumir o papel de painel pessoal. Sua abertura preserva esta ordem:

1. **Busca Be** — recebe, em linguagem natural, o que a pessoa procura e indica um destino real do site.
2. **Produtos do ecossistema** — explica a função de cada área sem criar hierarquia artificial entre elas.
3. **Meu Caminho Be** — apresenta a experiência pessoal de registro e acompanhamento.
4. **Conteúdo e demais produtos** — oferece reportagens, vídeos, ferramentas, profissionais e outras possibilidades.

## Função de cada produto

- **Conhecimento** — aprenda com conteúdos especiais e orientações da Biblioteca BeM.
- **Meu Caminho Be** — acompanhe o seu esporte.
- **BEplay** — assista ao esporte.
- **Reportagens** — conheça histórias do esporte.
- **Comunidade** — converse sobre esporte.
- **Profissionais** — encontre quem pode ajudar.
- **Ferramentas** — entenda melhor sua prática.
- **Produtos** — encontre o que precisa para praticar.

O Meu Caminho Be não é o centro do ecossistema. É a experiência mais pessoal dele. Conhecimento e Reportagens são destinos diferentes: o primeiro ajuda a aprender; o segundo apresenta histórias reais. Cada produto resolve uma necessidade diferente e todos pertencem ao BeMEsportivo.

Capas e imagens editoriais aprovadas não devem ser substituídas durante ajustes estruturais. Mudanças de ordem, navegação ou texto precisam manter a hierarquia visual e ser validadas em desktop e mobile.

## Navegação pública oficial

O menu principal, na mesma ordem em todas as páginas públicas, é:

1. Início;
2. Meu Caminho Be;
3. Perfil do atleta;
4. Game 3D;
5. Reportagens;
6. BEplay;
7. Profissionais;
8. Produtos.

`js/core/routes.js` é a fonte compartilhada desse menu. A Home mantém sua apresentação própria, mas deve respeitar o mesmo conteúdo e a mesma ordem. Se um item mudar, o teste funcional precisa ser atualizado para impedir divergência entre páginas.

## Papel de cada ambiente

### BeMEsportivo.com

É a entrada pública e editorial. Deve ajudar qualquer pessoa a conhecer, compreender e se aproximar do esporte por meio de:

- reportagens;
- histórias de pessoas, projetos e comunidades;
- conhecimento para a prática;
- vídeos e experiências;
- profissionais e serviços ligados ao esporte.

Não exige perfil para entregar valor e não deve parecer um dashboard pessoal.

### Meu Caminho Be

É o ambiente da trajetória pessoal. Deve ajudar a pessoa a:

- reconhecer como está hoje;
- planejar o que pretende fazer;
- registrar o que realmente viveu;
- acompanhar ritmo e evolução;
- preservar pausas, retornos, descobertas e conquistas;
- consultar ferramentas e orientações contextualizadas.

Não deve parecer um portal de notícias nem receber nomes de colunas editoriais.

## Relação entre os ambientes

```text
reportagem inspira
        ↓
conteúdo ajuda a compreender
        ↓
experiência aproxima da prática
        ↓
Meu Caminho Be transforma em ação e memória
```

## Regra para a Busca Be, respostas e automação

A Busca Be não usa IA nem produz texto livre. Ela deve operar somente com:

- intenções e frases revisadas na biblioteca editorial;
- palavras-chave determinísticas;
- conteúdos e rotas que realmente existem no site;
- uma alternativa clara que apresente as áreas do ecossistema quando não houver correspondência exata.

O texto digitado não deve ser enviado a serviços externos nem armazenado. A busca apenas direciona; ela não diagnostica, não prescreve e não inventa respostas.

A Biblioteca BeM é o comportamento padrão para respostas, devolutivas e mensagens de continuidade. Ela deve funcionar localmente, com regras determinísticas, conteúdo real da área esportiva e linguagem revisável.

IA é uma camada opcional. Sua indisponibilidade nunca pode impedir planejamento, registro, consulta da jornada, exportação ou recuperação dos dados. Quando usada, não pode diagnosticar, prescrever, substituir profissional habilitado nem modificar silenciosamente o histórico da pessoa.

## Frases centrais da marca

- O esporte começa com pessoas.
- Histórias e conhecimento para viver o esporte. Um caminho para guardar a sua trajetória.
- O esporte é feito de resultados, mas também de pessoas, escolhas, territórios e caminhos.
- Informação para compreender. Experiências para participar. Um caminho para continuar.
- Antes do resultado, existe alguém tentando, aprendendo, voltando ou começando.

## Frases do Meu Caminho Be

- O esporte que você vive também merece ser lembrado.
- Seu caminho não precisa ser perfeito. Precisa fazer sentido para você.
- Cada registro ajuda você a entender a própria história.
- Seu primeiro registro não precisa ser perfeito. Só precisa ser verdadeiro.
- Sua sequência mostra presença, não obrigação.
- Não existe começo pequeno.
- Valorize cada recomeço.
- Pausa também faz parte da trajetória.
- O que você vive hoje também pertence à sua história.

## Tom de voz

A linguagem deve ser:

- humana, sem fingir intimidade;
- clara, sem termos técnicos desnecessários;
- acolhedora, sem infantilizar;
- responsável, sem diagnosticar ou prescrever;
- positiva, sem transformar motivação em cobrança;
- esportiva, mas compreensível para quem está começando.

## O que evitar

- “Sem desculpas.”
- “Supere seus limites.”
- “Projeto verão.”
- “Compense o treino perdido.”
- “Seja sua melhor versão.”
- “Quem quer dá um jeito.”
- “Você falhou.”

Essas frases reduzem experiências complexas a esforço individual, podem criar culpa e contradizem a proposta humana do projeto.

## Regra para novas funcionalidades

Antes de adicionar uma área, responder:

1. Isso é conteúdo público ou trajetória pessoal?
2. A pessoa precisa ter perfil para receber valor?
3. Essa função inspira, ensina, ajuda a agir ou preserva memória?
4. Em qual ambiente ela pertence sem duplicar outra função?
5. A linguagem respeita pausas, contextos e diferentes relações com o esporte?

Se essas respostas não estiverem claras, a funcionalidade ainda não está pronta para entrar no produto.
