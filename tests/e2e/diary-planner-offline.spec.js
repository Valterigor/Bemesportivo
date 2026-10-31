const {test,expect}=require('@playwright/test');
const profile={name:'Teste Offline',identityCreatedAt:'2026-10-31T15:00:00.000Z',createdAt:'2026-10-31T15:00:00.000Z'};
test('Planner Esportivo Be abre e mantém compromissos offline',async({page,context})=>{
 await page.addInitScript(({profile})=>localStorage.setItem('meuCaminhoBeProfileV1',JSON.stringify(profile)),{profile});
 await page.goto('/diario-app/?planner=1');
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker?.controller));
 await page.locator('#planner-title').fill('Alongamento offline');
 await page.locator('#planner-form').getByRole('button',{name:'Salvar no planner'}).click();
 await context.setOffline(true);
 await page.reload();
 await expect(page.locator('#planner .intro h1')).toHaveText('Planner Esportivo Be');
 await expect(page.locator('#planner-list')).toContainText('Alongamento offline');
 await context.setOffline(false);
});
