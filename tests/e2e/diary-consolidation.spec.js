const {test,expect}=require('@playwright/test');
const profile={name:'Teste do diário',identityCreatedAt:'2026-10-31T17:00:00.000Z',createdAt:'2026-10-31T17:00:00.000Z'};
test.use({serviceWorkers:'block'});
test('home apresenta somente Meu Diário Be como produto pessoal',async({page})=>{
 await page.goto('/');
 await expect(page.locator('.be-site-journey')).toHaveText(/Meu Diário Be/);
 await expect(page.getByText('Meu Caminho Be',{exact:true})).toHaveCount(0);
 await expect(page.locator('a[href="/meu-caminho-be/perfil"]')).toHaveCount(0);
});
test('rota antiga de perfil conduz quem já tem acesso ao diário moderno',async({page})=>{
 await page.addInitScript(({profile})=>localStorage.setItem('meuCaminhoBeProfileV1',JSON.stringify(profile)),{profile});
 await page.goto('/meu-caminho-be/perfil');
 await expect(page).toHaveURL(/\/diario-app\/$/);
 await expect(page.locator('#greeting')).toContainText('Teste');
});
