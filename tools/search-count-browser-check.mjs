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
const pageHTML = `<!DOCTYPE html><html lang="de"><meta charset="utf-8"><title>Pedipalpus – lokale Oberflächenprüfung</title><link rel="stylesheet" href="/styles/pedipalpus.css"><link rel="stylesheet" href="/styles/workbench.css"><link rel="stylesheet" href="/styles/feedback.css"><link rel="stylesheet" href="/styles/atmosphere.css"><style>body{background:#11151a;color:#f0eee9;font:14px system-ui;margin:0;padding:26px}#app{max-width:540px;margin:auto;border:1px solid #414751;border-radius:9px;overflow:hidden}.preview-label{max-width:540px;margin:0 auto 14px;color:#aaa;font-size:12px}#notice{margin:8px auto;max-width:540px}.mock-dialog{position:fixed;top:70px;left:50%;transform:translateX(-50%);width:min(520px,90vw);max-height:80vh;overflow:auto;padding:24px;background:#272d34;border:1px solid #c9aa6e;box-shadow:0 12px 70px #000;border-radius:8px;z-index:99}.mock-dialog label{display:block}.mock-dialog button{margin:10px 5px;padding:8px}.mock-dialog input,.mock-dialog select{padding:8px;max-width:100%}.mock-dialog h2{font-size:20px}.mock-dialog footer{display:flex;justify-content:flex-end}</style><p class="preview-label">Pedipalpus 1.11.21 · Vorschau mit simulierter Foundry-Umgebung</p><main id="app"></main><div id="notice"></div><script>window.previewChecksVersion=${JSON.stringify(checksVersion)}</script><script type="module" src="/tools/browser-runtime.js"></script></html>`;
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





 const raw=retinueFixture();raw.AcademicSkills[0].Subskills=['Geographie','Kartographie','Heraldik','Buchführung'].map(Name=>({Name,TotalValue:8}));await page.evaluate(async raw=>{const{normalizeCharacter}=await import('/scripts/data.js'),{checkReference,referenceKey}=await import('/scripts/workbench.js'),character={...normalizeCharacter(raw),sourceJSON:JSON.stringify(raw)};window.countActor=await foundry.documents.Actor.create({name:'Suchzählprüfung',type:'character',flags:{'pedipalpus-foundry':{character}}});window.countBefore=JSON.stringify(countActor.flags);window.countApp=await game.modules.get('pedipalpus-foundry').api.open(countActor.id);const geo=checkReference(character.checks.find(row=>row.name==='Geographie')),note=referenceKey(checkReference(character.checks.find(row=>row.name==='Heraldik')));await countApp.persist({...countApp.preferences,sound:false,animations:'none',favorites:{[countActor.id]:[geo]},figures:{[countActor.id]:{notes:{[note]:'Lehnsfolge prüfen'},weaponSets:[]}}});await countApp.render();},raw);
 const query=page.locator('[name="search"]'),scope=page.locator('.pp-search-scope'),idle=()=>page.waitForFunction(()=>!countApp.busy&&!countApp.referenceBusy);
 assert.equal(await scope.isVisible(),false);await query.fill('Geographie');assert.equal(await scope.innerText(),'1 Probe · Suche in allen Bereichen');assert.equal(await page.locator('.pp-quick-check').count(),1);await query.fill('graphie');assert.equal(await scope.innerText(),'2 Proben · Suche in allen Bereichen');await query.fill('nicht vorhandene Probe');assert.equal(await scope.innerText(),'0 Proben · Suche in allen Bereichen');assert.equal(await page.locator('.pp-no-results').isVisible(),true);await page.locator('[name="category"]').selectOption('attributes');await query.fill('graphie');assert.equal(await scope.innerText(),'2 Proben · Suche in allen Bereichen');assert.equal(await page.locator('.pp-check-row:not([hidden])').count(),2);
 console.log('PASS: Search reports singular, plural and zero matching probes, counts a pinned favorite only once and remains global across the selected category.');
 await query.fill('Derekunde');assert.equal(await scope.innerText(),'4 Proben · Suche in allen Bereichen');await query.fill('Lehnsfolge');assert.equal(await scope.innerText(),'1 Probe · Suche in allen Bereichen');assert.match(await page.locator('.pp-check-row:not([hidden]) .pp-check-name').innerText(),/Heraldik/);await page.evaluate(async()=>countApp.render());assert.equal(await scope.innerText(),'1 Probe · Suche in allen Bereichen');await query.press('Escape');assert.equal(await scope.isVisible(),false);await query.fill('   ');assert.equal(await scope.isVisible(),false);await query.fill('Geographie');await page.locator('[data-search-clear]').click();assert.equal(await scope.isVisible(),false);
 console.log('PASS: Talent-family and personal-note matches count correctly; rerender keeps the count while Escape, blank text and the clear button hide it.');
 await page.locator('[data-action="battle"]').click();await idle();await query.fill('Testdämon');const expected=await page.evaluate(()=>countActor.getFlag('pedipalpus-foundry','character').checks.filter(row=>row.companionGroup==='demons').length);assert.ok(expected>5);assert.equal(await scope.innerText(),`${expected} Proben · Suche in allen Bereichen`);assert.equal(await page.locator('[data-companion-section]:not([hidden])').count(),1);await page.locator('[data-search-clear]').click();assert.equal(await scope.isVisible(),false);await page.locator('[data-action="full"]').click();await idle();
 console.log('PASS: Combat companion search counts actual matching probe rows without counting overview cards or weapon headers as additional probes.');
 await page.setViewportSize({width:412,height:900});for(const theme of ['fantasy','ork','demonic','aristocrat','warrior','arcane','sneaky','dark','light']){await page.evaluate(async theme=>{await(await import('/scripts/design.js')).saveDesign(theme);await countApp.render();},theme);await query.fill('graphie');assert.equal(await scope.innerText(),theme==='ork'?'2 Dinge · Überall suchen.':'2 Proben · Suche in allen Bereichen');await page.locator('.pp-root').evaluate(el=>el.style.fontSize='16.25px');assert.equal(await page.locator('.pp-root').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);}await page.evaluate(async()=>{countActor.isOwner=false;countActor.canUserModify=()=>false;await countApp.render();});await query.fill('Geographie');assert.match(await scope.innerText(),/^1 Probe/);assert.equal(await page.locator('.pp-dice-button:not([disabled])').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify(countActor.flags)),await page.evaluate(()=>countBefore));assert.equal(await page.evaluate(()=>testMessages.length),0);assert.deepEqual(errors,[]);await page.screenshot({path:path.resolve(root,'../artifacts/search-count-1.11.21.png')});
 console.log('PASS: All nine themes show localized counts in a narrow window with larger text; observers can search without gaining roll rights or changing character data.');
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
