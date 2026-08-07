# Aprovação pré-publicação — Meu Caminho Be

## Estado atual

- [x] Verificação estrutural, build, PWA e testes automatizados.
- [x] Testes semânticos da Biblioteca BeM em nove cenários.
- [x] Revisão técnica das respostas contra fontes institucionais e consensos publicados.
- [x] Simulação visual em navegador instalado, sem dependências adicionais.
- [ ] Revisão e aprovação por profissionais habilitados.
- [ ] Teste manual completo com leitor de tela por pessoa usuária.
- [ ] Testes completos em celulares físicos Android e iPhone.
- [ ] Autorização para publicar e executar `git push`.

O push de publicação permanece bloqueado enquanto os três itens humanos estiverem pendentes.

## 1. Aprovação profissional do conteúdo

Revisores mínimos recomendados:

- profissional de Educação Física: movimento, carga, fadiga, retorno e linguagem esportiva;
- fisioterapeuta ou médico do esporte: sinais de alerta, dor, lesão e encaminhamento;
- nutricionista: alimentação, hidratação e limites da orientação educacional.

Para cada revisor, registrar:

| Campo | Preenchimento |
|---|---|
| Nome |  |
| Profissão |  |
| Conselho e número de registro |  |
| Conteúdos revisados |  |
| Ajustes solicitados |  |
| Resultado: aprovado / reprovado |  |
| Data |  |

Arquivo principal para revisão: `js/be-knowledge-library.js`.

Critérios que bloqueiam a publicação:

- orientação que possa ser entendida como diagnóstico ou prescrição individual;
- urgência subestimada ou encaminhamento inadequado;
- recomendação incompatível com a modalidade ou com retorno após afastamento;
- número universal de treino, hidratação ou alimentação sem contexto;
- linguagem de culpa relacionada a peso, comida, pausa ou desempenho.

## 2. Teste manual com leitor de tela

Executar pelo menos:

- NVDA + Chrome ou Edge no Windows;
- TalkBack + Chrome no Android;
- VoiceOver + Safari no iPhone.

Fluxos obrigatórios:

1. Abrir e concluir escolhas de privacidade.
2. Pular para o conteúdo principal.
3. Completar o onboarding e o questionário de segurança.
4. Navegar pelo menu principal.
5. Planejar o dia.
6. Registrar atividade e refeição.
7. Consultar a Biblioteca BeM e compreender resposta, justificativa e ações.
8. Editar ou excluir um registro.
9. Abrir Jornada, Evolução, História, Perfil e Ferramentas.

Registrar para cada combinação:

| Campo | Preenchimento |
|---|---|
| Leitor de tela, navegador e versão |  |
| Pessoa responsável |  |
| Fluxos concluídos |  |
| Barreiras encontradas |  |
| Resultado: aprovado / reprovado |  |
| Data |  |

Bloqueadores: foco invisível ou perdido, conteúdo anunciado fora de ordem, botão sem nome, formulário sem instrução, diálogo sem contenção de foco ou ação inacessível pelo teclado/gesto.

## 3. Testes em celulares físicos

Matriz mínima:

| Plataforma | Aparelho | Sistema | Navegador | Resultado |
|---|---|---|---|---|
| Android compacto |  |  | Chrome |  |
| Android atual |  |  | Chrome |  |
| iPhone compacto |  |  | Safari |  |
| iPhone atual |  |  | Safari |  |

Em cada aparelho testar:

- primeira visita e privacidade;
- instalação como PWA quando disponível;
- orientação retrato e paisagem;
- teclado virtual em todos os campos;
- menu inferior e áreas seguras da tela;
- rolagem, zoom, diálogos e botões próximos às bordas;
- planejamento, refeições, registro, edição e exclusão;
- troca de data e disponibilidade diária das refeições;
- funcionamento offline e retorno da conexão;
- recarga da página e preservação dos dados locais;
- Biblioteca BeM nos cenários normal, cansaço e sinal de alerta.

Bloqueadores: corte horizontal, botão encoberto pelo teclado/menu, perda de dados, navegação sem saída, ação duplicada, travamento, orientação de segurança incorreta ou falha offline.

## Autorização final

Depois das três aprovações:

| Responsável pela liberação | Data | Resultado | Observação |
|---|---|---|---|
|  |  | aprovado / reprovado |  |

Com a autorização registrada, executar novamente `npm run verify`, revisar o diff excluindo arquivos locais e somente então criar commit e fazer o push.
