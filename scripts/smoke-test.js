'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = 3197;
const baseUrl = `http://127.0.0.1:${port}`;
const pages = [
  '/',
  '/reportagens',
  '/reportagens/treino-funcional-br-assessoria',
  '/reportagens/elas-em-movimento-serra-talhada',
  '/reportagens/dedicacao-talento-mirim',
  '/reportagens/duda-e-o-futebol',
  '/meu-caminho-be',
  '/meu-caminho-be/registrar',
  '/meu-caminho-be/jornada',
  '/meu-caminho-be/jornada/evolucao',
  '/meu-caminho-be/jornada/historia',
  '/meu-caminho-be/ferramentas',
  '/meu-caminho-be/perfil',
  '/beplay',
  '/game.html',
  '/profissionais',
  '/produtos',
  '/sobre',
  '/contato',
  '/politica-de-privacidade',
  '/politica-de-valores',
  '/termos',
  '/diretrizes-da-comunidade'
];

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error('O servidor local não iniciou para o teste funcional.');
}

async function expectOk(route) {
  const response = await fetch(`${baseUrl}${route}`);
  assert.equal(response.status, 200, `${route} deveria responder 200`);
  return response;
}

async function run() {
  const communityStatePath = path.join(root, 'data', 'community.json');
  const originalCommunityState = fs.readFileSync(communityStatePath);
  const server = spawn(process.execPath, ['dev-server.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  let serverError = '';
  server.stderr.on('data', chunk => { serverError += chunk.toString(); });

  try {
    await waitForServer();
    for (const page of pages) {
      const response = await expectOk(page);
      assert.match(response.headers.get('content-type') || '', /text\/html/, `${page} precisa entregar HTML`);
    }

    const manifest = await expectOk('/manifest.webmanifest');
    assert.match(manifest.headers.get('content-type') || '', /application\/manifest\+json/);
    const manifestBody = await manifest.json();
    assert.equal(manifestBody.icons.length, 3);
    assert.equal(manifestBody.id, '/meu-caminho-be');
    assert.equal(manifestBody.scope, '/meu-caminho-be');
    assert.equal(manifestBody.display, 'standalone');
    assert.equal(manifestBody.start_url, '/meu-caminho-be');
    assert.ok(manifestBody.shortcuts.some(shortcut => shortcut.url === '/meu-caminho-be/jornada/evolucao'));
    for (const icon of manifestBody.icons) await expectOk(icon.src);

    const community = await expectOk('/api/community/comments?scope=path&id=meu-caminho-be');
    const communityBody = await community.json();
    assert.equal(communityBody.ok, true);
    assert.ok(Array.isArray(communityBody.comments));

    const reportCommentId = `smoke-report-${Date.now()}`;
    const reportClientId = `smoke-client-${Date.now()}`;
    const createReportComment = await fetch(`${baseUrl}/api/community/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'report',
        id: reportCommentId,
        name: 'Teste funcional',
        text: 'Comentário temporário do teste automatizado.',
        clientId: reportClientId,
        adultConfirmed: true,
        website: ''
      })
    });
    assert.equal(createReportComment.status, 200);
    const createdReportCommentBody = await createReportComment.json();
    assert.equal(createdReportCommentBody.ok, true);
    assert.ok(createdReportCommentBody.comment?.id);

    const readReportComments = await expectOk(`/api/community/comments?scope=report&id=${encodeURIComponent(reportCommentId)}`);
    const readReportCommentsBody = await readReportComments.json();
    assert.ok(readReportCommentsBody.comments.some(comment => comment.id === createdReportCommentBody.comment.id));

    const likeReportComment = await fetch(`${baseUrl}/api/community/comment-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'report', id: reportCommentId, commentId: createdReportCommentBody.comment.id,
        action: 'like', clientId: `${reportClientId}-like`
      })
    });
    assert.equal(likeReportComment.status, 200);
    const likedCommentBody = await likeReportComment.json();
    assert.equal(likedCommentBody.comment?.likes, 1);

    const replyReportComment = await fetch(`${baseUrl}/api/community/comment-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'report', id: reportCommentId, commentId: createdReportCommentBody.comment.id,
        action: 'reply', clientId: `${reportClientId}-reply`, name: 'Resposta funcional',
        text: 'Resposta pública temporária do teste automatizado.', adultConfirmed: true
      })
    });
    assert.equal(replyReportComment.status, 200);
    const repliedCommentBody = await replyReportComment.json();
    assert.ok(repliedCommentBody.comment?.replies?.some(reply => reply.name === 'Resposta funcional'));

    const reportComment = await fetch(`${baseUrl}/api/community/comment-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: 'report',
        id: reportCommentId,
        commentId: createdReportCommentBody.comment.id,
        action: 'report',
        clientId: `${reportClientId}-moderation`
      })
    });
    assert.equal(reportComment.status, 200);
    assert.equal((await reportComment.json()).ok, true);

    const ranking = await expectOk('/api/game-ranking');
    assert.ok(Array.isArray((await ranking.json()).ranking));

    const video = await fetch(`${baseUrl}/videos/treino-agilidade-futebol.mp4`, {
      headers: { Range: 'bytes=0-1023' }
    });
    assert.equal(video.status, 206);
    assert.match(video.headers.get('content-type') || '', /video\/mp4/);
    assert.equal((await video.arrayBuffer()).byteLength, 1024);

    const reportVideo = await fetch(`${baseUrl}/videos/elas-em-movimento-serra-talhada.mp4`, {
      headers: { Range: 'bytes=0-1023' }
    });
    assert.equal(reportVideo.status, 206);
    assert.match(reportVideo.headers.get('content-type') || '', /video\/mp4/);
    assert.equal((await reportVideo.arrayBuffer()).byteLength, 1024);

    const pathHtml = fs.readFileSync(path.join(root, 'meu-caminho-be.html'), 'utf8');
    assert.doesNotMatch(pathHtml, /(?:src|href)="(?!\/|https?:|#|mailto:|tel:|data:)[^"]+"/, 'Recursos do app precisam usar caminhos absolutos para funcionar nas subpáginas.');
    assert.doesNotMatch(pathHtml, /srcset="(?!\/)[^"]+"/, 'Imagens responsivas precisam funcionar nas subpáginas.');
    const reportListing = fs.readFileSync(path.join(root, 'reportagens.html'), 'utf8');
    const elasReport = fs.readFileSync(path.join(root, 'reportagem-elas-em-movimento-serra-talhada.html'), 'utf8');
    assert.match(elasReport, /Mulheres em ação e movimento/);
    assert.match(elasReport, /Shuenia Menezes e Daiana Cruz/);
    assert.match(elasReport, /Mulheres em Ação[\s\S]*Daiana Cruz/);
    assert.match(elasReport, /Ginásio Luiza Kelly/);
    assert.match(elasReport, /Parque dos Ipês, bairro Ipsep/);
    assert.match(elasReport, /data-share-whatsapp/);
    assert.match(elasReport, /data-share-cover-button[^>]*Instagram Stories/);
    assert.match(elasReport, /videos\/elas-em-movimento-serra-talhada\.mp4/);
    assert.ok(fs.existsSync(path.join(root, 'videos', 'elas-em-movimento-serra-talhada.mp4')));
    assert.match(elasReport, /poster="\/img\/elas-em-movimento-video-poster\.jpg"/);
    assert.ok(fs.existsSync(path.join(root, 'img', 'elas-em-movimento-video-poster.jpg')));
    assert.match(elasReport, /<div class="elas-story-header">/);
    assert.doesNotMatch(elasReport, /<header class="elas-story-header">/);
    assert.match(elasReport, /site-common\.css\?v=20260723-3[\s\S]*reportagens\.css\?v=20260806-1/);
    assert.doesNotMatch(elasReport, /elas-photo-badge/);
    assert.match(elasReport, /mulheres-em-movimento-serra-talhada-interna\.jpg/);
    assert.match(elasReport, /class="report-byline"[\s\S]*4 min de leitura/);
    assert.match(elasReport, /class="report-cover-caption"[\s\S]*Foto: acervo dos projetos/);
    assert.equal((elasReport.match(/class="report-section-title"/g) || []).length, 2);
    assert.match(elasReport, /class="report-video-layout"/);
    assert.match(elasReport, /class="elas-story-summary"/);
    assert.doesNotMatch(elasReport, /class="elas-story-quote"/);
    assert.match(elasReport, /class="report-related"[\s\S]*Outras histórias do Bem Esportivo/);
    assert.match(elasReport, /class="report-lead"/);
    assert.equal((elasReport.match(/class="report-related-meta"/g) || []).length, 3);
    assert.match(elasReport, /report-related[\s\S]*banner-treino-funcional-professores-v3-640\.webp[\s\S]*IMG_0957-optimized\.webp[\s\S]*duda\.jpg/);
    for (const reportFile of ['reportagem-elas-em-movimento-serra-talhada.html', 'reportagem-treino-funcional.html', 'reportagem-dedicacao-talento-mirim.html', 'reportagem-duda-e-o-futebol.html']) {
      const reportHtml = fs.readFileSync(path.join(root, reportFile), 'utf8');
      assert.match(reportHtml, /reportagens\.css\?v=20260806-1/, `A reportagem precisa carregar a ponte editorial atualizada: ${reportFile}`);
      assert.match(reportHtml, /class="report-path-bridge"[\s\S]*Começar minha trajetória/, `A reportagem precisa conectar leitura e trajetória: ${reportFile}`);
    }
    for (const image of ['mulheres-em-movimento-serra-talhada-interna.jpg', 'mulheres-em-movimento-serra-talhada-interna-640.webp', 'mulheres-em-movimento-serra-talhada-interna-960.webp', 'mulheres-em-movimento-serra-talhada-interna-1440.webp']) {
      assert.ok(fs.existsSync(path.join(root, 'img', image)), `Imagem interna da reportagem ausente: ${image}`);
    }
    const reportCss = fs.readFileSync(path.join(root, 'css', 'reportagens.css'), 'utf8');
    assert.match(reportCss, /\.reportagens-page \.elas-story-header\s*\{[\s\S]*?display:\s*grid\s*!important/);
    assert.match(reportCss, /\.reportagens-page \.elas-story-header\s*\{[\s\S]*?position:\s*static\s*!important/);
    assert.match(reportCss, /\.report-card-elas \.report-media-stack > \.report-cover\s*\{[\s\S]*?object-position:\s*right center[\s\S]*?transform:\s*scale\(1\.22\)/);
    assert.match(reportCss, /\.report-video-layout\s*\{[\s\S]*?grid-template-columns:/);
    assert.match(reportCss, /\.elas-story-summary h2\s*\{[\s\S]*?color:\s*#fff\s*!important/);
    assert.match(reportCss, /\.report-related > div\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
    const homeHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const adsensePublisher = 'ca-pub-5105345296041597';
    const editorialAdPages = [
      'index.html',
      'sobre.html',
      'reportagens.html',
      'reportagem-dedicacao-talento-mirim.html',
      'reportagem-duda-e-o-futebol.html',
      'reportagem-elas-em-movimento-serra-talhada.html',
      'reportagem-treino-funcional.html'
    ];
    for (const page of editorialAdPages) {
      const pageHtml = fs.readFileSync(path.join(root, page), 'utf8');
      assert.match(pageHtml, new RegExp(`google-adsense-account" content="${adsensePublisher}`), `Conta AdSense ausente em ${page}.`);
      assert.match(pageHtml, /bem-adsense-enabled" content="true/, `AdSense editorial precisa estar habilitado em ${page}.`);
      assert.match(pageHtml, /src="\/js\/adsense-consent-default\.js"[\s\S]*?<script async src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-5105345296041597" crossorigin="anonymous"><\/script>/, `Código de análise do AdSense ausente ou sem consentimento padrão em ${page}.`);
    }
    assert.doesNotMatch(pathHtml, /bem-adsense-enabled/, 'O Meu Caminho Be não deve carregar publicidade em áreas pessoais.');
    const adsTxt = fs.readFileSync(path.join(root, 'ads.txt'), 'utf8');
    const adsenseConsentDefault = fs.readFileSync(path.join(root, 'js/adsense-consent-default.js'), 'utf8');
    const privacyConsentScript = fs.readFileSync(path.join(root, 'js/components/privacy-consent.js'), 'utf8');
    assert.match(adsTxt, /google\.com, pub-5105345296041597, DIRECT, f08c47fec0942fa0/);
    assert.match(privacyConsentScript, /ADSENSE_CLIENT = 'ca-pub-5105345296041597'/);
    assert.match(privacyConsentScript, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=\$\{ADSENSE_CLIENT\}/);
    assert.match(privacyConsentScript, /ad_storage: consent\?\.advertising \? 'granted' : 'denied'/);
    assert.match(adsenseConsentDefault, /ad_storage: 'denied'/);
    assert.match(adsenseConsentDefault, /ad_personalization: 'denied'/);
    assert.doesNotMatch(privacyConsentScript, /ca-pub-5270723987412757/);
    assert.match(homeHtml, /<main class="home-redesign">\s*<section class="shell home-hero-v2" id="inicio"/, 'A Home precisa abrir com o novo hero de jornada.');
    assert.match(homeHtml, /id="home-hero-title">Descubra <span>seu caminho<\/span> no esporte\./, 'O novo hero precisa preservar a chamada principal do Bem Esportivo.');
    assert.match(homeHtml, /class="shell home-steps"[\s\S]*Descobrir[\s\S]*Começar[\s\S]*Evoluir[\s\S]*Permanecer/, 'A Home precisa apresentar as quatro etapas da jornada.');
    assert.match(homeHtml, /id="home-content-title">Histórias que aproximam você do <em>esporte\.<\/em>/, 'A Home precisa apresentar os cards editoriais.');
    assert.match(homeHtml, /class="shell home-journey"[\s\S]*Seu diário <em>esportivo digital\.<\/em>/, 'A Home precisa preservar o bloco do Meu Caminho Be.');
    assert.match(homeHtml, /class="shell home-split"[\s\S]*Corrida da Hidratação[\s\S]*Assista\. Inspire-se\. Evolua sempre\./, 'A Home precisa conectar Game e BePlay.');
    assert.match(homeHtml, /id="home-report-title">Histórias reais que <em>inspiram<\/em> o esporte\./, 'A Home precisa preservar a vitrine de reportagens.');
    assert.match(homeHtml, /href="\/meu-caminho-be">Criar meu Caminho/, 'A chamada da Home precisa abrir o Meu Caminho Be.');
    assert.doesNotMatch(homeHtml, /class="home-path-feature"[\s\S]*Dados ficam neste aparelho[\s\S]*<\/section>/, 'A prévia da Home não deve exibir o estado local do aparelho.');
    assert.match(homeHtml, /href="\/meu-caminho-be"[\s\S]*Meu Caminho Be[\s\S]*href="\/meu-caminho-be\/perfil"[\s\S]*Perfil do atleta[\s\S]*href="\/game\.html"[\s\S]*Game 3D[\s\S]*href="\/reportagens"[\s\S]*Reportagens[\s\S]*href="\/beplay"[\s\S]*BEplay[\s\S]*href="\/profissionais"[\s\S]*Profissionais[\s\S]*href="\/produtos"[\s\S]*Produtos/, 'A Home precisa preservar o menu principal do Bem Esportivo.');
    assert.match(homeHtml, /href="\/meu-caminho-be\/ferramentas"/, 'A Home precisa abrir Ferramentas pela subpágina canônica.');
    assert.match(homeHtml, /O conteúdo inspira\. A sua história começa quando você <span>vive o esporte\.<\/span>/);
    assert.doesNotMatch(homeHtml, /<h2>Meu Caminho Be<\/h2>/, 'Meu Caminho Be não deve ser usado como nome de coluna editorial.');
    assert.match(reportListing, /class="report-path-bridge"[\s\S]*Conhecer o Meu Caminho Be/);
    const routesScript = fs.readFileSync(path.join(root, 'js', 'core', 'routes.js'), 'utf8');
    assert.match(routesScript, /'\/meu-caminho-be', 'Meu Caminho Be'[\s\S]*'\/meu-caminho-be\/perfil', 'Perfil do atleta'[\s\S]*'\/game\.html', 'Game 3D'[\s\S]*'\/reportagens', 'Reportagens'[\s\S]*'\/beplay', 'BEplay'[\s\S]*'\/profissionais', 'Profissionais'[\s\S]*'\/produtos', 'Produtos'/);
    assert.doesNotMatch(routesScript, /'\/#treinos'|'\/#pessoas'/, 'O menu compartilhado não deve reintroduzir atalhos removidos da navegação principal.');
    assert.doesNotMatch(elasReport, /mulheres-em-acao-funcional-serra-talhada/);
    for (const image of ['mulheres-em-movimento-serra-talhada-sem-logo-640.webp', 'mulheres-em-movimento-serra-talhada-sem-logo-960.webp', 'mulheres-em-movimento-serra-talhada-sem-logo-1440.webp']) {
      assert.ok(fs.existsSync(path.join(root, 'img', image)), `Imagem da reportagem ausente: ${image}`);
    }
    assert.doesNotMatch(pathHtml, /fb-photo-checkin|photo-checkin\.js|Analisar minha foto/);
    for (const id of ['fb-continuity-create', 'fb-continuity-output', 'fb-continuity-connect-form', 'fb-continuity-input']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Fluxo de continuidade ausente: ${id}`);
    }
    assert.match(pathHtml, /Criptografado no aparelho/);
    assert.doesNotMatch(pathHtml, /id="fb-login-form"/);
    for (const panel of ['inicio', 'registrar', 'progresso', 'evolucao', 'conteudos', 'explorar', 'perfil']) {
      assert.match(pathHtml, new RegExp(`data-fb-panel="${panel}"`), `Área principal do app ausente: ${panel}`);
    }
    for (const destination of ['inicio', 'registrar', 'progresso', 'ferramentas', 'perfil']) {
      assert.match(pathHtml, new RegExp(`class="fb-app-nav"[\\s\\S]*?data-fb-view="${destination}"`), `Navegação principal ausente: ${destination}`);
    }
    const primaryNav = pathHtml.match(/<nav class="fb-app-nav"[\s\S]*?<\/nav>/)?.[0] || '';
    assert.equal((primaryNav.match(/<a\b/g) || []).length, 5, 'A navegação principal deve ter cinco links reais para as subpáginas.');
    assert.match(primaryNav, /href="\/meu-caminho-be"[\s\S]*href="\/meu-caminho-be\/jornada"[\s\S]*href="\/meu-caminho-be\/registrar"[\s\S]*href="\/meu-caminho-be\/ferramentas"[\s\S]*href="\/meu-caminho-be\/perfil"/, 'Cada item principal precisa expor sua URL canônica.');
    assert.doesNotMatch(primaryNav, /data-fb-view="evolucao"|data-fb-view="explorar"/, 'Evolução e História devem ficar dentro da Jornada.');
    assert.match(pathHtml, /class="[^"]*fb-nav-register[^"]*" href="\/meu-caminho-be\/registrar"/, 'Subpágina central de registro ausente.');
    assert.match(pathHtml, /data-fb-panel="registrar"[\s\S]*id="be-register-page-title"[\s\S]*data-be-new-entry/, 'Registrar precisa ter página própria antes do formulário.');
    assert.match(pathHtml, /data-fb-panel="ferramentas"[\s\S]*id="fb-tools-mount"/, 'Ferramentas precisa ficar dentro de um painel próprio do aplicativo.');
    assert.match(pathHtml, /aria-label="Próximos passos após usar uma ferramenta"[\s\S]*?data-fb-view="dicas">Dicas práticas<\/button>[\s\S]*?data-fb-view="especialistas">Ver profissionais<\/button>/, 'O primeiro próximo passo de Ferramentas precisa abrir somente Dicas práticas.');
    assert.match(pathHtml, /class="be-journey-switcher"[\s\S]*?data-fb-view="progresso"[\s\S]*?data-fb-view="evolucao"[\s\S]*?data-fb-view="explorar"/, 'Diário, Evolução e História precisam permanecer dentro da Jornada.');
    assert.equal((pathHtml.match(/class="fb-section-actions(?:\s[^"]*)?"/g) || []).length, 6, 'As seis áreas principais precisam oferecer próximos passos contextuais.');
    assert.match(pathHtml, /id="fb-evolution-days"/);
    assert.match(pathHtml, /class="fb-explore-grid"/);
    assert.match(pathHtml, /id="fb-day-guide"[\s\S]*?SUA AÇÃO DE AGORA · UMA POR VEZ/);
    assert.match(pathHtml, /id="fb-now"[^>]*aria-labelledby="fb-now-title"/);
    assert.match(pathHtml, /id="fb-now-start"/);
    assert.match(pathHtml, /data-fb-now-status="concluida"/);
    assert.match(pathHtml, /id="fb-now-barrier"/);
    assert.match(pathHtml, /id="fb-now-help"/);
    assert.match(pathHtml, /id="fb-now-image"/);
    assert.match(pathHtml, /id="fb-now-phases"/);
    assert.match(pathHtml, /id="fb-now-timer"[^>]*role="timer"/);
    assert.match(pathHtml, /id="fb-now-pause"/);
    assert.match(pathHtml, /id="fb-now-finish"/);
    assert.match(pathHtml, /id="fb-human-moment"/);
    assert.match(pathHtml, /class="fb-human-media"[\s\S]*?id="fb-human-image" src="\/img\/bruno-rafael-resende-treino-funcional\.jpg"/);
    assert.match(pathHtml, /id="fb-checkin-barrier"/);
    assert.match(pathHtml, /id="fb-week-review-form"/);
    assert.match(pathHtml, /id="fb-view-announcer"[^>]*aria-live="polite"/);
    assert.match(pathHtml, /id="be-ia"[^>]*aria-labelledby="be-ia-title"/);
    assert.match(pathHtml, /id="be-ia-context"/);
    assert.match(pathHtml, /id="be-ia-answer"[^>]*aria-live="polite"/);
    assert.match(pathHtml, /js\/be-knowledge-library\.js\?v=20260813-3/);
    assert.match(pathHtml, /js\/be-ia\.js\?v=20260806-1/);
    assert.match(pathHtml, /css\/meu-caminho-modern\.css\?v=20260806-1/);
    assert.match(pathHtml, /js\/fala-bem-app\.js\?v=20260813-4/);
    assert.match(pathHtml, /css\/meu-caminho-diary\.css\?v=20260813-3/);
    assert.match(pathHtml, /js\/site-common\.js\?v=20260813-1/);
    assert.match(pathHtml, /class="fb-app-brand" href="\/"/, 'O logo do cabeçalho precisa voltar para a home principal.');
    assert.match(pathHtml, /class="be-showcase-brand" href="\/"[^>]*><strong>MEU CAMINHO BE<\/strong><\/a>/, 'A identificação da apresentação deve ter somente o texto clicável.');
    assert.match(pathHtml, /js\/meu-caminho-diary\.js\?v=20260813-3/);
    assert.match(pathHtml, /js\/routine-calendar\.js\?v=20260807-1/);
    assert.doesNotMatch(pathHtml, /id="be-success-dialog"/, 'Salvar uma atividade não deve bloquear a navegação com uma segunda janela.');
    assert.match(pathHtml, /id="fb-day-guide-done">Registrar o que fiz<\/button>/, 'O plano precisa encaminhar ao registro do que realmente aconteceu.');
    assert.doesNotMatch(pathHtml, /class="be-showcase-phones"/);
    for (const id of ['be-quick-form', 'be-entry-form', 'be-diary-timeline', 'be-week-chart', 'be-history-timeline']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Experiência de diário ausente: ${id}`);
    }
    for (const id of ['be-meal-add', 'be-meals-list', 'be-meal-dialog', 'be-meal-feedback', 'be-meal-detail-form', 'be-meal-description', 'be-meal-description-count']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Registro de alimentação ausente: ${id}`);
    }
    for (const id of ['be-dashboard-plan-action', 'be-day-plan-dialog', 'be-day-plan-form', 'be-day-plan-activity', 'be-day-plan-time', 'be-day-plan-duration']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Planejamento do dia ausente: ${id}`);
    }
    assert.doesNotMatch(pathHtml, /id="be-dashboard-plan-action"[^>]*data-be-new-entry/, 'Plano do dia não pode abrir o registro do que já aconteceu.');
    for (const meal of ['breakfast', 'snack', 'lunch', 'dinner']) {
      assert.match(pathHtml, new RegExp(`data-be-meal="${meal}"`), `Opção de alimentação ausente: ${meal}`);
    }
    for (const id of ['fb-profile-photo', 'fb-profile-photo-preview', 'fb-profile-email', 'fb-profile-city', 'fb-profile-state']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Campo de cadastro ausente: ${id}`);
    }
    for (const id of ['be-profile-presentation', 'be-profile-display-name', 'be-profile-edit', 'be-profile-stat-records', 'be-profile-stat-days', 'be-profile-presentation-status']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Apresentação social do Perfil ausente: ${id}`);
    }
    for (const id of ['be-section-banner', 'be-section-banner-title', 'be-section-banner-text', 'be-section-banner-mark']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Banner interno ausente: ${id}`);
    }
    assert.match(pathHtml, /class="be-profile-social-card"[\s\S]*class="be-profile-cover"[\s\S]*class="be-profile-social-identity"/, 'O Perfil precisa apresentar uma identidade social antes do cadastro.');
    assert.match(pathHtml, /class="be-profile-form-section"[\s\S]*Informações básicas[\s\S]*IDENTIDADE ESPORTIVA/, 'O cadastro precisa estar organizado em blocos compreensíveis.');
    assert.match(pathHtml, /REGISTRAR · MEU CAMINHO BE[\s\S]*id="be-entry-dialog-description"/, 'O registro precisa ter banner e explicação próprios.');
    assert.doesNotMatch(pathHtml, /belief-block belief-block-compact/, 'A seção editorial genérica não deve se repetir dentro da experiência.');
    assert.doesNotMatch(pathHtml, /Conhecimento de quem vive o esporte/, 'A chamada genérica repetida precisa ser substituída por contexto específico.');
    assert.match(pathHtml, /id="fb-safety-form" novalidate/);
    assert.match(pathHtml, /id="fb-safety-feedback"[^>]*aria-live="assertive"/);
    assert.match(pathHtml, /id="fb-safety-submit"/);
    assert.match(pathHtml, /A importação substitui os dados atuais somente depois da sua confirmação\./, 'A restauração precisa explicar que substituirá os dados locais.');
    assert.match(pathHtml, /class="fb-app-menu fb-ecosystem-menu"[\s\S]*?data-fb-view="progresso"[\s\S]*?data-fb-view="evolucao"[\s\S]*?data-fb-view="perfil"[\s\S]*?data-fb-view="ferramentas"[\s\S]*?data-fb-view="conteudos"[\s\S]*?data-fb-view="especialistas"/);

    const beIa = fs.readFileSync(path.join(root, 'js/be-ia.js'), 'utf8');
    const knowledgeLibrary = fs.readFileSync(path.join(root, 'js/be-knowledge-library.js'), 'utf8');
    assert.match(beIa, /function getJourneyContext\(profile\)/);
    assert.match(beIa, /window\.BeKnowledgeLibrary/);
    assert.match(knowledgeLibrary, /function assessSafety\(query, context/);
    assert.match(knowledgeLibrary, /function buildResponse\(query, context/);
    assert.match(knowledgeLibrary, /function buildInteraction\(type, context/);
    assert.match(knowledgeLibrary, /REVIEW_STATUS = 'editorial-pending-professional'/);
    assert.match(knowledgeLibrary, /ALIMENTAÇÃO SEM JULGAMENTO/);
    assert.match(beIa, /bemEsportivo:analytics/);
    assert.doesNotMatch(beIa, /interactions\.push\(\{[^}]*query/, 'A Be IA não deve guardar o texto livre do usuário.');

    const pathApp = fs.readFileSync(path.join(root, 'js/fala-bem-app.js'), 'utf8');
    assert.match(pathApp, /requestedView === 'registrar'[\s\S]*?querySelector\('\[data-be-new-entry\]'\)\?\.click\(\)/, 'A chamada Registrar minha atividade precisa abrir o formulário real.');
    assert.match(pathHtml, /id="fb-save-receipt"[^>]*aria-live="polite"/, 'Cada salvamento precisa deixar uma confirmação persistente.');
    assert.match(pathApp, /function showSaveReceipt\(/, 'O app precisa transformar o salvamento em recibo e próximo passo.');
    assert.match(pathApp, /\^meuCaminhoBe\/i[\s\S]*location\.replace\(APP_BASE_PATH\)/, 'Zerar precisa remover todos os dados da jornada e reiniciar o app.');
    const communityComponent = fs.readFileSync(path.join(root, 'js/components/community-comments.js'), 'utf8');
    assert.match(communityComponent, /adultConfirmed:/, 'Comentários públicos precisam enviar a confirmação de maioridade exigida pela API.');
    assert.match(communityComponent, /action: 'reply'/, 'O componente comunitário precisa aceitar respostas públicas.');
    assert.match(communityComponent, /data-community-action="like"/, 'O componente comunitário precisa aceitar curtidas.');
    assert.match(pathHtml, /data-community-scope="path" data-community-id="meu-caminho-be"/, 'A comunidade do Meu Caminho precisa usar o componente global padronizado.');
    const beplayHtml = fs.readFileSync(path.join(root, 'beplay.html'), 'utf8');
    assert.match(beplayHtml, /id="videoComments" data-community-scope="beplay"/, 'O BEplay precisa usar os comentários globais padronizados.');

    const platformCss = fs.readFileSync(path.join(root, 'css/fala-bem-platform.css'), 'utf8');
    assert.match(platformCss, /@media\(min-width:761px\)\{[\s\S]*?body\.fala-bem-app-page \.fb-app-nav\{[\s\S]*?position:static;/);
    assert.match(platformCss, /@media\(max-width:760px\)\{[\s\S]*?\.fb-app-nav\{position:fixed;/);

    const modernCss = fs.readFileSync(path.join(root, 'css/meu-caminho-modern.css'), 'utf8');
    assert.match(modernCss, /--mcb-orange:#f4511e/);
    assert.match(modernCss, /@media\(min-width:901px\)\{[\s\S]*?grid-template-columns:224px minmax\(0,1fr\)/);
    assert.match(modernCss, /@media\(max-width:900px\)\{[\s\S]*?position:fixed!important/);
    assert.match(modernCss, /#be-ia:not\(\.fb-progressive-open\)/);
    assert.match(modernCss, /#fb-week-zone/);

    const diaryCss = fs.readFileSync(path.join(root, 'css/meu-caminho-diary.css'), 'utf8');
    assert.match(diaryCss, /Navegação principal: as mesmas cinco ações em todas as telas/, 'Desktop e celular precisam compartilhar a mesma arquitetura principal.');
    assert.match(diaryCss, /fb-app-topbar \.fb-app-brand\{display:flex;min-width:0\}/, 'O cabeçalho mobile precisa manter o logo visível.');
    assert.match(diaryCss, /be-showcase-copy>a:not\(\.be-showcase-brand\)/, 'A marca da apresentação não pode receber o visual do botão principal.');
    assert.match(diaryCss, /be-section-banner\[data-section="progresso"\]/, 'Jornada precisa ter identidade visual própria.');
    assert.match(diaryCss, /be-section-banner\[data-section="ferramentas"\]/, 'Ferramentas precisa ter identidade visual própria.');
    assert.match(diaryCss, /be-section-banner\[data-section="perfil"\]/, 'Perfil precisa ter identidade visual própria.');
    assert.match(diaryCss, /be-section-banner\[data-section="registrar"\]/, 'Registrar precisa ter identidade visual própria.');
    assert.match(diaryCss, /fb-app-shell\.fb-app-shell-compact \.fb-app-intro\.be-product-showcase\{display:none!important\}/, 'O banner da Home não deve se repetir nas subpáginas.');
    assert.match(diaryCss, /fb-bottom-specialists:not\(\.fb-app-visible\)\{display:none!important\}/, 'A vitrine de profissionais só deve aparecer quando solicitada.');
    assert.match(diaryCss, /fb-app-nav>a span\{overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important\}/, 'Os rótulos da navegação móvel precisam permanecer dentro de sua coluna.');
    assert.match(diaryCss, /overflow-wrap:break-word/, 'Textos precisam quebrar dentro das margens em telas estreitas.');
    assert.match(diaryCss, /be-profile-social-card/, 'O Perfil precisa usar apresentação visual de identidade social.');

    const appScript = fs.readFileSync(path.join(root, 'js/fala-bem-app.js'), 'utf8');
    const diaryScript = fs.readFileSync(path.join(root, 'js/meu-caminho-diary.js'), 'utf8');
    assert.match(appScript, /function recordJourneyStep\(/);
    assert.match(appScript, /APP_BASE_PATH = '\/meu-caminho-be'/);
    assert.match(appScript, /function viewFromAppPath\(pathname = location\.pathname\)/);
    assert.match(appScript, /url\.pathname = routePath/);
    assert.match(appScript, /url\.searchParams\.delete\('tela'\)/);
    assert.match(appScript, /shell\.classList\.toggle\('fb-app-shell-compact', view !== 'inicio'\)/, 'A apresentação deve ficar na Home, não nas subpáginas.');
    assert.match(appScript, /toolsMount && toolsSection\) toolsMount\.append\(toolsSection\)/, 'A seção Ferramentas precisa ser montada dentro do painel do aplicativo.');
    assert.match(appScript, /if \(path === `\$\{APP_BASE_PATH\}\/jornada`\) return 'progresso'/, 'A URL de Jornada deve abrir a subpágina interna mesmo antes do perfil ser criado.');
    assert.doesNotMatch(appScript, /requestedView === 'progresso' && !currentProfile\?\.objective/, 'A navegação principal não deve desviar Jornada para um fluxo externo.');
    assert.match(appScript, /const sectionBannerContent = \{[\s\S]*progresso:[\s\S]*ferramentas:[\s\S]*perfil:/, 'Jornada, Ferramentas e Perfil precisam de banners contextualizados.');
    assert.match(appScript, /function renderSectionBanner\(primarySection\)/);
    assert.match(appScript, /registrar: `\$\{APP_BASE_PATH\}\/registrar`/);
    assert.match(appScript, /function renderProfilePresentation\(\)/);
    assert.match(appScript, /profileEditMode = false;[\s\S]*saveProfile\(\{ name, email, location, photoDataUrl, sportProfile/);
    assert.match(appScript, /source: 'journey_form'/);
    assert.match(appScript, /source: 'be_now'/);
    assert.match(appScript, /function renderBeNow\(/);
    assert.match(appScript, /function readBeNowExecution\(\)/);
    assert.match(appScript, /function updateBeNowTimerUi\(\)/);
    assert.match(appScript, /sessionStorage\.setItem\(BE_NOW_TIMER_KEY/);
    assert.match(appScript, /pausedForSafety = normalizedBarrier === 'desconforto'/);
    assert.match(appScript, /function validateSafetyForm\(form, profileUpdate\)/);
    assert.match(appScript, /currentProfile\?\.objective[\s\S]*?\{ \.\.\.currentProfile \}/);
    assert.match(appScript, /function sanitizeProfilePhoto\(value\)/);
    assert.match(appScript, /async function resizeProfilePhoto\(file\)/);
    assert.match(appScript, /meuCaminhoBe:profile-updated/);
    assert.match(appScript, /function openDayPlanDialog\(\)/);
    assert.match(appScript, /function renderDashboardPlan\(\)/);
    assert.match(appScript, /function buildLocalInteraction\(type, context, fallback\)/);
    assert.match(appScript, /buildLocalInteraction\('plan_saved'/);
    assert.match(appScript, /getElementById\('fb-day-guide-done'\)[\s\S]{0,160}?openDailyJournal\(\)/, 'Confirmar uma intenção precisa abrir o diário, sem marcar o plano como atividade realizada.');
    assert.match(appScript, /activity === 'descanso' \? 'descanso' : 'movimento'/);
    assert.match(appScript, /BACKUP_KIND = 'meu-caminho-be-backup'/);
    assert.match(appScript, /BACKUP_MAX_BYTES = 5 \* 1024 \* 1024/);
    assert.match(appScript, /function sanitizeBackupDiary\(entries\)/);
    assert.match(appScript, /function sanitizeBackupMeals\(records\)/);
    assert.match(appScript, /profile \? \{[\s\S]*?\} : null;/, 'Um backup criado sem perfil também precisa ser restaurável.');
    assert.match(appScript, /Importar este backup substituirá os dados atuais deste aparelho/);
    assert.match(appScript, /restoreLocalBackup\(previousValues\)/, 'Uma falha de armazenamento precisa restaurar os dados anteriores.');
    assert.match(diaryScript, /MEALS_STORAGE_KEY = 'meuCaminhoBeMealsV1'/);
    assert.match(diaryScript, /if \(!Number\.isFinite\(rawDuration\) \|\| rawDuration < 1\) return null;/, 'Atividades sem duração válida não podem entrar na jornada.');
    assert.match(diaryScript, /definition\.single && meals\.some/);
    assert.match(diaryScript, /meuCaminhoBe:meals-changed/);
    assert.match(diaryScript, /function selectMealType\(type\)/);
    assert.match(diaryScript, /function includeMeal\(type, description\)/);
    assert.match(diaryScript, /function contextualFeedback\(entry, wasNew\)/);
    assert.match(diaryScript, /BeKnowledgeLibrary\?\.buildInteraction\?\./);
    assert.match(diaryScript, /buildInteraction\?\.\('meal_saved'/);
    assert.match(diaryScript, /meuCaminhoBe:feedback/);
    assert.match(diaryScript, /function emitFeedback\(interaction, options/);
    assert.doesNotMatch(diaryScript, /be-success-dialog/, 'A confirmação de atividade deve usar retorno leve e não um modal intermediário.');

    const routineScript = fs.readFileSync(path.join(root, 'js/routine-calendar.js'), 'utf8');
    assert.match(routineScript, /function writeTasks\(\)[\s\S]*?catch \(error\) \{[\s\S]*?return false;/, 'Falhas ao salvar a agenda precisam ser tratadas.');
    assert.match(routineScript, /title:previous\?'Tarefa atualizada!'\:'Tarefa salva!'/, 'A agenda precisa confirmar criação e atualização.');
    assert.match(diaryScript, /description: String\(record\.description \|\| ''\)\.trim\(\)\.slice\(0, 240\)/);
    assert.match(diaryScript, /function saveEntries\(\)[\s\S]*?catch \{[\s\S]*?return false;/, 'Falhas ao salvar atividades precisam ser tratadas.');
    assert.match(diaryScript, /const previousEntries = \[\.\.\.entries\][\s\S]*?entries = previousEntries;/, 'Uma gravação de atividade malsucedida precisa preservar o estado anterior.');
    assert.match(diaryScript, /const previousMeals = \[\.\.\.meals\][\s\S]*?meals = previousMeals;/, 'Uma remoção de refeição malsucedida precisa preservar o registro.');

    const reportPageFile = fs.readdirSync(root).find(fileName => fileName.toLowerCase() === 'reportagens.html');
    assert.equal(reportPageFile, 'reportagens.html', 'O arquivo de Reportagens precisa usar minúsculas para coincidir com a URL do menu no Cloudflare.');

    const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
    assert.match(redirects, /\/api\/analytics\/events\s+\/\.netlify\/functions\/analytics/);
    assert.match(redirects, /\/api\/routine-notifications\/\*/);
    assert.match(redirects, /\/meu-caminho-be\/\*\s+\/meu-caminho-be\.html\s+200/, 'As subpáginas do Meu Caminho Be precisam abrir diretamente.');
    assert.doesNotMatch(redirects, /^\/reportagens\s+/m, 'A rota /reportagens deve ser resolvida diretamente pelo arquivo reportagens.html, sem redirecionamento de caixa.');

    const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    assert.match(serviceWorker, /CACHE_NAME = 'meu-caminho-be-v91'/);
    assert.match(serviceWorker, /\/js\/site-common\.js\?v=20260807-1/);
    assert.match(serviceWorker, /\/js\/core\/routes\.js\?v=20260807-1/);
    assert.match(serviceWorker, /\/js\/components\/site-navigation\.js\?v=20260807-1/);
    assert.match(serviceWorker, /\/js\/fala-bem-app\.js\?v=20260813-3/);
    assert.match(serviceWorker, /\/css\/meu-caminho-modern\.css\?v=20260806-1/);
    assert.match(serviceWorker, /\/img\/bruno-rafael-resende-treino-funcional\.jpg/);
    assert.match(serviceWorker, /\/js\/be-knowledge-library\.js\?v=20260813-3/);
    assert.match(serviceWorker, /\/js\/be-ia\.js\?v=20260806-1/);
    assert.match(serviceWorker, /\/js\/meu-caminho-diary\.js\?v=20260813-3/);
    assert.match(serviceWorker, /\/js\/routine-calendar\.js\?v=20260807-1/);
    assert.match(serviceWorker, /\/css\/meu-caminho-diary\.css\?v=20260813-3/);
    assert.match(serviceWorker, /url\.pathname\.startsWith\('\/meu-caminho-be\/'\)/, 'O app precisa continuar acessível offline em suas subpáginas.');
    assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)/, 'O service worker não deve armazenar respostas privadas de API.');

    const syncFunction = fs.readFileSync(path.join(root, 'functions/api/meu-caminho-sync.js'), 'utf8');
    assert.match(syncFunction, /algorithm === 'AES-GCM'/);
    assert.match(syncFunction, /lastMutationId/);
    assert.match(syncFunction, /be-sync-verifier/);

    const routineFunction = fs.readFileSync(path.join(root, 'functions/api/routine-notifications/[[path]].js'), 'utf8');
    const routineCore = fs.readFileSync(path.join(root, 'server/routine-notifications-core.mjs'), 'utf8');
    const routineWorker = fs.readFileSync(path.join(root, 'workers/routine-notifications.js'), 'utf8');
    const routineConfig = fs.readFileSync(path.join(root, 'wrangler.notifications.jsonc'), 'utf8');
    assert.match(routineFunction, /handleRoutineNotifications/);
    assert.match(routineCore, /routine:install:/);
    assert.match(routineCore, /bemesportivo\.pages\.dev/);
    assert.match(routineWorker, /async scheduled/);
    assert.match(routineWorker, /sendNotification/);
    assert.match(routineConfig, /"\* \* \* \* \*"/);
    assert.match(routineConfig, /"binding": "BE_DATA"/);

    console.log(`Teste funcional aprovado: ${pages.length} páginas, shell mobile, APIs, PWA, vídeo, continuidade criptografada, lembretes e integrações essenciais.`);
  } finally {
    server.kill();
    await delay(100);
    fs.writeFileSync(communityStatePath, originalCommunityState);
    if (!server.killed && serverError) process.stderr.write(serverError);
  }
}

run().catch(error => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
