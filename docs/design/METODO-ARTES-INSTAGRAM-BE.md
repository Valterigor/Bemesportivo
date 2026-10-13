# Método de criação das artes de Instagram BE

Salvo em 12/10/2026 a pedido do usuário para reutilização em futuras artes.

## Referências do projeto

- [Meu Diário Be — primeira arte](../../output/imagegen/meu-diario-be-instagram-v1.png)
- [Meu Diário Be — referência usada no Radar](../../output/imagegen/meu-diario-be-instagram-v1-gerado.png)
- [Meu Diário Be — versão sem cabeçalho pequeno](../../output/imagegen/meu-diario-be-instagram-v2.png)
- [Radar Be — arte da mesma série](../../output/imagegen/radar-be-instagram-v1.png)
- Prompts originais: [Diário v1](../../output/imagegen/meu-diario-be-instagram-v1-prompt.txt), [ajuste v2](../../output/imagegen/meu-diario-be-instagram-v2-prompt.txt) e [Radar](../../output/imagegen/radar-be-instagram-v1-prompt.txt).

Esses arquivos são referências locais; devem ser preservados junto com este documento. A foto original da mulher foi anexada na conversa anterior e seu caminho local não está registrado nos prompts. Se ela não estiver disponível numa sessão futura, solicitar novamente a foto quando for necessária para preservar a identidade. Não substituir a pessoa por outra inventada.

## Padrão visual

- Feed vertical 4:5, com exportação final em 1080 × 1350 px.
- Fundo quase preto, laranja quente e branco; linhas curvas sutis em laranja evocando uma pista de corrida.
- Estilo editorial esportivo, limpo, com margens generosas e leitura fácil no celular.
- Pessoa na metade direita, rosto totalmente visível, recorte da cintura ou coxas para cima; preservar identidade, rosto, cabelo, proporções, pose, roupas e emblema existente. Luz quente integrada à composição.
- Texto na metade esquerda, sem sobrepor o rosto: título grande e forte, subtítulo curto, três frases breves de benefício, chamada em laranja no rodapé e endereço bemesportivo.com.
- Na referência Radar, título com laranja e branco, pequenos marcadores laranja nas frases e chamada em faixa arredondada.
- Cabeçalho pequeno “BEM ESPORTIVO” é uma variante: presente na primeira arte e no Radar, removido no Diário v2. Seguir a referência escolhida para cada nova peça.
- Símbolo do produto apenas quando houver referência definida. No Radar: pin de localização em contorno laranja, com abertura circular. Preservar o emblema da camiseta.
- Português com acentos corretos. Sem textos extras, interfaces fictícias, números inventados ou logos adicionais.

## Processo reutilizável

1. Ler este guia e visualizar a arte existente que servirá de referência.
2. Definir o nome do produto, subtítulo, três benefícios curtos, chamada final e eventual símbolo. Manter a quantidade de texto próxima à referência para preservar a legibilidade.
3. Usar a geração/edição de imagem integrada com duas referências, quando disponíveis: foto original para identidade e arte anterior para composição. Seguir as instruções da skill de imagem disponível na sessão.
4. Pedir uma peça companheira da referência, preservando layout, tipografia, cores, posição da pessoa, iluminação e espaçamento. Trocar somente o conteúdo necessário ao novo produto.
5. Conferir visualmente identidade, textos, acentos, rosto livre, margens e consistência com a série; verificar também as dimensões reais do arquivo. Não assumir que o tamanho solicitado foi entregue.
6. Para correções pequenas, editar a arte já criada com instrução localizada. Não refazer toda a composição. Preservar a versão anterior.
7. Salvar arte e prompt em `output/imagegen/`, com nome do produto e versão: `<produto>-be-instagram-v1.png` e `<produto>-be-instagram-v1-prompt.txt`. Registrar referências utilizadas e dimensões efetivas. Incrementar a versão nas revisões.

## Prompt-base para uma nova peça

```text
Crie uma arte companheira para [PRODUTO], seguindo fielmente a arte BE fornecida como referência de layout, tipografia, cores, espaçamento e composição. Formato vertical 4:5, tamanho desejado 1080x1350.

Use a foto original como referência de identidade e a arte existente como referência visual. Preserve a mesma pessoa, rosto, cabelo, proporções naturais, pose, roupas e emblema da camiseta. Pessoa à DIREITA, rosto inteiro visível, luz de borda laranja quente. Texto à ESQUERDA sem sobreposição no rosto.

Fundo quase preto, linhas curvas de pista em laranja, título grande em laranja e branco, subtítulo curto, três frases com marcadores laranja, chamada de rodapé laranja e site menor. Margens seguras, bastante respiro e leitura fácil no celular. [MANTER OU OMITIR o cabeçalho pequeno BEM ESPORTIVO conforme a referência escolhida.]

Usar somente estes textos, com grafia e acentos exatos:
Título: [PRODUTO E QUEBRAS DE LINHA]
Subtítulo: [FRASE CURTA]
Benefício 1: [FRASE CURTA]
Benefício 2: [FRASE CURTA]
Benefício 3: [FRASE CURTA]
Chamada: [CONVITE CURTO]
Site: bemesportivo.com

[SÍMBOLO: descrever apenas se definido e fornecer referência quando disponível.]
Sem texto adicional, interface fictícia ou logos inventados. Manter o sistema visual da arte de referência.
```

## Prompt-base para correção localizada

```text
Edite a arte fornecida alterando SOMENTE [ELEMENTO E ALTERAÇÃO]. Preserve todos os demais elementos: identidade e foto da pessoa, pose, emblema, textos restantes, tipografia, tamanhos, posições, espaçamentos, cores, margens, linhas laranja e proporção 4:5. Não reorganize o layout nem acrescente elementos. Tamanho desejado: 1080x1350.
```

Exemplo já utilizado: remover somente o cabeçalho pequeno “BEM ESPORTIVO” e preencher a área com o fundo escuro correspondente, sem subir o título principal.

## Como retomar

Pedido sugerido: “Crie uma arte para [produto] seguindo o método salvo em docs/design/METODO-ARTES-INSTAGRAM-BE.md e usando [arte existente] como referência.”
