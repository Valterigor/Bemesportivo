const { test, expect } = require('@playwright/test');
for (const width of [390, 1280]) {
  test('vitrine e cadastro de interesse em ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/loja');
    await page.getByRole('button', { name: 'Recusar opcionais' }).click();
    await expect(page.locator('.store-product')).toHaveCount(6);
    await expect(page.getByText('A próxima coleção começa com a sua escolha.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Revisar pedido' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Tenho interesse', exact: true }).first().click();
    await page.getByLabel('Tamanho desejado').selectOption('M');
    await page.getByLabel('Seu nome').fill('Teste local');
    await page.getByLabel('WhatsApp com DDD').fill('11999990000');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Registrar meu interesse' }).click();
    await expect(page.locator('#store-form-status')).toContainText('Teste local registrado');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.route('**/api/store-interest', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }));
    await page.getByLabel('Seu nome').fill('Teste local');
    await page.getByLabel('WhatsApp com DDD').fill('11999990000');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Registrar meu interesse' }).click();
    await expect(page.locator('#store-form-status')).toContainText('Não conseguimos confirmar');
  });
}
