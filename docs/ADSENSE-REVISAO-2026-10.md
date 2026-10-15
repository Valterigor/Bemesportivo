# Revisão editorial após aviso do AdSense

Data da revisão local: 14/10/2026. Motivo informado no painel enviado pelo proprietário: **conteúdo de baixo valor**. O aviso não identifica URLs; os pontos abaixo são achados da revisão do projeto, não uma explicação confirmada da decisão do Google.

## Mudanças realizadas

- Bloco de leitura na home antes da grade de serviços: reportagem de Thais, arquivo de Duda e Lara, três guias e acesso ao acervo.
- Biblioteca pública em `/guias`, sem cadastro, capa do diário ou dependência de JavaScript para ler.
- Três páginas completas: escolha de atividade, uso das metas do diário e registro alimentar. Incluem exemplos explicitamente ilustrativos, limites, referências, data, índice e links relacionados.
- Conhecimento no menu, rodapé e caminhos gerais da busca passa a levar à biblioteca pública.
- Sitemap inclui as quatro páginas e registra a atualização efetiva da home.
- Os novos guias não habilitam anúncios. Não foram criadas entrevistas, depoimentos, credenciais profissionais ou atualizações fictícias de personagens.

## Achados e decisões

| Área | Achado | Decisão |
| --- | --- | --- |
| Home | Histórias, vídeos, lojas e ferramentas dividiam a mesma grade; conhecimento levava ao aplicativo | Dar contexto editorial antes da grade e oferecer leitura pública |
| Biblioteca | Conteúdo útil concentrado em telas do diário | Abrir páginas HTML completas com exemplos de uso e fontes |
| Reportagens de arquivo | Duda/Lara, Mayara/Magnólia e Sergio já identificam contexto histórico | Preservar datas originais; não reapresentar como notícia atual |
| Duda e o Futebol | Página relacionada ao arquivo Elas trazem esperança | Manter o vínculo explícito; não criar outra matéria sobre a mesma trajetória sem nova apuração |
| Dedicação e Talento Mirim | Data de 09/06/2026, idades e descrições de desempenho já constam do texto | Pedir confirmação da data, dos relatos e dos créditos; não inferir comprovação a partir do HTML |
| Treino funcional e Serra Talhada | Matérias com pessoas, locais e contexto de atividades | Nova informação, entrevistas e situação atual dependem de apuração do responsável |
| BePlay, produtos e profissionais | Já estão sem anúncio habilitado e com noindex | Preservar configuração; noindex não é solução garantida para revisão do AdSense |
| Diário, perfis públicos e criação de postagens | Áreas de ferramenta/usuário, sem anúncio habilitado e com noindex | Preservar separação; metas privadas não viram conteúdo editorial público |
| Sobre e contato | Responsável editorial, formação e canal de correções já existem | Referenciar esses canais nos guias; não inventar revisão clínica |

## Pendências editoriais do proprietário

1. Confirmar autoria e autorização das fotografias e vídeos de cada cobertura, especialmente imagens de menores. Publicar créditos específicos apenas depois dessa confirmação.
2. Rever a data, as idades e os detalhes observacionais de “Dedicação e Talento Mirim”, confrontando com o material original.
3. Selecionar uma pauta recente com material próprio. Informar quem participou, quando e onde ocorreu, quais fatos estão confirmados e quais declarações foram autorizadas.
4. Revisar e assumir a responsabilidade editorial pelos novos guias antes de publicá-los. A referência oficial não significa que um profissional revisou o texto.
5. Conferir a mensagem de consentimento na conta AdSense conforme o documento anterior. Essa configuração não é verificável somente pelo código.

Não afirmar que a recusa está resolvida nem marcar o campo “corrigi os problemas” por conta destas alterações. A avaliação final pertence ao Google. Não há número de artigos, palavras ou prazo de espera adotado aqui como garantia de aprovação.

## Fontes consultadas

- [Preparação das páginas para AdSense](https://support.google.com/adsense/answer/7299563?hl=pt-BR)
- [OMS: atividade física](https://www.who.int/news-room/fact-sheets/detail/physical-activity)
- [Ministério da Saúde: Guia Alimentar para a População Brasileira](https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf)
- [Preparação anterior do AdSense](ADSENSE-PREPARACAO.md)

## Verificações

Os testes de `tests/e2e/public-guides.spec.js` cobrem acesso sem JavaScript, navegação por âncoras, largura de tela e acesso direto da home sem criação de perfil. Conferir também busca da home, sitemap, build e links antes da publicação.
