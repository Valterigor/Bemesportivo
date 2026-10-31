const {test,expect}=require('@playwright/test');
const profile={name:'Teste Planner',identityCreatedAt:'2026-10-31T12:00:00.000Z',createdAt:'2026-10-31T12:00:00.000Z'};
test.use({serviceWorkers:'block'});
test('planner organiza o dia e mantém a conclusão no aparelho',async({page})=>{
 await page.addInitScript(({profile})=>{localStorage.setItem('meuCaminhoBeProfileV1',JSON.stringify(profile));localStorage.setItem('bemEsportivoPrivacyConsentV1',JSON.stringify({version:2,necessary:true,measurement:false,advertising:false}));},{profile});
 await page.goto('/diario-app/');
 await page.locator('nav [data-tab=planner]').click();
 await expect(page.locator('#planner-calendar-grid button')).toHaveCount(await page.evaluate(()=>new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()));
 await expect(page.locator('#planner-calendar-grid .is-today')).toHaveCount(1);
 await page.locator('#planner-title').fill('Caminhar por 30 minutos');
 await page.locator('#planner-category').selectOption('movimento');
 await page.locator('#planner-form').getByRole('button',{name:'Salvar no planner'}).click();
 await expect(page.locator('#planner-list')).toContainText('Caminhar por 30 minutos');
 await page.locator('.planner-task input[type=checkbox]').check();
 await expect(page.locator('#planner-message')).not.toBeEmpty();
 await page.reload();await page.locator('nav [data-tab=planner]').click();
 await expect(page.locator('.planner-task input[type=checkbox]')).toBeChecked();
 await page.locator('#planner-finish').click();
 await expect(page.locator('#planner-message')).toContainText('Você realizou tudo');
 const firstDay=await page.evaluate(()=>`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-01`);
 await page.locator(`#planner-calendar-grid [data-date="${firstDay}"]`).click();
 await expect(page.locator('#planner-date')).toHaveValue(firstDay);
 await expect(page.locator('#planner-calendar-grid .is-selected')).toHaveAttribute('data-date',firstDay);
 for(const width of [320,390,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
});
