# Coleção BE: validação de interesse

A rota /loja é uma vitrine, sem vendas, reservas, cobrança ou agendamento.
Preços em js/store-catalog.json são previstos. interestSizes são preferências de pesquisa,
não estoque ou grade confirmada. Fotos fornecidas em img/Loja be foram otimizadas
para img/loja e vinculadas ao campo images. O vídeo foi convertido para H.264
em videos/colecao-be.mp4, com reprodução automática, sem som, em repetição e
com controles para pausar ou ativar o áudio.

## Registro e painel

POST /api/store-interest grava nome, telefone normalizado, produto, tamanho,
versão do consentimento e data. Uma chave HMAC por telefone/produto faz novos
envios atualizarem a preferência. Não há verificação por SMS: as contagens são
de telefones informados, não pessoas comprovadas.

O painel /admin usa a chave administrativa existente e mostra totais por produto,
tamanho e telefones distintos, além dos cadastros e botão de exclusão.
Uma pessoa pode demonstrar interesse em vários produtos.
Não se contam cliques nem conversas no WhatsApp como cadastros.

## Configuração antes de publicar

- Binding Cloudflare KV BE_DATA.
- Secret STORE_INTEREST_SECRET aleatório com pelo menos 32 caracteres.
  Manter estável: a rotação muda as chaves de deduplicação.
- Secret BE_ADMIN_TOKEN com pelo menos 32 caracteres, já usado pelo painel.
- Revisar a descrição/preço de cada produto.

Sem armazenamento ou secret, a API retorna 503 e a interface não confirma cadastro.
Registros expiram após 180 dias do último envio. Pedidos de exclusão recebidos no
contato podem ser atendidos pelo painel. Nunca salvar registros em data/ (público).
KV tem consistência eventual: contagens e atualizações podem demorar a aparecer;
envios simultâneos mantêm uma chave por telefone/produto, mas a última preferência
pode levar tempo a propagar. Limite por IP de 20 envios/hora é proteção básica,
não proteção absoluta contra abuso distribuído.

## Desenvolvimento

npm run dev serve a vitrine em http://localhost:3100/loja.
O servidor local usa apenas memória, identifica os envios como teste e perde os
dados quando reiniciado. Não representa captação real de interessados.

Validação: node tests/integration/store-interest-test.mjs e
npx playwright test tests/e2e/store-interest.spec.js.
