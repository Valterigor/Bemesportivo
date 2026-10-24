# Coleção BE: validação de interesse

A rota /loja é uma vitrine, sem vendas, reservas, cobrança ou agendamento.
Preços em js/store-catalog.json são previstos. interestSizes são preferências de pesquisa,
não estoque ou grade confirmada. Fotos fornecidas em img/Loja be foram otimizadas
para img/loja e vinculadas ao campo images. O vídeo foi convertido para H.264
em videos/colecao-be.mp4, com reprodução automática, sem som, em repetição e
com controles para pausar ou ativar o áudio.

## Registro e painel

O carrinho de desejos guarda somente IDs e tamanhos no navegador por até 180 dias,
sem nome ou telefone. O visitante pode reunir várias peças e remover itens.
Há uma preferência de tamanho por produto; adicionar de novo atualiza o tamanho.
Os valores são estimados, sem frete e sem compromisso de compra.

POST /api/store-interest recebe items, nome, telefone e consentimento. Valida toda
a lista antes de gravar uma única chave HMAC por telefone, com TTL de 180 dias.
Reenviar substitui a lista anterior inteira. O endpoint continua aceitando o
formato legado produto/tamanho. No painel, a lista nova substitui os registros
legados do mesmo telefone, evitando duplicidade. A exclusão da lista remove também
as chaves legadas desse telefone. Não há verificação por SMS: as contagens são
de telefones informados, não pessoas comprovadas.

O painel /admin usa a chave administrativa existente e mostra totais por produto,
tamanho e telefones distintos, além dos cadastros e botão de exclusão.
Uma pessoa pode demonstrar interesse em vários produtos.
Não se contam cliques nem conversas no WhatsApp como cadastros.

## Aviso de abertura das vendas

O canal consentido é WhatsApp. No painel, “Preparar aviso no WhatsApp” confirma
se as vendas foram liberadas e abre uma mensagem com as peças e tamanhos daquela
lista. O administrador revisa e envia manualmente no WhatsApp. Não há disparo
automático, comprovação de entrega ou mensagem enviada ao salvar o cadastro.
Não acionar avisos antes de os produtos estarem disponíveis. Automação futura
exige integrar um provedor de envio; abrir wa.me não equivale a envio.

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
