const {test,expect}=require('@playwright/test');
const profile={name:'Teste do painel',identityCreatedAt:'2026-10-01T12:00:00.000Z',createdAt:'2026-10-01T12:00:00.000Z'};
test.use({serviceWorkers:'block'});
test('abertura original leva ao dashboard e histórico é preservado',async({page})=>{
 await page.addInitScript(({profile})=>{if(!localStorage.getItem('dashboard-test-seeded')){localStorage.setItem('dashboard-test-seeded','1');localStorage.setItem('meuCaminhoBeProfileV1',JSON.stringify(profile));localStorage.setItem('meuCaminhoBeDiaryV1',JSON.stringify([{id:'old-1',date:'2026-10-20',type:'corrida',title:'Minha corrida anterior',duration:30,note:'Minha anotação privada',createdAt:'2026-10-20T12:00:00Z',updatedAt:'2026-10-20T12:00:00Z'}]));}localStorage.setItem('bemEsportivoPrivacyConsentV1',JSON.stringify({version:2,necessary:true,measurement:false,advertising:false}));},{profile});
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/meu-caminho-be');
 await page.locator('#be-diary-cover').click();await page.locator('#be-diary-welcome-continue').click();
 await expect(page).toHaveURL(/\/diario-app\/$/);
 await expect(page.locator('#recent-list')).toContainText('Minha corrida anterior');
 const old=await page.evaluate(()=>localStorage.getItem('meuCaminhoBeDiaryV1'));
 await page.locator('#entry-title').fill('Meu novo registro');await page.getByRole('button',{name:'Salvar meu registro',exact:true}).click();
 await expect(page.locator('#recent-list')).toContainText('Meu novo registro');
 await page.reload();await expect(page.locator('#recent-list')).toContainText('Meu novo registro');
 await expect(page.locator('#progress-stats strong').first()).toHaveText('2');
 await page.locator('#recent-list').getByRole('button',{name:'Criar post',exact:true}).first().click();
 await expect(page.locator('#post-caption')).toHaveValue('');
 const download=page.waitForEvent('download');await page.locator('#download-post').click();expect((await download).suggestedFilename()).toMatch(/\.png$/);
 await page.locator('nav [data-tab=records]').click();
 const backup=page.waitForEvent('download');await page.locator('#export').click();expect((await backup).suggestedFilename()).toMatch(/\.json$/);
 page.on('dialog',dialog=>dialog.accept());
 await page.locator('#record-list .moment').filter({hasText:'Minha corrida anterior'}).getByRole('button',{name:'Excluir',exact:true}).click();
 await page.reload();await expect(page.locator('#record-list')).not.toContainText('Minha corrida anterior');
 expect(await page.evaluate(()=>localStorage.getItem('meuCaminhoBeDiaryV1'))).toBe(old);
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});await page.locator('nav [data-tab=today]').click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.locator('.profile').click();await expect(page).toHaveURL(/versao=anterior/);
 await expect(page.locator('.be-dashboard-return')).toHaveCount(1);
});
test('restaurar cópia não sobrescreve registros e novos perfis têm armazenamento separado',async({page})=>{
 await page.goto('/');await page.evaluate(p=>localStorage.setItem('meuCaminhoBeProfileV1',JSON.stringify(p)),profile);await page.goto('/diario-app/');
 await page.locator('nav [data-tab=records]').click();page.on('dialog',d=>d.accept());
 const data={version:1,records:[{id:'backup-1',title:'Registro da cópia',date:'2026-10-20',note:'Minha lembrança'}]};
 await page.locator('#restore-backup').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
 await expect(page.locator('#record-list')).toContainText('Registro da cópia');
 data.records[0].title='Não deve substituir';
 await page.locator('#restore-backup').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
 await expect(page.locator('#record-list')).not.toContainText('Não deve substituir');
 await page.evaluate(()=>{localStorage.setItem('meuCaminhoBeProfileV1',JSON.stringify({name:'Outro perfil',identityCreatedAt:'2026-10-27T10:00:00Z'}));});await page.reload();
 await expect(page.locator('#recent-list')).not.toContainText('Registro da cópia');
});
test('entrada sem perfil mantém criação de acesso antes do painel',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/meu-caminho-be');await page.locator('#be-diary-cover').click();await page.locator('#be-diary-welcome-continue').click();await page.getByRole('button',{name:'Recusar opcionais',exact:true}).click();await page.locator('#fb-profile-name').fill('Nova pessoa');await page.locator('#fb-profile-sport').selectOption('corrida');await page.locator('#fb-profile-save').click();await expect(page).toHaveURL(/\/diario-app\/$/);await expect(page.locator('#greeting')).toContainText('Nova');
});
