'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const port = 3197;
const baseUrl = `http://127.0.0.1:${port}`;
const pages = [
  '/',
  '/admin',
  '/reportagens',
  '/reportagens/treino-funcional-br-assessoria',
  '/reportagens/elas-em-movimento-serra-talhada',
  '/reportagens/dedicacao-talento-mirim',
  '/reportagens/duda-e-o-futebol',
  '/reportagens/elas-trazem-esperanca',
  '/reportagens/mayara-magnolia-papo-bem-esportivo',
  '/reportagens/sergio-lima-exemplo-de-vida',
  '/reportagens/thais-garcez-metamorfose',
  '/meu-caminho-be',
  '/meu-caminho-be/registrar',
  '/meu-caminho-be/jornada',
  '/meu-caminho-be/jornada/evolucao',
  '/meu-caminho-be/jornada/historia',
  '/meu-caminho-be/ferramentas',
  '/meu-caminho-be/perfil',
  '/perfil-publico',
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
  const server = spawn(process.execPath, ['scripts/dev-server.js'], {
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
    assert.match(reportListing, /data-report-created="2026-08-20T21:24:51-03:00"[\s\S]*Thais Garcez, uma nova versão[\s\S]*Elas trazem esperança[\s\S]*Mayara e Magnólia no Papo Bem Esportivo[\s\S]*Sergio Lima, aos 61 anos[\s\S]*Mulheres em ação e movimento[\s\S]*Treino funcional reúne movimento[\s\S]*Dedicação e Talento Mirim em Campo[\s\S]*Duda e o Futebol/, 'As reportagens precisam aparecer da criação mais recente para a mais antiga.');
    const thaisReport = fs.readFileSync(path.join(root, 'reportagem-thais-garcez-metamorfose.html'), 'utf8');
    assert.match(thaisReport, /<h1>Thais Garcez, uma nova versão<\/h1>/);
    assert.match(thaisReport, /class="report-video-layout"/);
    assert.match(thaisReport, /img\/Thais%20Garcez\/thais-garcez-relato\.mp4/);
    assert.match(thaisReport, /data-share-cover="\/img\/Thais%20Garcez\/thais-garcez-capa\.jpg"/);
    assert.match(thaisReport, /data-share-cover-button/);
    assert.match(thaisReport, /data-share-download/);
    assert.ok(fs.existsSync(path.join(root, 'img', 'Thais Garcez', 'thais-garcez-relato.mp4')), 'Vídeo do relato de Thais ausente.');
    const thaisVideo = await fetch(`${baseUrl}/img/Thais%20Garcez/thais-garcez-relato.mp4`, {
      headers: { Range: 'bytes=0-1023' }
    });
    assert.equal(thaisVideo.status, 206);
    assert.match(thaisVideo.headers.get('content-type') || '', /video\/mp4/);
    assert.equal((await thaisVideo.arrayBuffer()).byteLength, 1024);
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
    assert.match(elasReport, /site-common\.css\?v=20260814-1[\s\S]*reportagens\.css\?v=20260814-7/);
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
    const archiveReport = fs.readFileSync(path.join(root, 'reportagem-elas-trazem-esperanca.html'), 'utf8');
    assert.match(archiveReport, /<h1>Elas trazem esperança<\/h1>/);
    assert.match(archiveReport, /datePublished\":\"2019-06-10/);
    assert.match(archiveReport, /Por Válter Igor/);
    assert.match(archiveReport, /Eduarda “Duda” Mielczarek Martins/);
    assert.match(archiveReport, /<h3>Lara<\/h3>/);
    assert.match(archiveReport, /class="report-archive-note"/);
    assert.match(archiveReport, /class="report-athlete-profiles"/);
    assert.match(archiveReport, /class="report-archive-photo-gallery"/);
    assert.match(archiveReport, /data-share-cover="\/img\/elas-trazem-esperanca-lara-duda-portela\.webp"/);
    assert.match(archiveReport, /data-report-comments="elas-trazem-esperanca"/);
    assert.match(reportListing, /href="\/reportagens\/elas-trazem-esperanca"[\s\S]*Elas trazem esperança/);
    assert.match(reportListing, /class="report-preview-hope"[^>]*elas-trazem-esperanca-lara-duda-portela\.webp/);
    for (const image of ['elas-trazem-esperanca-lara.webp', 'elas-trazem-esperanca-duda.webp', 'elas-trazem-esperanca-lara-duda-portela.webp']) {
      assert.ok(fs.existsSync(path.join(root, 'img', image)), `Imagem da reportagem de arquivo ausente: ${image}`);
      assert.match(archiveReport, new RegExp(image.replace('.', '\\.')), `A reportagem precisa usar a imagem: ${image}`);
    }
    const interviewReport = fs.readFileSync(path.join(root, 'reportagem-mayara-magnolia-papo-bem-esportivo.html'), 'utf8');
    assert.match(interviewReport, /<h1>Mayara e Magnólia no Papo Bem Esportivo<\/h1>/);
    assert.match(interviewReport, /datePublished":"2017-01-16/);
    assert.match(interviewReport, /youtube-nocookie\.com\/embed\/_ry3RHB8uCA/);
    assert.match(interviewReport, /duration":"PT13M42S/);
    assert.match(interviewReport, /fotos e edição de Válter Igor; vídeo de Anderson/);
    assert.match(interviewReport, /data-report-comments="mayara-magnolia-papo-bem-esportivo"/);
    assert.match(interviewReport, /data-share-cover="\/img\/mayara-magnolia-papo-bem-esportivo\.jpg"/);
    assert.match(interviewReport, /class="report-cover-theme"[\s\S]*Papo Bem Esportivo[\s\S]*Mayara e Magnólia[\s\S]*Tênis, educação e determinação/);
    assert.match(reportListing, /href="\/reportagens\/mayara-magnolia-papo-bem-esportivo"[\s\S]*Mayara e Magnólia no Papo Bem Esportivo/);
    assert.ok(fs.existsSync(path.join(root, 'img', 'mayara-magnolia-papo-bem-esportivo.jpg')), 'Capa da entrevista de Mayara e Magnólia ausente.');
    const sergioReport = fs.readFileSync(path.join(root, 'reportagem-sergio-lima-exemplo-de-vida.html'), 'utf8');
    assert.match(sergioReport, /<h1>Sergio Lima, aos 61 anos, grande exemplo de vida<\/h1>/);
    assert.match(sergioReport, /datePublished":"2017-01-03/);
    assert.match(sergioReport, /youtube-nocookie\.com\/embed\/GzXDxAVdsnQ/);
    assert.match(sergioReport, /duration":"PT5M48S/);
    assert.match(sergioReport, /data-report-comments="sergio-lima-exemplo-de-vida"/);
    assert.match(sergioReport, /data-share-cover="\/img\/sergio-lima-exemplo-de-vida\.jpg"/);
    assert.match(sergioReport, /class="report-cover-theme"[\s\S]*Papo do Bem Esportivo[\s\S]*Sergio Lima[\s\S]*Aos 61 anos, um exemplo de vida/);
    assert.match(reportListing, /href="\/reportagens\/sergio-lima-exemplo-de-vida"[\s\S]*Sergio Lima, aos 61 anos, grande exemplo de vida/);
    assert.ok(fs.existsSync(path.join(root, 'img', 'sergio-lima-exemplo-de-vida.jpg')), 'Capa da entrevista de Sergio Lima ausente.');
    for (const reportFile of ['reportagem-elas-em-movimento-serra-talhada.html', 'reportagem-treino-funcional.html', 'reportagem-dedicacao-talento-mirim.html', 'reportagem-duda-e-o-futebol.html', 'reportagem-elas-trazem-esperanca.html', 'reportagem-mayara-magnolia-papo-bem-esportivo.html', 'reportagem-sergio-lima-exemplo-de-vida.html']) {
      const reportHtml = fs.readFileSync(path.join(root, reportFile), 'utf8');
      assert.match(reportHtml, /reportagens\.css\?v=20260814-7/, `A reportagem precisa carregar o modelo editorial atualizado: ${reportFile}`);
      assert.match(reportHtml, /data-share-copy/, `A reportagem precisa oferecer cópia direta do link: ${reportFile}`);
      assert.match(reportHtml, /class="report-path-bridge"[\s\S]*Começar minha trajetória/, `A reportagem precisa conectar leitura e trajetória: ${reportFile}`);
    }
    const allReportFiles = [
      'reportagem-elas-em-movimento-serra-talhada.html',
      'reportagem-treino-funcional.html',
      'reportagem-dedicacao-talento-mirim.html',
      'reportagem-duda-e-o-futebol.html',
      'reportagem-elas-trazem-esperanca.html',
      'reportagem-mayara-magnolia-papo-bem-esportivo.html',
      'reportagem-sergio-lima-exemplo-de-vida.html',
      'reportagem-thais-garcez-metamorfose.html'
    ];
    for (const reportFile of allReportFiles) {
      const reportHtml = fs.readFileSync(path.join(root, reportFile), 'utf8');
      assert.match(reportHtml, /data-report-comments="[^"]+"/, `A reportagem precisa incluir a seção de comentários: ${reportFile}`);
      assert.match(reportHtml, /class="report-related"/, `A reportagem precisa incluir leituras relacionadas: ${reportFile}`);
      assert.equal((reportHtml.match(/class="report-related-meta"/g) || []).length, 3, `A reportagem precisa recomendar três leituras: ${reportFile}`);
    }
    for (const reportFile of ['reportagem-treino-funcional.html', 'reportagem-dedicacao-talento-mirim.html', 'reportagem-duda-e-o-futebol.html']) {
      const reportHtml = fs.readFileSync(path.join(root, reportFile), 'utf8');
      assert.ok((reportHtml.match(/class="report-article-section"/g) || []).length >= 3, `A reportagem antiga precisa usar blocos editoriais padronizados: ${reportFile}`);
      assert.match(reportHtml, /class="report-lead"/, `A reportagem antiga precisa destacar a abertura editorial: ${reportFile}`);
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
    assert.match(reportCss, /\.reportagens-page \.be-community-heading\s*\{[\s\S]*?position:\s*static;[\s\S]*?background:\s*transparent;/);
    assert.match(reportCss, /\.report-preview-media \.report-preview-hope\s*\{[\s\S]*?object-fit:\s*contain;/);
    assert.match(reportCss, /\.report-related > div\s*\{[\s\S]*?grid-template-columns:\s*repeat\(3/);
    const homeHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(homeHtml, /class="be-hero-brand" aria-label="Bem Esportivo"><span aria-hidden="true">Bem<\/span><span aria-hidden="true">Esportivo<\/span><\/p>\s*<h1 id="home-hero-title">O que você busca no esporte\?<\/h1>/, 'A busca principal precisa apresentar apenas a marca e a pergunta em sua nova hierarquia.');
    assert.match(homeHtml, /id="be-ecosystem-search-input"[^>]*aria-label="O que você busca no esporte\?"/, 'O campo principal de busca precisa ter um nome acessível independente do placeholder.');
    assert.doesNotMatch(homeHtml, /class="be-search-examples"/, 'O hero da busca deve permanecer visualmente limpo, sem atalhos adicionais.');
    assert.match(homeHtml, /css\/be-ecosystem-search\.css\?v=20260829-8/, 'A Home precisa carregar a versão atual do visual da busca.');
    assert.match(homeHtml, /id="be-products-scroll-hint"[\s\S]*?Deslize para explorar/, 'A navegação lateral da Home precisa orientar o gesto no mobile.');
    assert.match(homeHtml, /js\/be-products-carousel\.js\?v=20260831-2/, 'A Home precisa carregar o movimento progressivo dos atalhos.');
    const professionalsHtml = fs.readFileSync(path.join(root, 'profissionais.html'), 'utf8');
    const professionalsScript = fs.readFileSync(path.join(root, 'js/profissionais.js'), 'utf8');
    assert.match(professionalsHtml, /id="professionals-hero-title">Encontre quem pode ajudar no seu próximo passo\./, 'Profissionais precisa começar pela necessidade da pessoa.');
    assert.match(professionalsHtml, /css\/profissionais\.css\?v=20260823-3/);
    assert.match(professionalsHtml, /js\/profissionais\.js\?v=20260823-2/);
    assert.match(professionalsHtml, /id="como-funciona"[\s\S]*data-guide-category="personal"[\s\S]*data-guide-category="psicologia"[\s\S]*data-guide-category="fotografia"[\s\S]*data-guide-category="todos"/, 'Profissionais precisa orientar a escolha antes de exibir os perfis.');
    assert.match(professionalsHtml, /id="profissionais"[\s\S]*id="result-count"[\s\S]*id="lista"/, 'A lista precisa informar quantos profissionais correspondem à busca.');
    assert.doesNotMatch(professionalsHtml, /(?:ai-agent-data|ai-agent-service|profissionais-ai)\.js/, 'Profissionais não deve solicitar scripts antigos que não existem.');
    assert.match(professionalsScript, /data-profile-index/);
    assert.doesNotMatch(professionalsScript, /data-contact-index/, 'Cada cartão deve apresentar somente uma ação principal.');
    assert.match(professionalsScript, /data-profile-index="\$\{index\}">Solicitar informações<\/button>/);
    assert.match(professionalsScript, /O Bem Esportivo apresenta o perfil, mas não confirma contratação ou horário\./, 'O contato profissional precisa explicar os limites da plataforma.');
    const adsensePublisher = 'ca-pub-5105345296041597';
    const editorialAdPages = [
      'index.html',
      'sobre.html',
      'reportagens.html',
      'reportagem-dedicacao-talento-mirim.html',
      'reportagem-duda-e-o-futebol.html',
      'reportagem-elas-trazem-esperanca.html',
      'reportagem-mayara-magnolia-papo-bem-esportivo.html',
      'reportagem-sergio-lima-exemplo-de-vida.html',
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
    assert.match(homeHtml, /<main class="home-redesign">\s*<section class="shell home-hero-v2 be-ecosystem-hero" id="inicio"[\s\S]*<section class="shell home-journey"[\s\S]*<section class="shell home-section-v2 home-editorial-feature home-editorial-launch"/, 'A Home precisa apresentar o ecossistema antes da experiência pessoal e da vitrine editorial.');
    assert.match(homeHtml, /id="home-hero-title">O que você busca no esporte\?<\/h1>/, 'O hero precisa partir da necessidade da pessoa.');
    assert.match(homeHtml, /id="be-ecosystem-search-form"[\s\S]*id="be-ecosystem-search-input"[\s\S]*id="be-ecosystem-search-results"/, 'A Busca Be precisa ter formulário, entrada e devolutiva acessível.');
    assert.match(homeHtml, /class="shell be-ecosystem-products"[\s\S]*Conhecimento[\s\S]*BEplay[\s\S]*Reportagens[\s\S]*Game 3D[\s\S]*Profissionais[\s\S]*Ferramentas[\s\S]*Produtos[\s\S]*Meu Caminho Be/, 'A Home precisa apresentar os oito destinos e suas finalidades.');
    assert.match(homeHtml, /class="shell be-search-discovery"[\s\S]*Para começar a explorar[\s\S]*Minha primeira corrida[\s\S]*Calculadora Pace[\s\S]*Thais Garcez, uma nova versão[\s\S]*Como funciona\?[\s\S]*Sem IA generativa/, 'A Home precisa apresentar uma seleção inicial real e explicar a origem dos resultados da Busca Be.');
    assert.match(homeHtml, /class="be-ecosystem-product" href="\/game"[\s\S]*?<strong>Game 3D<\/strong><small>Divirta-se<\/small>/, 'Game 3D precisa abrir seu destino exato.');
    assert.match(homeHtml, /class="be-ecosystem-product" href="\/meu-caminho-be\?tela=conteudos"[\s\S]*?<strong>Conhecimento<\/strong>/, 'Conhecimento precisa abrir seu painel sem redirecionamento de produção.');
    assert.match(homeHtml, /class="be-ecosystem-product" href="\/meu-caminho-be\?tela=ferramentas"[\s\S]*?<strong>Ferramentas<\/strong>/, 'Ferramentas precisa abrir seu painel sem redirecionamento de produção.');
    assert.match(homeHtml, /src="js\/be-sports-library\.js\?v=20260829-5"[\s\S]*src="js\/be-ecosystem-search\.js\?v=20260831-12"/, 'A Home precisa carregar a Biblioteca Esportiva antes da busca determinística.');
    const ecosystemSearch = require(path.join(root, 'js', 'be-ecosystem-search.js'));
    assert.equal(ecosystemSearch.search('Quero saber como melhorar meu chute').primary.id, 'conteudo');
    assert.equal(ecosystemSearch.search('Quero assistir').primary.id, 'beplay');
    assert.equal(ecosystemSearch.search('Quero conversar').primary.id, 'comunidade');
    assert.equal(ecosystemSearch.search('Quero encontrar um profissional').primary.id, 'profissionais');
    assert.equal(ecosystemSearch.search('Quero registrar o que fiz hoje').primary.id, 'meu-caminho');
    assert.equal(ecosystemSearch.search('Quero registrar o que fiz hoje').primary.href, '/meu-caminho-be/registrar');
    assert.equal(ecosystemSearch.search('Quero acompanhar minha evolução').primary.href, '/meu-caminho-be/jornada');
    assert.ok(ecosystemSearch.search('Quero melhorar meu chute').items.some(item => item.title === 'Futebol com inteligência'));
    assert.ok(ecosystemSearch.search('Quero começar a correr').items.some(item => item.title === 'Minha primeira corrida'));
    const bmiCards = ecosystemSearch.SEARCH_ITEMS.filter(item => item.title === 'Calculadora IMC');
    assert.ok(bmiCards.length > 0, 'A busca precisa oferecer a Calculadora IMC.');
    assert.ok(bmiCards.every(item => item.image === '/img/calculadora-imc-balanca-fita.webp'), 'A Calculadora IMC precisa usar sua imagem temática exclusiva.');
    const swimmingSearch = ecosystemSearch.search('Quero começar a nadar');
    assert.equal(swimmingSearch.primary.id, 'conteudo');
    assert.equal(swimmingSearch.sport.id, 'natacao');
    assert.equal(swimmingSearch.intent.id, 'start');
    assert.equal(swimmingSearch.coverage, 'library');
    assert.ok(swimmingSearch.items.some(item => item.title === 'Primeiros passos para começar na natação'));
    assert.ok(swimmingSearch.items.some(item => item.title === 'Benefícios da natação para a saúde'));
    assert.ok(swimmingSearch.items.some(item => item.product === 'profissionais'));
    assert.ok(swimmingSearch.items.some(item => item.title === 'Dicas práticas para começar'));
    assert.ok(swimmingSearch.items.every(item => !/corrida|futebol/i.test(item.title)));
    const swimmingLog = ecosystemSearch.search('Quero registrar minha natação');
    assert.equal(swimmingLog.primary.id, 'meu-caminho');
    assert.ok(swimmingLog.items.some(item => item.href === '/meu-caminho-be/registrar'));
    const handballSearch = ecosystemSearch.search('Quero praticar handebol');
    assert.equal(handballSearch.sport.id, 'handebol');
    assert.equal(handballSearch.coverage, 'library');
    assert.ok(handballSearch.items.some(item => item.title === 'Primeiros passos para começar no handebol'));
    const volleyballSearch = ecosystemSearch.search('Quero melhorar meu saque no vôlei');
    assert.equal(volleyballSearch.sport.id, 'voleibol');
    assert.equal(volleyballSearch.coverage, 'library');
    assert.ok(volleyballSearch.items.some(item => item.title === 'Dicas para um bom saque no voleibol'));
    assert.ok(volleyballSearch.items.some(item => item.title === 'Benefícios do voleibol para a saúde'));
    assert.ok(volleyballSearch.items.some(item => item.product === 'profissionais'));
    assert.ok(volleyballSearch.items.some(item => item.product === 'ferramentas'));
    const unknownSport = ecosystemSearch.search('Quero praticar curling');
    assert.equal(unknownSport.coverage, 'general');
    assert.ok(unknownSport.items.every(item => !/primeira corrida|futebol com inteligência/i.test(item.title)));
    assert.match(homeHtml, /id="home-content-title">Histórias que colocam o esporte <em>em movimento\.<\/em>/, 'A Home precisa apresentar a vitrine editorial principal.');
    assert.match(homeHtml, /class="home-editorial-grid" data-report-order="inclusion-desc" data-latest-reports-source="\/reportagens"[\s\S]*Thais Garcez, uma nova versão[\s\S]*Elas trazem esperança[\s\S]*Mayara e Magnólia no Papo Bem Esportivo/, 'A vitrine editorial precisa manter como fallback as três reportagens mais recentes do acervo.');
    assert.match(homeHtml, /src="js\/home-latest-reports\.js\?v=20260821-1"/, 'A Home precisa sincronizar seus destaques com a listagem de reportagens.');
    const latestReportsScript = fs.readFileSync(path.join(root, 'js', 'home-latest-reports.js'), 'utf8');
    assert.match(latestReportsScript, /querySelectorAll\("\.report-listing \.report-preview"\)/);
    assert.match(latestReportsScript, /querySelector\(":is\(h2, h3\) a"\)/, 'O sincronizador precisa reconhecer tanto o título em destaque quanto os títulos da grade.');
    assert.match(latestReportsScript, /slice\(0, FEATURE_LIMIT\)/);
    assert.match(homeHtml, /class="shell home-journey"[\s\S]*Seu diário <em>esportivo digital\.<\/em>/, 'A Home precisa preservar o bloco do Meu Caminho Be.');
    assert.match(homeHtml, /class="shell home-split"[\s\S]*Corrida da Hidratação[\s\S]*Assista\. Inspire-se\. Evolua sempre\./, 'A Home precisa conectar Game e BePlay.');
    assert.doesNotMatch(homeHtml, /id="home-report-title"/, 'A Home não deve repetir a mesma vitrine de reportagens.');
    assert.match(homeHtml, /href="\/reportagens">Explorar todas as reportagens/, 'A vitrine editorial precisa abrir o acervo completo.');
    assert.match(homeHtml, /href="\/meu-caminho-be\?tela=mapa">Começar meu Caminho/, 'A chamada da jornada precisa abrir a criação do Mapa BeM.');
    assert.doesNotMatch(homeHtml, /class="home-path-feature"[\s\S]*Dados ficam neste aparelho[\s\S]*<\/section>/, 'A prévia da Home não deve exibir o estado local do aparelho.');
    assert.match(homeHtml, /href="\/meu-caminho-be"[\s\S]*Meu Caminho Be[\s\S]*href="\/meu-caminho-be\?tela=perfil"[\s\S]*Perfil[\s\S]*href="\/game"[\s\S]*Game 3D[\s\S]*href="\/reportagens"[\s\S]*Reportagens[\s\S]*href="\/beplay"[\s\S]*BEplay[\s\S]*href="\/profissionais"[\s\S]*Profissionais[\s\S]*href="\/produtos"[\s\S]*Produtos/, 'A Home precisa preservar o menu principal e o Perfil do Meu Caminho Be.');
    assert.match(homeHtml, /href="\/meu-caminho-be\?tela=ferramentas"/, 'A Home precisa abrir a área de Ferramentas sem perder o destino no Cloudflare.');
    assert.match(homeHtml, /O conteúdo inspira\. A sua história começa quando você <span>vive o esporte\.<\/span>/);
    assert.doesNotMatch(homeHtml, /<h2>Meu Caminho Be<\/h2>/, 'Meu Caminho Be não deve ser usado como nome de coluna editorial.');
    assert.match(reportListing, /class="report-path-bridge"[\s\S]*Conhecer o Meu Caminho Be/);
    const routesScript = fs.readFileSync(path.join(root, 'js', 'core', 'routes.js'), 'utf8');
    assert.match(routesScript, /'\/meu-caminho-be', 'Meu Caminho Be'[\s\S]*'\/meu-caminho-be\/perfil', 'Perfil'[\s\S]*'\/game', 'Game 3D'[\s\S]*'\/reportagens', 'Reportagens'[\s\S]*'\/beplay', 'BEplay'[\s\S]*'\/profissionais', 'Profissionais'[\s\S]*'\/produtos', 'Produtos'/);
    assert.doesNotMatch(routesScript, /'\/#treinos'|'\/#pessoas'/, 'O menu compartilhado não deve reintroduzir atalhos removidos da navegação principal.');
    assert.doesNotMatch(elasReport, /mulheres-em-acao-funcional-serra-talhada/);
    for (const image of ['mulheres-em-movimento-serra-talhada-sem-logo-640.webp', 'mulheres-em-movimento-serra-talhada-sem-logo-960.webp', 'mulheres-em-movimento-serra-talhada-sem-logo-1440.webp']) {
      assert.ok(fs.existsSync(path.join(root, 'img', image)), `Imagem da reportagem ausente: ${image}`);
    }
    assert.doesNotMatch(pathHtml, /fb-photo-checkin|photo-checkin\.js|Analisar minha foto/);
    for (const id of ['be-entry-photo', 'be-entry-note', 'be-entry-public-help', 'fb-profile-public-enabled', 'fb-profile-public-consent', 'fb-profile-age', 'fb-profile-profession', 'be-public-manager', 'be-public-new-post', 'be-public-compose-form', 'be-public-compose-text', 'be-public-compose-photo']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Fluxo de diário público/privado ausente: ${id}`);
    }
    assert.match(pathHtml, /name="visibility" value="private" checked[\s\S]*name="visibility" value="public"/, 'O diário precisa permanecer privado por padrão e oferecer compartilhamento público explícito.');
    assert.match(pathHtml, /Como foi e o que aconteceu\?[\s\S]*obrigatório ao compartilhar/, 'Fotos e publicações precisam ter um relato contextual.');
    assert.doesNotMatch(pathHtml, /id="be-entry-video"/, 'O blog público ainda não deve oferecer publicação de vídeo.');
    const publicProfileHtml = fs.readFileSync(path.join(root, 'perfil-publico.html'), 'utf8');
    const publicProfileScript = fs.readFileSync(path.join(root, 'js/perfil-publico.js'), 'utf8');
    const shareCardScript = fs.readFileSync(path.join(root, 'js/be-share-card.js'), 'utf8');
    const publicDiaryScript = fs.readFileSync(path.join(root, 'js/meu-caminho-public.js'), 'utf8');
    assert.match(publicProfileHtml, /MEU DIÁRIO BE[\s\S]*PUBLICAÇÕES/);
    assert.match(publicProfileHtml, /id="be-public-report-profile"/, 'Visitantes precisam conseguir denunciar um perfil público.');
    assert.doesNotMatch(publicProfileHtml, /id="be-public-share"/, 'Visitantes não devem receber um botão para compartilhar o diário.');
    assert.doesNotMatch(publicProfileHtml, /be-public-owner-share-button|be-public-owner-cover-download/, 'A capa do perfil não deve concentrar as ações de compartilhamento.');
    assert.match(pathHtml, /id="be-public-share-owner"/, 'Somente a área privada do proprietário deve oferecer o compartilhamento do link.');
    assert.match(publicProfileHtml, /class="be-public-print-block"/, 'A impressão da página pública precisa ocultar o conteúdo.');
    assert.match(publicProfileScript, /dataset\.watermark/, 'Publicações públicas precisam exibir identificação contra cópias sem origem.');
    assert.match(shareCardScript, /story: \{ width: 1080, height: 1920[\s\S]*feed: \{ width: 1080, height: 1350/, 'O compartilhamento precisa oferecer formatos próprios para Stories, Status, Feed e WhatsApp.');
    assert.match(shareCardScript, /files: \[file\][\s\S]*navigator\.share/, 'A imagem da publicação precisa seguir para o compartilhamento nativo quando o navegador permitir.');
    assert.match(publicProfileScript, /searchParams\.set\('publicacao', post\.id\)/, 'O link compartilhado precisa abrir a publicação exata.');
    assert.match(publicProfileScript, /if \(ownerDevice\)[\s\S]*dataset\.publicSharePost = post\.id/, 'Somente o proprietário deve receber o botão de compartilhar em cada publicação.');
    assert.match(publicProfileScript, /be-public-post-meta[\s\S]*meta\.append\(time, report, origin\)/, 'Data, denúncia e origem da publicação precisam permanecer visualmente separadas.');
    assert.match(publicProfileScript, /api\/public-profiles\/\$\{slug\}/);
    assert.match(publicProfileScript, /targetType, postId/, 'A página pública precisa enviar denúncias de perfil e publicação.');
    assert.match(publicDiaryScript, /PUBLIC_CODE_KEY = 'meuCaminhoBePublicCodeV1'/, 'A pÃ¡gina pÃºblica precisa ter identidade local prÃ³pria.');
    assert.match(publicDiaryScript, /api\/public-profiles\/identity/, 'A identidade pÃºblica precisa ser registrada automaticamente.');
    assert.match(publicDiaryScript, /PUBLIC_TERMS_VERSION = '2026-08-15'/, 'A publicação imediata precisa de aceite versionado.');
    assert.match(publicDiaryScript, /post:[\s\S]*clientId:[\s\S]*text:[\s\S]*imageDataUrl:/);
    assert.doesNotMatch(publicDiaryScript, /videoUrl: entry\.videoUrl/, 'O envio público deve aceitar somente texto e foto.');
    for (const id of ['fb-continuity-create', 'fb-continuity-output', 'fb-continuity-connect-form', 'fb-continuity-input']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Fluxo de continuidade ausente: ${id}`);
    }
    assert.match(pathHtml, /Criptografado no aparelho/);
    assert.doesNotMatch(pathHtml, /id="fb-login-form"/);
    for (const panel of ['inicio', 'registrar', 'progresso', 'evolucao', 'conteudos', 'explorar', 'perfil']) {
      assert.match(pathHtml, new RegExp(`data-fb-panel="${panel}"`), `Área principal do app ausente: ${panel}`);
    }
    for (const destination of ['perfil', 'inicio', 'registrar', 'progresso', 'conteudos', 'ferramentas']) {
      assert.match(pathHtml, new RegExp(`class="fb-app-nav"[\\s\\S]*?data-fb-view="${destination}"`), `Navegação principal ausente: ${destination}`);
    }
    const primaryNav = pathHtml.match(/<nav class="fb-app-nav"[\s\S]*?<\/nav>/)?.[0] || '';
    assert.equal((primaryNav.match(/<a\b/g) || []).length, 6, 'A navegação principal deve manter Perfil, Meu Hoje, Registrar, Jornada, Explorar e Ferramentas.');
    assert.match(primaryNav, /href="\/meu-caminho-be\/perfil"[\s\S]*href="\/meu-caminho-be"[\s\S]*href="\/meu-caminho-be\/registrar"[\s\S]*href="\/meu-caminho-be\/jornada"[\s\S]*href="\/meu-caminho-be\/ferramentas\/conteudos"[\s\S]*href="\/meu-caminho-be\/ferramentas"/, 'Cada item principal precisa expor sua URL canônica na ordem editorial definida.');
    assert.match(primaryNav, />Perfil<[\s\S]*>Meu Hoje<[\s\S]*>Registrar<[\s\S]*>Jornada<[\s\S]*>Explorar<[\s\S]*>Ferramentas</, 'Os rótulos da navegação precisam expressar a sequência editorial completa.');
    assert.doesNotMatch(primaryNav, /data-fb-view="evolucao"|data-fb-view="explorar"/, 'Evolução e História devem ficar dentro da Jornada.');
    assert.match(pathHtml, /class="[^"]*fb-nav-register[^"]*" href="\/meu-caminho-be\/registrar"/, 'Subpágina central de registro ausente.');
    assert.match(pathHtml, /data-fb-panel="registrar"[\s\S]*id="be-register-page-title"[\s\S]*data-be-new-entry/, 'Registrar precisa ter página própria antes do formulário.');
    assert.match(pathHtml, /data-fb-panel="ferramentas"[\s\S]*id="fb-tools-mount"/, 'Ferramentas precisa ficar dentro de um painel próprio do aplicativo.');
    assert.match(pathHtml, /aria-label="Próximos passos após usar uma ferramenta"[\s\S]*?data-fb-view="dicas">Dicas práticas<\/button>[\s\S]*?data-fb-view="especialistas">Ver profissionais<\/button>/, 'O primeiro próximo passo de Ferramentas precisa abrir somente Dicas práticas.');
    assert.match(pathHtml, /class="be-journey-switcher"[\s\S]*?data-fb-view="progresso"[\s\S]*?data-fb-view="evolucao"[\s\S]*?data-fb-view="explorar"/, 'Diário, Evolução e História precisam permanecer dentro da Jornada.');
    assert.match(pathHtml, /id="be-profile-onboarding"[\s\S]*Perfil Be[\s\S]*Meu Hoje[\s\S]*Próximo passo/, 'O primeiro acesso precisa explicar a sequência antes de coletar os dados do Perfil Be.');
    assert.match(pathHtml, /<h2 id="be-profile-onboarding-title">Crie seu Perfil Be\.<\/h2>[\s\S]*Leva poucos minutos/, 'O Perfil Be precisa ser apresentado como um primeiro passo direto e breve.');
    assert.doesNotMatch(pathHtml, /id="journey-name"/, 'O Mapa BeM não deve perguntar novamente o nome já salvo no Perfil Be.');
    assert.match(pathHtml, /data-step-indicator="1"[^>]*>[\s\S]*Perfil Be/, 'O Mapa BeM precisa reconhecer o Perfil Be como etapa concluída.');
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
    assert.match(pathHtml, /js\/be-knowledge-library\.js\?v=20260821-4/);
    assert.match(pathHtml, /js\/be-ia\.js\?v=20260806-1/);
    assert.match(pathHtml, /css\/meu-caminho-modern\.css\?v=20260806-1/);
    assert.match(pathHtml, /js\/meu-caminho-navigation\.js\?v=20260823-2/);
    assert.match(pathHtml, /js\/meu-caminho-account\.js\?v=20260823-2/);
    assert.match(pathHtml, /js\/fala-bem-app\.js\?v=20260830-2/);
    assert.match(pathHtml, /js\/coluna-valtinho\.js\?v=20260823-1/);
    assert.match(pathHtml, /css\/meu-caminho-diary\.css\?v=20260826-2/);
    assert.match(pathHtml, /css\/meu-caminho-navigation\.css\?v=20260826-1/);
    assert.match(pathHtml, /css\/fala-bem-platform\.css\?v=20260823-1/);
    assert.match(pathHtml, /js\/site-common\.js\?v=20260830-2/);
    assert.match(pathHtml, /class="fb-app-brand" href="\/"/, 'O logo do cabeçalho precisa voltar para a home principal.');
    assert.match(pathHtml, /class="be-showcase-brand" href="\/"[^>]*><strong>MEU CAMINHO BE<\/strong><\/a>/, 'A identificação da apresentação deve ter somente o texto clicável.');
    assert.match(pathHtml, /js\/meu-caminho-diary\.js\?v=20260823-1/);
    assert.match(pathHtml, /id="be-profile-public-access-action"[^>]*>Ativar Meu Diário BE<\/button>/, 'O Perfil BE precisa deixar clara a ativação do Diário BE.');
    assert.match(publicDiaryScript, /Visualizar Meu Diário BE/, 'O botão deve mudar para visualizar o diário depois da publicação.');
    assert.match(publicDiaryScript, /dataset\.bePublicEdit/, 'A pessoa precisa conseguir editar publicações do Diário BE.');
    assert.match(publicDiaryScript, /dataset\.bePublicRemove/, 'A pessoa precisa conseguir retirar publicações do ar.');
    assert.doesNotMatch(publicDiaryScript, /age:\s*profile\?\.publicAge|profession:\s*String\(profile\?\.profession/, 'Idade e profissão não podem integrar o perfil público.');
    assert.doesNotMatch(pathHtml, /id="be-profile-public-copy"/, 'O acesso ao blog deve ter apenas um botão principal.');
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
    assert.ok(
      pathHtml.indexOf('class="be-meals-card"') < pathHtml.indexOf('class="be-diary-welcome"'),
      'As refeições devem aparecer antes do registro “O que você fez hoje?”.'
    );
    for (const id of ['be-dashboard-plan-action', 'be-day-plan-dialog', 'be-day-plan-form', 'be-day-plan-activity', 'be-day-plan-time', 'be-day-plan-duration']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Planejamento do dia ausente: ${id}`);
    }
    assert.doesNotMatch(pathHtml, /id="be-dashboard-plan-action"[^>]*data-be-new-entry/, 'Plano do dia não pode abrir o registro do que já aconteceu.');
    for (const meal of ['breakfast', 'snack', 'lunch', 'dinner']) {
      assert.match(pathHtml, new RegExp(`data-be-meal="${meal}"`), `Opção de alimentação ausente: ${meal}`);
    }
    for (const id of ['fb-profile-photo', 'fb-profile-photo-preview', 'fb-profile-name', 'fb-profile-city', 'fb-profile-state']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Campo de cadastro ausente: ${id}`);
    }
    for (const id of ['be-profile-presentation', 'be-profile-display-name', 'be-profile-edit', 'be-profile-stat-records', 'be-profile-stat-days', 'be-profile-presentation-status']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Apresentação social do Perfil ausente: ${id}`);
    }
    for (const id of ['be-section-banner', 'be-section-banner-title', 'be-section-banner-text', 'be-section-banner-mark']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Banner interno ausente: ${id}`);
    }
    assert.match(pathHtml, /class="be-profile-social-card"[\s\S]*class="be-profile-cover"[\s\S]*class="be-profile-social-identity"/, 'O Perfil precisa apresentar uma identidade social antes do cadastro.');
    assert.match(pathHtml, /class="be-profile-form-section"[\s\S]*Como podemos chamar você\?[\s\S]*IDENTIDADE ESPORTIVA/, 'O acesso local e o perfil esportivo precisam estar organizados em blocos compreensíveis.');
    assert.doesNotMatch(pathHtml, /be-auth-(?:login|signup|recovery|update)-(?:form|email|password)/, 'O Meu Caminho Be não deve oferecer autenticação por e-mail ou senha.');
    assert.doesNotMatch(pathHtml, /meu-caminho-auth\.(?:css|js)/, 'O módulo antigo de autenticação por e-mail não deve ser carregado.');
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
    assert.match(pathHtml, /id="fb-save-receipt"[^>]*aria-live="polite"/, 'Cada salvamento precisa deixar uma confirmação clara no desktop.');
    assert.match(pathApp, /function showSaveReceipt\(/, 'O app precisa transformar o salvamento em recibo e próximo passo.');
    assert.match(pathApp, /\^meuCaminhoBe\/i[\s\S]*location\.replace\(APP_BASE_PATH\)/, 'Zerar precisa remover todos os dados da jornada e reiniciar o app.');
    const commonScript = fs.readFileSync(path.join(root, 'js/site-common.js'), 'utf8');
    const communityComponent = fs.readFileSync(path.join(root, 'js/components/community-comments.js'), 'utf8');
    assert.match(commonScript, /TRANSIENT_SUCCESS_PATTERN[\s\S]*setTimeout\([\s\S]*5000/, 'Confirmações de salvamento e publicação precisam desaparecer automaticamente.');
    assert.match(communityComponent, /adultConfirmed:/, 'Comentários públicos precisam enviar a confirmação de maioridade exigida pela API.');
    assert.match(communityComponent, /action: 'reply'/, 'O componente comunitário precisa aceitar respostas públicas.');
    assert.match(communityComponent, /data-community-action="like"/, 'O componente comunitário precisa aceitar curtidas.');
    assert.match(pathHtml, /data-community-scope="path" data-community-id="meu-caminho-be"/, 'A comunidade do Meu Caminho precisa usar o componente global padronizado.');
    const beplayHtml = fs.readFileSync(path.join(root, 'beplay.html'), 'utf8');
    assert.match(beplayHtml, /id="videoComments" data-community-scope="beplay"/, 'O BEplay precisa usar os comentários globais padronizados.');
    assert.match(beplayHtml, /class="channel-follow"[^>]*href="https:\/\/www\.instagram\.com\/bemesportivo\/"/, 'O card do canal precisa oferecer uma ação real para acompanhar novidades.');
    assert.doesNotMatch(beplayHtml, /id="subscribeChannel"|>Inscrever-se</, 'O BEplay não pode simular uma inscrição que não envia novidades.');
    const journeyReset = fs.readFileSync(path.join(root, 'js/components/journey-reset.js'), 'utf8');
    assert.match(journeyReset, /addEventListener\('click',[\s\S]*true\);/, 'O reset precisa funcionar por delegação independente em modo de captura.');
    assert.match(journeyReset, /event\.stopImmediatePropagation\(\)/, 'O controlador independente precisa impedir acionamento duplicado do reset.');
    assert.match(journeyReset, /journeyKeys\(\)\.forEach[\s\S]*location\.replace/, 'O reset independente precisa apagar a jornada e recarregar o início.');
    const beplayApp = fs.readFileSync(path.join(root, 'js/beplay.js'), 'utf8');
    assert.doesNotMatch(beplayApp, /SUBSCRIPTION_KEY|subscribeChannel|readChannelSubscription/, 'A falsa inscrição local do BEplay precisa permanecer removida.');
    const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
    assert.match(adminHtml, /name="robots" content="noindex, nofollow, noarchive"/, 'O painel administrativo não pode ser indexado.');
    assert.match(adminHtml, /id="adminLoginForm"[\s\S]*id="adminDashboard"/, 'O painel precisa exigir autenticação antes de mostrar a operação.');
    const adminApp = fs.readFileSync(path.join(root, 'js/admin.js'), 'utf8');
    assert.match(adminApp, /sessionStorage[\s\S]*X-BE-Admin-Token/, 'A chave administrativa precisa permanecer restrita à sessão da aba.');
    assert.doesNotMatch(adminApp, /localStorage/, 'O painel não pode persistir a chave administrativa entre sessões.');
    const adminApi = fs.readFileSync(path.join(root, 'functions/api/admin/[[path]].js'), 'utf8');
    assert.match(adminApi, /BE_ADMIN_TOKEN[\s\S]*sameSecret/, 'A API administrativa precisa validar uma chave configurada no servidor.');
    assert.match(adminApi, /admin:audit:/, 'A moderação administrativa precisa manter trilha de auditoria.');
    assert.match(adminApi, /summarizePublicProfiles[\s\S]*moderatePublic/, 'Perfis e publicações públicas precisam permanecer disponíveis para fiscalização administrativa.');

    const platformCss = fs.readFileSync(path.join(root, 'css/fala-bem-platform.css'), 'utf8');
    assert.match(platformCss, /@media\(min-width:761px\)\{[\s\S]*?body\.fala-bem-app-page \.fb-app-nav\{[\s\S]*?position:static;/);
    assert.match(platformCss, /@media\(max-width:760px\)\{[\s\S]*?\.fb-app-nav\{position:fixed;/);
    assert.match(platformCss, /@media\(max-width:760px\)\{\.fb-save-receipt\{display:none!important\}\}/, 'A confirmação persistente não deve ocupar a tela no celular.');

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
    const navigationScript = fs.readFileSync(path.join(root, 'js/meu-caminho-navigation.js'), 'utf8');
    const diaryScript = fs.readFileSync(path.join(root, 'js/meu-caminho-diary.js'), 'utf8');
    assert.match(appScript, /function recordJourneyStep\(/);
    assert.match(appScript, /saveReceiptHideTimer = window\.setTimeout\(hideSaveReceipt, 7000\)/, 'A confirmação interna precisa desaparecer automaticamente.');
    assert.match(appScript, /APP_BASE_PATH = '\/meu-caminho-be'/);
    assert.match(appScript, /function viewFromAppPath\(pathname = location\.pathname\)/);
    assert.match(appScript, /url\.pathname = routePath/);
    assert.match(appScript, /url\.searchParams\.delete\('tela'\)/);
    assert.match(appScript, /shell\.classList\.toggle\('fb-app-shell-compact', view !== 'inicio'\)/, 'A apresentação deve ficar na Home, não nas subpáginas.');
    assert.match(appScript, /toolsMount && toolsSection\) toolsMount\.append\(toolsSection\)/, 'A seção Ferramentas precisa ser montada dentro do painel do aplicativo.');
    assert.match(appScript, /if \(path === `\$\{APP_BASE_PATH\}\/jornada`\) return 'progresso'/, 'A URL de Jornada deve abrir a subpágina interna mesmo antes do perfil ser criado.');
    assert.doesNotMatch(appScript, /requestedView === 'progresso' && !currentProfile\?\.objective/, 'A navegação principal não deve desviar Jornada para um fluxo externo.');
    assert.match(appScript, /const sectionBannerContent = \{[\s\S]*progresso:[\s\S]*ferramentas:[\s\S]*perfil:/, 'Jornada, Ferramentas e Perfil precisam de banners contextualizados.');
    assert.match(appScript, /inicio:\s*\{[\s\S]*?mark: '02'/, 'Meu Hoje precisa representar a etapa 02.');
    assert.match(appScript, /registrar:\s*\{[\s\S]*?mark: '04'/, 'Registrar precisa representar a etapa 04.');
    assert.match(appScript, /progresso:\s*\{[\s\S]*?mark: '05'/, 'Jornada precisa representar a etapa 05.');
    assert.match(appScript, /conteudos:\s*\{[\s\S]*?mark: '06'/, 'Explorar precisa representar a etapa 06.');
    assert.match(appScript, /ferramentas:\s*\{[\s\S]*?mark: '07'/, 'Ferramentas precisa representar a etapa 07.');
    assert.match(appScript, /perfil:\s*\{[\s\S]*?mark: '01'/, 'Perfil precisa representar a etapa 01.');
    assert.match(appScript, /function renderSectionBanner\(primarySection\)/);
    assert.match(navigationScript, /resolveRequestedView/);
    assert.match(navigationScript, /updateGates/);
    assert.match(navigationScript, /Registrar e Jornada serão liberados após o Mapa BeM/);
    assert.match(appScript, /function hasProfileIdentity\(profile = currentProfile\)/);
    assert.match(navigationScript, /!hasIdentity && identityRequiredViews\.has\(requested\)/, 'Somente as etapas pessoais devem aguardar a criacao do Perfil Be.');
    assert.match(navigationScript, /identityRequiredViews = new Set\(\['inicio', 'registrar', 'progresso', 'jornada', 'evolucao', 'explorar'\]\)/);
    assert.doesNotMatch(navigationScript, /identityRequiredViews = new Set\([^\n]*'ferramentas'/, 'Ferramentas deve permanecer publica antes do Perfil Be.');
    assert.match(appScript, /wasIdentityPending && hasProfileIdentity\(\)[\s\S]*openView\('jornada'\)/, 'Salvar o primeiro Perfil Be precisa continuar automaticamente para o Mapa BeM.');
    assert.match(appScript, /registrar: `\$\{APP_BASE_PATH\}\/registrar`/);
    const routeContract = appScript.match(/const appPathForView = \{([\s\S]*?)\n\};/)?.[1] || '';
    const declaredViews = [...new Set([...pathHtml.matchAll(/data-fb-view="([^"]+)"/g)].map(match => match[1]))];
    for (const view of declaredViews) {
      assert.match(routeContract, new RegExp(`\\b${view}:`), `O destino “${view}” precisa ter uma rota canônica.`);
    }
    assert.match(pathHtml, /fb-goals-panel[\s\S]*fb-panel-back" data-fb-view="ferramentas">← Voltar às Ferramentas/);
    assert.match(pathHtml, /fb-tips-panel[\s\S]*fb-panel-back" data-fb-view="ferramentas">← Voltar às Ferramentas/);
    assert.match(pathHtml, /trail-running[\s\S]*data-fb-tip="correr"[\s\S]*trail-football[\s\S]*data-fb-tip="futebol"[\s\S]*trail-performance[\s\S]*data-fb-tip="evoluir"[\s\S]*trail-health[\s\S]*data-fb-tip="saude"/);
    assert.doesNotMatch(pathHtml, /trail-card[\s\S]{0,500}data-platform-target=/, 'Cada trilha precisa abrir seu próprio guia, não uma seção genérica.');
    assert.match(appScript, /function renderProfilePresentation\(\)/);
    assert.match(appScript, /profileEditMode = false;[\s\S]*saveProfile\(\{[\s\S]*name, location, photoDataUrl, sportProfile, story, publicAge, profession, publicEnabled/);
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
    assert.match(diaryScript, /function resizeEntryPhoto\(file\)/);
    assert.match(diaryScript, /visibility === 'public'[\s\S]*publishEntry\(entry\)/);
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
    assert.doesNotMatch(redirects, /\.netlify\/functions/, 'O deploy ativo usa Pages Functions diretamente, sem proxies legados.');
    assert.match(redirects, /\/meu-caminho-be\/\*\s+\/meu-caminho-be\.html\s+200/, 'As subpáginas do Meu Caminho Be precisam abrir diretamente.');
    assert.match(redirects, /\/diario\/\*\s+\/perfil-publico\?perfil=:splat\s+200/, 'Os links públicos do Diário BE precisam preservar o identificador ao abrir.');
    assert.doesNotMatch(redirects, /^\/reportagens\s+/m, 'A rota /reportagens deve ser resolvida diretamente pelo arquivo reportagens.html, sem redirecionamento de caixa.');

    const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    assert.match(serviceWorker, /CACHE_NAME = `\$\{CACHE_PREFIX\}v137`/);
    const coreShellSource = serviceWorker.match(/const CORE_SHELL = \[([\s\S]*?)\];/)?.[1] || '';
    const coreShell = [...coreShellSource.matchAll(/'([^']+)'/g)].map(match => match[1]);
    const currentAppAssets = [...pathHtml.matchAll(/(?:href|src)="(\/(?:css|js)\/[^"?]+|\/site-common\.css)(?:\?[^"#]+)?"/g)]
      .map(match => match[1]);
    for (const asset of currentAppAssets) {
      assert.ok(coreShell.includes(asset), `O cache offline precisa incluir a dependência atual ${asset}.`);
    }
    for (const asset of coreShell) {
      assert.doesNotMatch(asset, /\?v=/, 'O app shell deve usar caminhos estáveis e ignorar a query somente no fallback offline.');
    }
    assert.ok(coreShell.includes('/css/components/community-comments.css'), 'O estilo carregado dinamicamente pelos comentários precisa funcionar offline.');
    assert.match(serviceWorker, /cache\.addAll\(CORE_SHELL\)/, 'As dependências essenciais precisam ser instaladas como um conjunto completo.');
    assert.match(serviceWorker, /Promise\.allSettled\(OPTIONAL_SHELL\.map/, 'Uma mídia opcional indisponível não pode cancelar a instalação do PWA.');
    assert.match(serviceWorker, /caches\.match\(request, \{ ignoreSearch: true \}\)/, 'O fallback offline precisa aceitar a versão atual do HTML sem manter URLs antigas manualmente.');
    assert.match(serviceWorker, /key\.startsWith\(CACHE_PREFIX\)/, 'A ativação deve remover apenas caches pertencentes ao Meu Caminho Be.');
    assert.match(serviceWorker, /url\.pathname\.startsWith\('\/meu-caminho-be\/'\)/, 'O app precisa continuar acessível offline em suas subpáginas.');
    assert.match(serviceWorker, /url\.pathname\.startsWith\('\/api\/'\)/, 'O service worker não deve armazenar respostas privadas de API.');

    const syncFunction = fs.readFileSync(path.join(root, 'functions/api/meu-caminho-sync.js'), 'utf8');
    assert.match(syncFunction, /algorithm === 'AES-GCM'/);
    assert.match(syncFunction, /lastMutationId/);
    assert.match(syncFunction, /be-sync-verifier/);

    const routineFunction = fs.readFileSync(path.join(root, 'functions/api/routine-notifications/[[path]].js'), 'utf8');
    const routineCore = fs.readFileSync(path.join(root, 'server/routine-notifications-core.mjs'), 'utf8');
    const routineWorker = fs.readFileSync(path.join(root, 'workers/routine-notifications.js'), 'utf8');
    const routineConfig = fs.readFileSync(path.join(root, 'workers/wrangler.notifications.jsonc'), 'utf8');
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
