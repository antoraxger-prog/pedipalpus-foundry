import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { fixture, combatFixture, retinueFixture, npcFixture } from '../tests/fixture.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PEDIPALPUS_PLAYWRIGHT || 'playwright');
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const checksVersion = process.env.PEDIPALPUS_CHECKS_VERSION || '1.0.14';
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.6 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
const uploadedImages = new Map();
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if(url.pathname==='/preview-upload' && request.method==='POST'){
      const target=url.searchParams.get('path');if(!/^worlds\/test-world\/pedipalpus-portraits\/[a-f0-9]{64}\.png$/.test(target??''))throw new Error('Invalid upload');
      const chunks=[];for await(const chunk of request)chunks.push(chunk);uploadedImages.set('/'+target,Buffer.concat(chunks));return response.end('Uploaded');
    }
    if(url.pathname==='/icons/svg/mystery-man.svg'){response.setHeader('Content-Type','image/svg+xml');return response.end('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#6e634c"/><circle cx="32" cy="23" r="12" fill="#d6c5a1"/><path d="M10 64V54c0-24 44-24 44 0v10" fill="#d6c5a1"/></svg>');}
    if(uploadedImages.has(url.pathname)){response.setHeader('Content-Type','image/png');return response.end(uploadedImages.get(url.pathname));}
    if (url.pathname === '/') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); return response.end(pageHTML); }
    let target;
    if (url.pathname === '/checks-reference.js') target = fileURLToPath(new URL(`../../pedipalpus-checks/ucurifunke-v${checksVersion}/${checksVersion === '1.0.8' ? 'ucurifunke-checks/' : ''}scripts/ucurifunke-checks.js`, import.meta.url));
    else { target = path.resolve(root, '.' + url.pathname); if (!target.startsWith(root + path.sep)) throw new Error('Invalid path'); }
    response.setHeader('Content-Type', target.endsWith('.wav') ? 'audio/wav' : target.endsWith('.svg') ? 'image/svg+xml' : target.endsWith('.css') ? 'text/css' : 'text/javascript');
    response.end(await fs.readFile(target));
  } catch { response.statusCode = 404; response.end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.PEDIPALPUS_BROWSER});const page=await browser.newPage({viewport:{width:1200,height:1000}}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(10000);
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.previewReady);

 const idle=()=>page.waitForFunction(()=>Array.from(foundry.applications.api.ApplicationV2.instances()).every(app=>!app.busy&&!app.referenceBusy));
 const seed=async raw=>{await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js');const actor=await foundry.documents.Actor.create({name:raw.Npc?.Name??raw.Name,type:'character',img:'icons/svg/mystery-man.svg',prototypeToken:{texture:{src:'kept-token.webp'}},ownership:{default:0,player:3},flags:{'pedipalpus-foundry':{character:{...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)}}}});window.comparisonActor=actor;await game.modules.get('pedipalpus-foundry').api.open(actor.id);},raw);await idle();};
 const state=()=>page.evaluate(()=>({id:comparisonActor.id,img:comparisonActor.img,token:comparisonActor.prototypeToken.texture.src,ownership:comparisonActor.ownership,character:comparisonActor.getFlag('pedipalpus-foundry','character'),actors:game.actors.contents.length}));
 const compare=async(raw,{expectDiff=true}={})=>{
   if(!await page.locator('.pp-administration').isVisible())await page.locator('[data-action="administration"]').click();await page.locator('[data-action="import"]').click();
   const npc=raw.Format==='Pedipalpus.Npc';await page.locator(`[data-import-kind="${npc?'npc':'character'}"]`).click();
   await page.locator(`[name="${npc?'npcFile':'characterFile'}"]`).setInputFiles({name:npc?'test.nsc.json':'test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(raw))});
   await page.waitForFunction(()=>document.querySelector('.mock-dialog [data-action="import"]')?.disabled===false);await page.locator('[name="destination"]').selectOption(await page.evaluate(()=>comparisonActor.id));await page.locator('[name="includeImages"]').uncheck();
   await page.locator('.mock-dialog [data-action="import"]').click();if(expectDiff)await page.locator('.pp-import-diff').waitFor();else{await idle();assert.equal(await page.locator('.mock-dialog').count(),0);}
 };
 const diffRows=()=>page.locator('.pp-import-diff tbody tr').evaluateAll(rows=>rows.map(row=>Array.from(row.cells).map(cell=>cell.textContent)));
 const own=combatFixture();own.MeleeWeapons[0].Damage='1W6+2';await seed(own);const original=await state();const next=structuredClone(own);next.MeleeWeapons[0].Damage='2W6+3';
 await compare(next);assert.deepEqual(await diffRows(),[['Rapier · Angriff · Schaden','1W6+2','2W6+3']]);
 await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.deepEqual(await state(),original);
 console.log('PASS: A damage-only weapon import opens a comparison with exact old/new formulas; cancellation preserves the complete figure, token and rights.');
 await compare(next);await page.screenshot({path:path.resolve(root,'../artifacts/schadensvergleich-1.11.6.png')});await page.locator('.mock-dialog [data-action="accept"]').click();await idle();
 const accepted=await state();assert.equal(accepted.id,original.id);assert.equal(accepted.actors,original.actors);assert.equal(accepted.img,original.img);assert.equal(accepted.token,original.token);assert.deepEqual(accepted.ownership,original.ownership);assert.equal(JSON.parse(accepted.character.sourceJSON).MeleeWeapons[0].Damage,'2W6+3');assert.equal(accepted.character.checks.find(check=>check.id==='combat:MeleeWeapons:0:attack').damage,'2W6+3');
 console.log('PASS: Accepting the damage-only import updates the same actor and source formula without changing images, ownership or actor count.');
 await compare(next,{expectDiff:false});const unchanged=await state();assert.equal(unchanged.character.sourceJSON,accepted.character.sourceJSON);assert.equal(unchanged.img,accepted.img);assert.equal(unchanged.token,accepted.token);assert.deepEqual(unchanged.ownership,accepted.ownership);assert.equal(unchanged.actors,accepted.actors);
 console.log('PASS: Reimporting the unchanged damage data adds no comparison dialog and preserves source bytes, images and rights.');
 const retinue=retinueFixture();for(const group of ['Animals','Demons','Undead'])for(const member of retinue[group])for(const attack of member.Attacks)attack.DamageExpression='1W6+2';await seed(retinue);const retinueBefore=await state(),retinueNext=structuredClone(retinue);for(const group of ['Animals','Demons','Undead'])for(const member of retinueNext[group])for(const attack of member.Attacks)attack.DamageExpression='3W6+1';
 await compare(retinueNext);const creatureRows=await diffRows();assert.equal(creatureRows.length,4);assert.ok(creatureRows.every(row=>row[0].endsWith(' · Schaden')&&row[1]==='1W6+2'&&row[2]==='3W6+1'));for(const name of ['Skelett','Testdämon','Wache'])assert.ok(creatureRows.some(row=>row[0].includes(name)));
 await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.deepEqual(await state(),retinueBefore);
 console.log('PASS: Animal, demon and undead melee/ranged damage changes are shown separately; cancellation leaves existing companions and their source untouched.');
 const npc=npcFixture();npc.Npc.Weapons[0].Damage='1W6+2';for(const member of npc.Npc.Retinue)for(const attack of member.Attacks)attack.Damage='1W6+2';await seed(npc);const npcBefore=await state(),npcNext=structuredClone(npc);npcNext.Npc.Weapons[0].Damage='2W6+4';for(const member of npcNext.Npc.Retinue)for(const attack of member.Attacks)attack.Damage='2W6+4';
 await compare(npcNext);const npcRows=await diffRows();assert.equal(npcRows.length,8);assert.ok(npcRows.every(row=>row[0].endsWith(' · Schaden')));assert.equal(npcRows.filter(row=>row[1]==='1W6+2'&&row[2]==='2W6+4').length,8);assert.ok(npcRows.some(row=>row[0].includes('Testaxt')));
 await page.locator('.mock-dialog [data-action="accept"]').click();await idle();const npcAfter=await state();assert.equal(npcAfter.id,npcBefore.id);assert.deepEqual(npcAfter.ownership,npcBefore.ownership);assert.equal(npcAfter.actors,npcBefore.actors);assert.equal(npcAfter.character.checks.filter(check=>check.companionGroup&&check.damage).length,7);assert.ok(npcAfter.character.checks.filter(check=>check.companionGroup&&check.damage).every(check=>check.damage==='2W6+4'));assert.equal(JSON.parse(npcAfter.character.sourceJSON).Npc.Weapons[0].Damage,'2W6+4');assert.equal(npcAfter.character.sourceFormat,'Pedipalpus.Npc');
 console.log('PASS: The separate NPC importer compares damage for all seven supported retinue kinds and accepts without converting the NPC into a character or creating new actors.');
 const escaped=structuredClone(next);escaped.MeleeWeapons[0].Damage='<img src=x onerror="window.comparisonInjected=true">';await page.evaluate(async id=>{window.comparisonActor=game.actors.get(id);await game.modules.get('pedipalpus-foundry').api.open(id);},original.id);await idle();await compare(escaped);assert.ok((await diffRows()).some(row=>row[2]===escaped.MeleeWeapons[0].Damage));assert.equal(await page.locator('.pp-import-diff img').count(),0);assert.equal(await page.evaluate(()=>window.comparisonInjected),undefined);await page.locator('.mock-dialog [data-action="cancel"]').click();await idle();assert.deepEqual(errors,[]);
 console.log('PASS: Formula text is escaped in the comparison; imported markup cannot create images or execute code, and no browser errors occurred.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}

