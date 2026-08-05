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
    assert.ok(manifestBody.shortcuts.some(shortcut => shortcut.url.includes('tela=evolucao')));
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
    assert.match(elasReport, /site-common\.css\?v=20260723-3[\s\S]*reportagens\.css\?v=20260805-9/);
    assert.doesNotMatch(elasReport, /elas-photo-badge/);
    assert.match(elasReport, /mulheres-em-movimento-serra-talhada-interna\.jpg/);
    for (const image of ['mulheres-em-movimento-serra-talhada-interna.jpg', 'mulheres-em-movimento-serra-talhada-interna-640.webp', 'mulheres-em-movimento-serra-talhada-interna-960.webp', 'mulheres-em-movimento-serra-talhada-interna-1440.webp']) {
      assert.ok(fs.existsSync(path.join(root, 'img', image)), `Imagem interna da reportagem ausente: ${image}`);
    }
    const reportCss = fs.readFileSync(path.join(root, 'css', 'reportagens.css'), 'utf8');
    assert.match(reportCss, /\.reportagens-page \.elas-story-header\s*\{[\s\S]*?display:\s*grid\s*!important/);
    assert.match(reportCss, /\.reportagens-page \.elas-story-header\s*\{[\s\S]*?position:\s*static\s*!important/);
    assert.match(reportCss, /\.report-card-elas \.report-media-stack > \.report-cover\s*\{[\s\S]*?object-position:\s*right center[\s\S]*?transform:\s*scale\(1\.22\)/);
    const homeHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert.match(homeHtml, /class="hero-slide hero-slide-news hero-slide-elas active"/);
    assert.match(homeHtml, /href="\/reportagens\/elas-em-movimento-serra-talhada">Ler reportagem/);
    assert.doesNotMatch(elasReport, /mulheres-em-acao-funcional-serra-talhada/);
    for (const image of ['mulheres-em-movimento-serra-talhada-sem-logo.jpg', 'mulheres-em-movimento-serra-talhada-sem-logo-640.webp', 'mulheres-em-movimento-serra-talhada-sem-logo-960.webp', 'mulheres-em-movimento-serra-talhada-sem-logo-1440.webp']) {
      assert.ok(fs.existsSync(path.join(root, 'img', image)), `Imagem da reportagem ausente: ${image}`);
    }
    assert.match(pathHtml, /id="fb-photo-checkin"[^>]*data-feature-state="paused"[^>]*hidden/);
    for (const id of ['fb-continuity-create', 'fb-continuity-output', 'fb-continuity-connect-form', 'fb-continuity-input']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Fluxo de continuidade ausente: ${id}`);
    }
    assert.match(pathHtml, /Criptografado no aparelho/);
    assert.doesNotMatch(pathHtml, /id="fb-login-form"/);
    for (const panel of ['inicio', 'progresso', 'evolucao', 'explorar', 'perfil']) {
      assert.match(pathHtml, new RegExp(`data-fb-panel="${panel}"`), `Área principal do app ausente: ${panel}`);
      assert.match(pathHtml, new RegExp(`class="fb-app-nav"[\\s\\S]*?data-fb-view="${panel}"`), `Navegação principal ausente: ${panel}`);
    }
    for (const destination of ['ferramentas', 'conteudos', 'especialistas', 'gols']) {
      assert.match(pathHtml, new RegExp(`class="fb-nav-desktop-only" data-fb-view="${destination}"`), `Atalho lateral ausente: ${destination}`);
    }
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
    assert.match(pathHtml, /class="fb-human-media"[\s\S]*?id="fb-human-image" src="img\/bruno-rafael-resende-treino-funcional\.jpg"/);
    assert.match(pathHtml, /id="fb-checkin-barrier"/);
    assert.match(pathHtml, /id="fb-week-review-form"/);
    assert.match(pathHtml, /id="fb-view-announcer"[^>]*aria-live="polite"/);
    assert.match(pathHtml, /id="be-ia"[^>]*aria-labelledby="be-ia-title"/);
    assert.match(pathHtml, /id="be-ia-context"/);
    assert.match(pathHtml, /id="be-ia-answer"[^>]*aria-live="polite"/);
    assert.match(pathHtml, /js\/be-ia\.js\?v=20260729-1/);
    assert.match(pathHtml, /css\/meu-caminho-modern\.css\?v=20260729-5/);
    assert.match(pathHtml, /js\/fala-bem-app\.js\?v=20260731-1/);
    assert.match(pathHtml, /css\/meu-caminho-diary\.css\?v=20260805-3/);
    assert.match(pathHtml, /class="fb-app-brand" href="\/"/, 'O logo do cabeçalho precisa voltar para a home principal.');
    assert.match(pathHtml, /class="be-showcase-brand" href="\/"[^>]*><strong>MEU CAMINHO BE<\/strong><\/a>/, 'A identificação da apresentação deve ter somente o texto clicável.');
    assert.match(pathHtml, /js\/meu-caminho-diary\.js\?v=20260731-3/);
    assert.doesNotMatch(pathHtml, /class="be-showcase-phones"/);
    for (const id of ['be-quick-form', 'be-entry-form', 'be-diary-timeline', 'be-week-chart', 'be-history-timeline']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Experiência de diário ausente: ${id}`);
    }
    for (const id of ['fb-profile-photo', 'fb-profile-photo-preview', 'fb-profile-email', 'fb-profile-city', 'fb-profile-state']) {
      assert.match(pathHtml, new RegExp(`id="${id}"`), `Campo de cadastro ausente: ${id}`);
    }
    assert.match(pathHtml, /id="fb-safety-form" novalidate/);
    assert.match(pathHtml, /id="fb-safety-feedback"[^>]*aria-live="assertive"/);
    assert.match(pathHtml, /id="fb-safety-submit"/);
    assert.match(pathHtml, /class="fb-app-menu fb-ecosystem-menu"[\s\S]*?data-fb-view="progresso"[\s\S]*?data-fb-view="evolucao"[\s\S]*?data-fb-view="perfil"[\s\S]*?data-fb-view="ferramentas"[\s\S]*?data-fb-view="conteudos"[\s\S]*?data-fb-view="especialistas"/);

    const beIa = fs.readFileSync(path.join(root, 'js/be-ia.js'), 'utf8');
    assert.match(beIa, /function getJourneyContext\(profile\)/);
    assert.match(beIa, /const safetyPatterns = \[/);
    assert.match(beIa, /function buildResponse\(query, context\)/);
    assert.match(beIa, /bemEsportivo:analytics/);
    assert.doesNotMatch(beIa, /interactions\.push\(\{[^}]*query/, 'A Be IA não deve guardar o texto livre do usuário.');

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
    assert.match(diaryCss, /fb-nav-desktop-only\[data-fb-view="ferramentas"\]\{display:flex!important\}/, 'O menu lateral precisa exibir o acesso a Ferramentas.');
    assert.match(diaryCss, /fb-app-topbar \.fb-app-brand\{display:flex;min-width:0\}/, 'O cabeçalho mobile precisa manter o logo visível.');
    assert.match(diaryCss, /be-showcase-copy>a:not\(\.be-showcase-brand\)/, 'A marca da apresentação não pode receber o visual do botão principal.');

    const appScript = fs.readFileSync(path.join(root, 'js/fala-bem-app.js'), 'utf8');
    assert.match(appScript, /function recordJourneyStep\(/);
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

    const reportPageFile = fs.readdirSync(root).find(fileName => fileName.toLowerCase() === 'reportagens.html');
    assert.equal(reportPageFile, 'reportagens.html', 'O arquivo de Reportagens precisa usar minúsculas para coincidir com a URL do menu no Cloudflare.');

    const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
    assert.match(redirects, /\/api\/analytics\/events\s+\/\.netlify\/functions\/analytics/);
    assert.match(redirects, /\/api\/routine-notifications\/\*/);
    assert.doesNotMatch(redirects, /^\/reportagens\s+/m, 'A rota /reportagens deve ser resolvida diretamente pelo arquivo reportagens.html, sem redirecionamento de caixa.');

    const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    assert.match(serviceWorker, /CACHE_NAME = 'meu-caminho-be-v72'/);
    assert.match(serviceWorker, /\/js\/fala-bem-app\.js\?v=20260731-1/);
    assert.match(serviceWorker, /\/css\/meu-caminho-modern\.css\?v=20260729-5/);
    assert.match(serviceWorker, /\/img\/bruno-rafael-resende-treino-funcional\.jpg/);
    assert.match(serviceWorker, /\/js\/be-ia\.js\?v=20260729-1/);
    assert.match(serviceWorker, /\/js\/meu-caminho-diary\.js\?v=20260731-3/);
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
