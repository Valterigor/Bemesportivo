# Inventário do projeto

Este documento registra o papel dos diretórios e as exceções mantidas para preservar a publicação atual.

## Publicação

| Área | Finalidade | Entra no build |
| --- | --- | --- |
| Raiz `*.html` | Páginas e entradas públicas | Sim |
| `css/` e `js/` | Código do site publicado | Sim |
| `img/` e `videos/` | Mídia publicada | Sim |
| `functions/`, `workers/`, `server/` | APIs e tarefas de infraestrutura | Conforme a plataforma |
| `netlify/` | Compatibilidade durante a migração | Conforme a plataforma |

## Desenvolvimento

| Área | Finalidade | Observação |
| --- | --- | --- |
| `scripts/` | Qualidade, build, testes e manutenção | Código operacional |
| `docs/` | Arquitetura e histórico | Não é copiado para `dist/` |
| `src/` | Protótipo descontinuado | Não recebe código novo |
| `testes/` | Protótipos isolados | Não participa da publicação |
| `dist/` | Resultado gerado | Ignorado pelo Git |
| `.local-reference/` | Capturas, importações e arquivos brutos | Ignorado pelo Git e pelo build |

## Compatibilidade mantida na raiz

A entrega estática ainda copia CSS e JavaScript legados da raiz. Esses arquivos só devem ser movidos depois de uma auditoria específica de URLs e consumidores externos.

- `style.css` e `site-common.css` continuam atendendo páginas públicas.
- `ai-agent-data.js`, `ai-agent-service.js` e `profissionais-ai.js` atendem a página de profissionais.
- `ebook.css`, `modal.css`, `responsive-final.css`, `script.js` e `video bonecos.mp4` não possuem referências internas atuais, mas permanecem como exceções legadas até uma decisão de remoção de URL pública.

## Regras de higiene

1. Não salvar páginas baixadas, pastas `_files` ou arquivos `.download` dentro de `img/`.
2. Não deixar capturas de validação, relatórios `diff.txt` ou pastas `.tmp-*` na raiz.
3. Arquivos brutos recebidos por WhatsApp ou redes sociais ficam em `.local-reference/` até serem tratados e aprovados.
4. Somente versões finais e referenciadas entram em `img/` ou `videos/`.
5. Execute `npm run structure` e `npm run verify` antes de publicar.
