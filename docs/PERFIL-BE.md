# Perfil Be

## Papel no produto

O Perfil Be representa a identidade e a trajetória esportiva da pessoa. Ele não substitui o diário privado: transforma apenas os dados reais escolhidos pela pessoa em resumo, evolução, conquistas e publicações esportivas.

## Camadas

- `meu-caminho-be.html`: estrutura semântica do perfil, abas e compositor.
- `css/meu-caminho-profile.css`: apresentação mobile-first, isolada do restante do portal.
- `js/meu-caminho-profile.js`: adaptadores locais, métricas, conquistas, feed e upload.
- `js/meu-caminho-public.js`: ponte autorizada entre o perfil local e a publicação pública.
- `server/public-profile-core.mjs`: validação, autorização, persistência e interações públicas.
- `perfil-publico.html`, `css/perfil-publico.css` e `js/perfil-publico.js`: leitura pública somente dos dados compartilhados.

## Dados locais

| Chave | Finalidade | Visibilidade padrão |
| --- | --- | --- |
| `meuCaminhoBeProfileV1` | identidade esportiva e preferências do perfil | privada, neste aparelho |
| `meuCaminhoBeDiaryV1` | atividades e registros da jornada | privada, neste aparelho |
| `meuCaminhoBeSportsPostsV1` | momentos esportivos criados no Perfil Be | privada, neste aparelho |

O módulo calcula atividades, tempo, distância, sequência e conquistas somente a partir desses dados. Não existem números demonstrativos na experiência real.

## Publicação e privacidade

Cada novo momento começa como privado. A opção pública só é liberada quando o Meu Diário BE está ativo e o aceite versionado foi registrado. O backend entrega apenas nome de exibição, esporte, bio, foto e publicações escolhidas; não entrega o diário privado nem os identificadores de controle.

As imagens são verificadas por tipo, tamanho e assinatura binária no navegador. O backend repete a verificação da assinatura antes de persistir. Texto público é limitado e sanitizado. Edição e exclusão exigem a identidade derivada do código local de continuidade.

## Interações

Curtidas e comentários pertencem à página pública. Comentários possuem campo-isca contra bots, limites de tamanho, sanitização e rate limiting. O identificador técnico usado para conter abuso é derivado por hash e nunca aparece na resposta pública.

## Evolução futura

Novos tipos de publicação devem entrar em `postTypes` no cliente e em `allowedPostTypes` no servidor. Novas conquistas devem ser determinísticas, derivadas de dados reais e adicionadas à função `achievements()` sem criar valores fictícios.
