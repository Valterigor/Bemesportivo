const { test, expect } = require('@playwright/test');
const path = require('node:path');

test('busca combina biblioteca, profissional e ferramenta para a modalidade', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  });
  await page.goto('/');
  await page.locator('#be-ecosystem-search-input').fill('Quero melhorar meu saque no vôlei');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A Biblioteca BeM encontrou este caminho' })).toBeVisible();
  await expect(page.locator('#be-search-result-query')).toContainText('voleibol');
  await expect(page.locator('#be-ecosystem-search-results')).toContainText('Dicas para um bom saque no voleibol');
  await expect(page.locator('#be-ecosystem-search-results')).toContainText('Benefícios do voleibol para a saúde');
  await expect(page.locator('#be-ecosystem-search-results')).toContainText('Bruno Rezende — Personal Trainer');
  await expect(page.locator('#be-ecosystem-search-results')).toContainText('Água diária');
  await expect(page.locator('#be-ecosystem-search-results')).not.toContainText('Minha primeira corrida');
  await expect(page.locator('#be-ecosystem-search-results')).toHaveAttribute('aria-label', '5 resultados encontrados');
});

test('busca responde objetivos de treino e suplementos pela Biblioteca BeM', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2, necessary: true, measurement: false, advertising: false, updatedAt: new Date().toISOString()
    }));
  });
  await page.goto('/');
  const input = page.locator('#be-ecosystem-search-input');
  const results = page.locator('#be-ecosystem-search-results');

  await input.fill('Quero treinar pernas');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  await expect(results).toContainText('Como organizar um treino de pernas e glúteos');
  await expect(results).not.toContainText('Explore a Biblioteca BeM');
  await results.getByRole('button', { name: /Como organizar um treino de pernas/ }).click();
  const legsAnswer = page.getByRole('dialog', { name: /Como organizar um treino de pernas/ });
  await expect(legsAnswer.getByRole('listitem')).toHaveCount(4);
  await legsAnswer.getByRole('button', { name: 'Voltar aos resultados' }).click();

  await input.fill('Como ganhar massa muscular?');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  await expect(results).toContainText('Como construir massa muscular com consistência');
  await results.getByRole('button', { name: /Como construir massa muscular/ }).click();
  const muscleAnswer = page.getByRole('dialog', { name: /Como construir massa muscular/ });
  await expect(muscleAnswer).toBeVisible();
  await expect(muscleAnswer.getByRole('listitem')).toHaveCount(4);
  await muscleAnswer.getByRole('button', { name: 'Voltar aos resultados' }).click();

  await input.fill('Creatina faz mal?');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  await results.getByRole('button', { name: /Suplemento não substitui/ }).click();
  const supplementAnswer = page.getByRole('dialog', { name: /Suplemento não substitui/ });
  await expect(supplementAnswer).toContainText('profissional de saúde');
  await supplementAnswer.getByRole('button', { name: 'Voltar aos resultados' }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await input.fill('Como perder barriga?');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  await expect(results).toContainText('Emagrecimento sem promessa de atalho');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('busca mostra primeiros passos objetivos para começar a nadar', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  });
  await page.goto('/');
  await page.locator('#be-ecosystem-search-input').fill('Quero começar a nadar');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  const results = page.locator('#be-ecosystem-search-results');
  await expect(results).toContainText('Primeiros passos para começar na natação');
  await expect(results).toContainText('Escolha uma piscina segura e supervisionada');
  await expect(results).toContainText('Benefícios da natação para a saúde');
  await expect(results).toContainText('Bruno Rezende — Personal Trainer');
  await expect(results).toContainText('Dicas práticas para começar');
  await expect(results.getByRole('link', { name: /Dicas práticas para começar/ }).locator('img'))
    .toHaveAttribute('src', '/img/jornada-esportiva-atleta-por-do-sol.webp');
  await expect(results).not.toContainText('Minha primeira corrida');
  await expect(results).toHaveAttribute('aria-label', '4 resultados encontrados');
  const resultUrl = page.url();
  await results.getByRole('button', { name: /Primeiros passos para começar na natação/ }).click();
  const answer = page.getByRole('dialog', { name: 'Primeiros passos para começar na natação' });
  await expect(answer).toBeVisible();
  await expect(answer.getByRole('listitem')).toHaveCount(4);
  await expect(answer).toContainText('Procure uma aula para iniciantes');
  await expect(page).toHaveURL(resultUrl);
  await answer.getByRole('button', { name: 'Voltar aos resultados' }).click();
  await expect(answer).toBeHidden();
});

test('busca sem resposta exata oferece temas correlacionados da Biblioteca BeM', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2, necessary: true, measurement: false, advertising: false, updatedAt: new Date().toISOString()
    }));
  });
  await page.goto('/');
  await page.locator('#be-ecosystem-search-input').fill('O que é bom pra tomar pra dar força?');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Não encontramos uma resposta exata' })).toBeVisible();
  await expect(page.locator('#be-search-result-query')).toContainText('temas mais próximos');
  const results = page.locator('#be-ecosystem-search-results');
  await expect(results).toContainText('Como evoluir força, carga e repetições');
  await expect(results).toContainText('Suplemento não substitui alimentação e treino');
  await expect(results).not.toContainText('Leve sua dúvida para a comunidade');
  await results.getByRole('button', { name: /Suplemento não substitui/ }).click();
  await expect(page.getByRole('dialog', { name: /Suplemento não substitui/ })).toContainText('profissional de saúde');
  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('busca remove duplicados e respeita intenção de vídeo e apoio emocional', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  });
  await page.goto('/');
  const input = page.locator('#be-ecosystem-search-input');
  const results = page.locator('#be-ecosystem-search-results');

  await input.fill('Quero melhorar meu ritmo na corrida');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  await expect(results.getByText('Calculadora Pace', { exact: true })).toHaveCount(1);

  await input.fill('Quero assistir vídeos de yoga');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  await expect(results.getByRole('link', { name: /Assistir conteúdos sobre yoga/ })).toHaveAttribute('href', '/beplay');

  await input.fill('Estou ansioso antes do jogo de futebol');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  await expect(results).toContainText('Grasiele — Psicóloga');
  await expect(results).not.toContainText('Luciano — Personal Soccer');
});

test('primeiro acesso começa pelo Perfil Be antes de liberar a jornada', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  });
  await page.goto('/');
  await expect(page.locator('.home-redesign > section').first()).toHaveAttribute('id', 'inicio');
  await page.locator('#be-ecosystem-search-input').fill('Quero registrar o que fiz hoje');
  await page.getByRole('button', { name: 'Encontrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Encontramos para você' })).toBeVisible();
  const searchDestination = page.locator('#be-ecosystem-search-results').getByRole('link', { name: /Meu Caminho Be/ });
  await expect(searchDestination).toHaveAttribute('href', '/meu-caminho-be/registrar');
  await searchDestination.click();
  await expect(page).toHaveURL(/\/meu-caminho-be\/registrar$/);
  await expect(page.locator('#fala-bem-app')).toHaveClass(/fb-onboarding-active/);
  await expect(page.getByRole('heading', { name: 'Primeiro, queremos conhecer você no esporte.' })).toBeVisible();
  await expect(page.locator('.fb-app-nav')).toBeVisible();
  await expect(page.locator('.fb-app-nav [data-fb-view="perfil"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.fb-app-nav [data-fb-view="inicio"]')).not.toHaveClass(/is-active/);
  await expect(page.locator('#fb-profile-name')).toBeVisible();
  await expect(page.locator('#fb-profile-email')).toHaveCount(0);
  await page.locator('#fb-profile-name').fill('Pessoa Teste');
  await page.locator('#fb-profile-sport').selectOption('corrida');
  await page.getByRole('button', { name: 'Concluir perfil e acessar' }).click();
  await expect(page).toHaveURL(/\/meu-caminho-be\/jornada$/);
  await expect(page.locator('.journey-profile-link')).toBeVisible();
  await expect(page.locator('.fb-profile-trigger > span').last()).toHaveText('Pessoa Teste');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('meuCaminhoBeProfileV1')).email)).toBeUndefined();
  await expect(page.getByRole('heading', { name: 'Qual é o seu principal objetivo?' })).toBeVisible();
  await expect(page.locator('#journey-name')).toHaveCount(0);
  await expect(page.locator('[data-step-indicator="1"]')).toHaveClass(/complete/);
  await expect(page.locator('.fb-app-nav')).toBeVisible();
  await expect(page.locator('.fb-app-nav [data-fb-view="ferramentas"]')).not.toHaveAttribute('data-fb-gated', 'true');
  await page.locator('.fb-app-nav [data-fb-view="ferramentas"]').click();
  await expect(page).toHaveURL(/\/meu-caminho-be\/ferramentas$/);
  await expect(page.locator('[data-fb-panel="ferramentas"]')).toBeVisible();
  await expect(page.locator('.fb-app-nav [data-fb-view="registrar"]')).toHaveAttribute('data-fb-gated', 'true');
  await page.locator('.fb-app-nav [data-fb-view="registrar"]').click();
  await expect(page).toHaveURL(/\/meu-caminho-be\/jornada$/);
  await expect(page.getByRole('heading', { name: 'Qual é o seu principal objetivo?' })).toBeVisible();
});

test('menu móvel segue as seis etapas e o Perfil revela opções sob demanda', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
      name: 'Pessoa Teste',
      email: 'dado-legado@example.com',
      identityCreatedAt: new Date().toISOString(),
      objective: 'comecar',
      practice: 'none',
      availability: '15',
      progress: 1,
      createdAt: new Date().toISOString()
    }));
  });

  await page.goto('/meu-caminho-be/perfil');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('meuCaminhoBeProfileV1')).email)).toBeUndefined();
  await page.locator('#fb-mobile-menu-toggle').click();
  const primaryLabels = await page.locator('#fb-mobile-drawer section').first().locator('[data-fb-view]').evaluateAll(buttons =>
    buttons.map(button => button.textContent.replace(/^[^\p{L}\p{N}]+/u, '').trim())
  );
  expect(primaryLabels).toEqual(['Perfil', 'Meu Hoje', 'Registrar', 'Jornada', 'Explorar', 'Ferramentas']);
  await page.locator('#fb-mobile-drawer-close').click();

  await page.locator('#be-profile-edit').click();
  await expect(page.locator('.be-profile-optional-fields')).toBeVisible();
  await expect(page.locator('#fb-profile-city')).toBeHidden();
  await page.locator('.be-profile-optional-fields > summary').click();
  await expect(page.locator('#fb-profile-city')).toBeVisible();
  await expect(page.locator('.be-profile-management')).toBeVisible();
  await expect(page.locator('.be-profile-management')).not.toHaveAttribute('open', '');
});

test('Ferramentas abre nos menus desktop e móvel antes de criar o Perfil Be', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  });

  await page.goto('/meu-caminho-be/perfil');
  const desktopTools = page.locator('.fb-app-nav [data-fb-view="ferramentas"]');
  await expect(desktopTools).not.toHaveAttribute('data-fb-gated', 'true');
  await desktopTools.click();
  await expect(page).toHaveURL(/\/meu-caminho-be\/ferramentas$/);
  await expect(page.locator('[data-fb-panel="ferramentas"]')).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/meu-caminho-be/perfil');
  await page.locator('#fb-mobile-menu-toggle').click();
  const toolsButton = page.locator('#fb-mobile-drawer [data-fb-view="ferramentas"]');
  await expect(toolsButton).not.toHaveAttribute('data-fb-gated', 'true');
  await toolsButton.click();
  await expect(page).toHaveURL(/\/meu-caminho-be\/ferramentas$/);
  await expect(page.locator('[data-fb-panel="ferramentas"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Escolha uma ferramenta' })).toBeVisible();
});

test('menu mantém o encaixe correto no computador, tablet e celular', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  });

  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto('/meu-caminho-be/perfil');
  await page.evaluate(() => window.scrollTo(0, 220));

  const desktopLayout = await page.evaluate(() => {
    const header = document.querySelector('.fb-app-topbar').getBoundingClientRect();
    const navigation = document.querySelector('.fb-app-nav').getBoundingClientRect();
    return {
      headerBottom: Math.round(header.bottom),
      navigationTop: Math.round(navigation.top),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    };
  });
  expect(desktopLayout.navigationTop).toBeGreaterThanOrEqual(desktopLayout.headerBottom + 20);
  expect(desktopLayout.overflow).toBe(0);

  for (const viewport of [
    { width: 900, height: 800 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/meu-caminho-be/perfil');
    const toggle = page.locator('#fb-mobile-menu-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    const drawer = page.locator('#fb-mobile-drawer');
    await expect(drawer).toBeVisible();
    await expect.poll(async () => (await drawer.boundingBox()).x).toBeGreaterThanOrEqual(-1);
    const drawerBox = await drawer.boundingBox();
    expect(drawerBox.width).toBeLessThanOrEqual(360);
    expect(drawerBox.width).toBeLessThan(viewport.width);
    await expect(page.locator('body')).toHaveClass(/fb-mobile-menu-open/);
    await page.locator('#fb-mobile-drawer-close').click();
    await expect(drawer).toBeHidden();
  }
});

test('recursos do menu móvel abrem a rota e a seção exatas', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
      name: 'Pessoa Rotas',
      identityCreatedAt: new Date().toISOString(),
      objective: 'comecar',
      practice: 'none',
      availability: '15',
      progress: 1,
      createdAt: new Date().toISOString()
    }));
  });

  await page.goto('/meu-caminho-be');
  const destinations = [
    ['dicas', /\/meu-caminho-be\/ferramentas\/guias$/, '[data-fb-panel="dicas"]'],
    ['gols', /\/meu-caminho-be\/ferramentas\/contador-de-gols$/, '[data-fb-panel="gols"]'],
    ['especialistas', /\/meu-caminho-be\/ferramentas\/profissionais$/, '#especialistas'],
    ['modalidades', /\/meu-caminho-be\/ferramentas\/modalidades$/, '#modalidades'],
    ['comunidade', /\/meu-caminho-be\/ferramentas\/comunidade$/, '#ecossistema-comunidade']
  ];

  for (const [view, route, section] of destinations) {
    await page.locator('#fb-mobile-menu-toggle').click();
    const destinationButton = page.locator(`#fb-mobile-drawer [data-fb-view="${view}"]`);
    await destinationButton.click();
    await expect(page).toHaveURL(route);
    await expect(page.locator(section)).toBeVisible();
    await expect(destinationButton).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('#fb-mobile-drawer')).toBeHidden();
  }
});

test('cada botão de trilha abre o guia correspondente', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
      name: 'Pessoa Trilhas',
      identityCreatedAt: new Date().toISOString(),
      objective: 'comecar',
      practice: 'none',
      availability: '15',
      progress: 1,
      createdAt: new Date().toISOString()
    }));
  });

  await page.goto('/meu-caminho-be/ferramentas/trilhas');
  const trails = [
    ['Minha primeira corrida', 'Alterne caminhada e corrida para construir sua base.'],
    ['Futebol com inteligência', 'Jogue melhor entendendo seu papel em cada momento.'],
    ['Performance sustentável', 'Mude uma variável por vez e acompanhe a resposta.'],
    ['Vida mais saudável', 'Construa uma rotina que cuide do movimento e da recuperação.']
  ];

  for (const [trailTitle, guideTitle] of trails) {
    await expect(page.locator('#trilhas')).toBeVisible();
    await page.getByRole('heading', { name: trailTitle }).locator('..').getByRole('button', { name: /(?:Começar|Continuar) trilha/ }).click();
    await expect(page).toHaveURL(/\/meu-caminho-be\/ferramentas\/guias$/);
    await expect(page.locator('#fb-practical-guide').getByRole('heading', { name: guideTitle })).toBeVisible();
    await page.evaluate(() => window.falaBemOpenView('trilhas'));
    await expect(page).toHaveURL(/\/meu-caminho-be\/ferramentas\/trilhas$/);
  }
});

test('atalhos da home indicam e movimentam a navegacao lateral no mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const track = page.locator('.be-ecosystem-products');
  const hint = page.locator('#be-products-scroll-hint');
  await expect(hint).toBeVisible();
  await expect(hint).toContainText('Deslize para explorar');
  await expect(hint.locator('.be-products-scroll-dot')).toHaveCount(8);
  await expect.poll(() => track.evaluate(element => element.scrollLeft), { timeout: 6500 }).toBeGreaterThan(0);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(hint).toBeHidden();
});

test('produtos da home abrem seus destinos exatos', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
      name: 'Pessoa Teste',
      identityCreatedAt: new Date().toISOString(),
      objective: 'comecar',
      practice: 'none',
      age: '30-44',
      availability: '15',
      progress: 1,
      createdAt: new Date().toISOString()
    }));
  });
  const destinations = [
    { name: /Conhecimento/, href: '/meu-caminho-be?tela=conteudos', finalPath: '/meu-caminho-be/ferramentas/conteudos', ready: '#be-learn-title' },
    { name: /BEplay/, href: '/beplay', finalPath: '/beplay', ready: '#beplayTitle' },
    { name: /Reportagens/, href: '/reportagens', finalPath: '/reportagens', ready: 'h1' },
    { name: /Game 3D/, href: '/game', finalPath: '/game', ready: '#game-container' },
    { name: /Profissionais/, href: '/profissionais', finalPath: '/profissionais', ready: '#professionals-hero-title' },
    { name: /Ferramentas/, href: '/meu-caminho-be?tela=ferramentas', finalPath: '/meu-caminho-be/ferramentas', ready: '#tools-title' },
    { name: /Produtos/, href: '/produtos', finalPath: '/produtos', ready: 'h1' },
    { name: /Meu Caminho Be/, href: '/meu-caminho-be', finalPath: '/meu-caminho-be', ready: '#fala-bem-app' }
  ];

  for (const destination of destinations) {
    await page.goto('/');
    const link = page.locator('.be-ecosystem-products').getByRole('link', { name: destination.name });
    await expect(link).toHaveAttribute('href', destination.href);
    await link.click({ noWaitAfter: true });
    await expect(page).toHaveURL(new RegExp(`${destination.finalPath.replace('.', '\\.')}$`));
    await expect(page.locator(destination.ready).first()).toBeVisible();
  }
});

test('PWA abre uma subpágina do Meu Caminho Be sem conexão', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) runtimeErrors.push(message.text());
  });
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
      name: 'Pessoa Offline',
      identityCreatedAt: new Date().toISOString(),
      objective: 'comecar',
      practice: 'none',
      age: '30-44',
      availability: '15',
      progress: 1,
      createdAt: new Date().toISOString()
    }));
  });
  await page.goto('/meu-caminho-be');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  await context.setOffline(true);
  try {
    const response = await page.goto('/meu-caminho-be/jornada');
    expect(response?.status()).toBe(200);
    await expect(page.locator('#fala-bem-app')).toBeVisible();
    await expect(page.locator('.fb-app-nav [data-fb-view="progresso"]')).toHaveAttribute('aria-current', 'page');
    const localStyles = await page.evaluate(() => [...document.styleSheets]
      .filter(sheet => sheet.href?.startsWith(location.origin))
      .map(sheet => {
        try { return { href: sheet.href, rules: sheet.cssRules.length }; } catch { return { href: sheet.href, rules: -1 }; }
      }));
    expect(localStyles.filter(sheet => sheet.rules < 1), JSON.stringify(localStyles, null, 2)).toEqual([]);
    expect(runtimeErrors).toEqual([]);
  } finally {
    await context.setOffline(false);
  }
});

test('BEPlay oferece uma ação real para acompanhar o canal', async ({ page }) => {
  await page.goto('/beplay');
  const follow = page.getByRole('link', { name: 'Seguir o Bem Esportivo no Instagram' });
  await expect(follow).toBeVisible();
  await expect(follow).toHaveAttribute('href', 'https://www.instagram.com/bemesportivo/');
  await expect(page.getByRole('button', { name: 'Inscrever-se' })).toHaveCount(0);
});

test('Profissionais orienta a escolha e preserva busca, perfil e contato no responsivo', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/profissionais');
  await expect(page.getByRole('heading', { name: 'Encontre quem pode ajudar no seu próximo passo.' })).toBeVisible();
  await expect(page.locator('.card')).toHaveCount(4);

  await page.getByRole('button', { name: /Quero cuidar da mente/ }).click();
  await expect(page.locator('.card')).toHaveCount(1);
  await expect(page.locator('#result-count')).toHaveText('1 profissional encontrado');
  await expect(page.locator('.card h3')).toHaveText('Grasiele');

  const profileButton = page.getByRole('button', { name: 'Solicitar informações' });
  await profileButton.click();
  await expect(page.locator('#modal')).toHaveClass(/show/);
  await expect(page.getByText('O Bem Esportivo apresenta o perfil, mas não confirma contratação ou horário.')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar perfil' }).click();
  await expect(page.locator('#modal')).not.toHaveClass(/show/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/profissionais');
  const responsiveLayout = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    columns: getComputedStyle(document.querySelector('.guidance-grid')).gridTemplateColumns.split(' ').length
  }));
  expect(responsiveLayout.overflow).toBe(0);
  expect(responsiveLayout.columns).toBe(1);
  await expect(page.getByRole('heading', { name: 'Profissionais para o seu caminho' })).toBeVisible();
});

test('zerar processo apaga a jornada e confirma o recomeço', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({
      version: 2,
      necessary: true,
      measurement: false,
      advertising: false,
      updatedAt: new Date().toISOString()
    }));
    if (!location.search.includes('reiniciado=1')) {
      localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
        name: 'Teste Be',
        objective: 'começar',
        experience: 'iniciante',
        availableTime: '20',
        createdAt: new Date().toISOString()
      }));
      localStorage.setItem('meuCaminhoBeDiaryV1', JSON.stringify([{ date: '2026-08-13', activity: 'Caminhada' }]));
    }
  });
  await page.goto('/meu-caminho-be/perfil');
  await page.locator('.be-profile-management > summary').click();
  const reset = page.locator('.fb-profile-reset [data-fb-reset]');
  await expect(reset).toBeVisible();
  await reset.click();
  await expect(page.getByRole('dialog', { name: 'Zerar todo o processo?' })).toBeVisible();
  await page.getByRole('button', { name: 'Sim, zerar e recomeçar' }).click();
  await expect(page).toHaveURL(/\/meu-caminho-be\?reiniciado=1$/);
  const state = await page.evaluate(() => ({
    profile: localStorage.getItem('meuCaminhoBeProfileV1'),
    diary: JSON.parse(localStorage.getItem('meuCaminhoBeDiaryV1') || '[]'),
    meals: JSON.parse(localStorage.getItem('meuCaminhoBeMealsV1') || '[]')
  }));
  expect(state.profile).toBeNull();
  expect(state.diary).toEqual([]);
  expect(state.meals).toEqual([]);
  await expect(page.locator('#fb-celebration-title')).toHaveText('Processo zerado com sucesso.');
});

test('painel mantém a chave na sessão e apresenta a fila de moderação', async ({ page }) => {
  const token = 'chave-de-teste-administrativa-com-32-caracteres';
  await page.route('**/api/admin/overview', async route => {
    expect(route.request().headers()['x-be-admin-token']).toBe(token);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        generatedAt: '2026-08-13T15:00:00.000Z',
        community: {
          comments: 12,
          replies: 4,
          hidden: 1,
          reported: 1,
          moderation: [{
            channel: 'path:meu-caminho-be',
            id: 'comment-browser-test',
            name: 'Visitante',
            text: 'Comentário aguardando análise.',
            createdAt: '2026-08-13T14:00:00.000Z',
            reportCount: 2,
            hidden: false
          }]
        },
        services: {
          continuity: { count: 8 },
          notifications: { count: 5 },
          analytics: { count: 42 },
          ranking: { count: 19 }
        }
      })
    });
  });
  await page.goto('/admin');
  await page.getByLabel('Chave administrativa').fill(token);
  await page.getByRole('button', { name: 'Entrar no painel' }).click();
  await expect(page.getByRole('heading', { name: 'Painel Be', exact: true })).toBeVisible();
  await expect(page.locator('#metricComments')).toHaveText('12');
  await expect(page.getByText('Comentário aguardando análise.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ocultar' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('beAdminSessionToken'))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem('beAdminSessionToken'))).toBe(token);
});

test('diário preserva a cópia local quando a continuidade criptografada está indisponível', async ({ page }) => {
  let publishedBody = null;
  let syncRequests = 0;
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false }));
    localStorage.setItem('meuCaminhoBeLocalAccessV1', '1');
    localStorage.setItem('meuCaminhoBeContinuityCodeV1', 'A'.repeat(32));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
      name: 'Atleta Teste', email: 'atleta@example.com', objective: 'comecar', publicAge: 32,
      profession: 'Professora', publicEnabled: true, story: 'Minha rotina esportiva.',
      sportProfile: { modality: 'corrida', role: '', visual: 'energia' }, createdAt: new Date().toISOString()
    }));
  });
  await page.route('**/api/public-profiles/**', async route => {
    if (route.request().method() === 'POST' && !route.request().url().endsWith('/identity')) publishedBody = route.request().postDataJSON();
    await route.fulfill({
      status: route.request().method() === 'POST' ? 202 : 200,
      contentType: 'application/json',
      body: JSON.stringify(route.request().method() === 'POST'
        ? { ok: true, slug: 'be-aaaaaaaaaaaa', profileStatus: 'pending', postStatus: 'pending', publicUrl: '/perfil-publico?perfil=be-aaaaaaaaaaaa' }
        : { ok: true, slug: 'be-aaaaaaaaaaaa', record: null })
    });
  });
  await page.route('**/api/meu-caminho-sync**', async route => {
    syncRequests += 1;
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Não deveria sincronizar no modo local.' }) });
  });
  await page.goto('/meu-caminho-be/registrar');
  await page.locator('.fb-app-nav [data-fb-view="registrar"]').click();
  await page.locator('.be-register-panel [data-be-new-entry]').click();
  const dialog = page.getByRole('dialog', { name: 'Registrar atividade' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Só no meu diário')).toBeChecked();
  await dialog.getByLabel('Por quanto tempo?').fill('45');
  await dialog.getByLabel(/Como foi e o que aconteceu/).fill('Treino leve no parque com boa disposição.');
  await dialog.getByLabel('Escolher foto').setInputFiles(path.join(process.cwd(), 'img', 'app-icon-192.png'));
  await expect(dialog.locator('#be-entry-photo-preview')).toBeVisible();
  await expect(dialog.getByLabel('Compartilhar com todos')).toBeDisabled();
  await dialog.getByRole('button', { name: 'Registrar no diário' }).click();
  await expect(dialog).toBeHidden();
  expect(publishedBody).toBeNull();
  expect(syncRequests).toBe(1);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('meuCaminhoBeDiaryV1') || '[]')[0]);
  expect(saved.visibility).toBe('private');
  expect(saved.publicStatus).toBe('');
  expect(saved.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
});

test('Perfil Be esportivo permanece funcional e sem overflow nas larguras principais', async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    localStorage.setItem('bemEsportivoPrivacyConsentV1', JSON.stringify({ version: 2, necessary: true, measurement: false, advertising: false }));
    localStorage.setItem('meuCaminhoBeProfileV1', JSON.stringify({
      name: 'Atleta Responsivo', objective: 'evoluir', identityCreatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
      story: 'Minha historia e construida no esporte.', sportProfile: { modality: 'corrida', role: '', visual: 'energia' }
    }));
    localStorage.setItem('meuCaminhoBeDiaryV1', JSON.stringify([
      { id: 'run-1', date: new Date().toISOString().slice(0, 10), type: 'treino', title: 'Corrida', duration: 42, distance: 7.2, note: 'Treino consistente.', visibility: 'private', createdAt: new Date().toISOString() }
    ]));
    localStorage.setItem('meuCaminhoBeSportsPostsV1', JSON.stringify([
      { id: 'sport-private-1', postType: 'training', occurredAt: new Date().toISOString().slice(0, 10), activity: 'Corrida', text: 'Meu momento esportivo.', visibility: 'private', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ]));
  });
  await page.goto('/meu-caminho-be/perfil');
  await expect(page.locator('#be-profile-presentation')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Atleta Responsivo' })).toBeVisible();
  await expect(page.locator('#be-profile-metric-activities')).toHaveText('1');
  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `overflow horizontal em ${width}px`).toBeLessThanOrEqual(1);
  }
  await page.locator('#be-profile-tab-evolution').click();
  await expect(page.locator('#be-profile-panel-evolution')).toBeVisible();
  await page.locator('#be-profile-tab-achievements').click();
  await expect(page.locator('#be-profile-panel-achievements')).toBeVisible();
  await page.locator('#be-profile-create-post').click();
  await expect(page.locator('#be-public-compose-dialog')).toBeVisible();
  await expect(page.locator('#be-public-compose-dialog input[name="visibility"][value="private"]')).toBeChecked();
  await expect(page.locator('#be-public-compose-visibility-help')).toContainText(/privada/i);
  await expect(page.locator('#be-public-compose-dialog input[name="visibility"][value="public"]')).toBeDisabled();
  await page.locator('#be-public-compose-close').click();
  await page.locator('#be-profile-tab-posts').click();
  await page.locator('[data-profile-post-visibility="sport-private-1"]').click();
  await expect(page.locator('#fb-profile-form')).toBeVisible();
  await expect(page.locator('#be-public-profile-settings-title')).toBeVisible();
  await page.locator('#be-profile-cancel-edit').click();
  await page.goto('/meu-caminho-be/jornada');
  await page.waitForTimeout(350);
  await page.locator('#fb-daily-welcome[open] #fb-welcome-close').click({ timeout: 2000 }).catch(() => {});
  const profileAccess = page.locator('.be-diary-profile-link:visible, .journey-profile-link:visible').first();
  await expect(profileAccess).toBeVisible();
  await profileAccess.click();
  await expect(page).toHaveURL(/\/meu-caminho-be\/perfil$/);
});
